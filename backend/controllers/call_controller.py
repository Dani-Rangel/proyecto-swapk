# backend/controllers/call_controller.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
from jose import jwt, JWTError
import json

router = APIRouter()

# Diccionario que guardará las conexiones activas
# Estructura: { "user_id": websocket_connection }

SECRET_KEY = "tu_clave_secreta"
ALGORITHM = "HS256"

active_calls = {}

async def get_user_from_token(token: str):
    """Decodifica y valida el token JWT"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

@router.websocket("/ws/call/{user_id}")
async def call_websocket(websocket: WebSocket, user_id: str):
    """Maneja la conexión WebSocket de cada usuario para llamadas"""
    await websocket.accept()
    active_calls[user_id] = websocket
    #print(f"✅ Usuario {user_id} conectado a WebSocket de llamadas")

    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            #print(f"📩 Mensaje recibido de {user_id}: {msg}")

            target_id = str(msg.get("target"))

            # Validar que haya un destinatario
            if not target_id:
                #print("⚠️ Mensaje sin target_id, se ignora")
                continue

            # Validar que el destinatario esté conectado
            if target_id not in active_calls:
                #print(f"❌ Usuario {target_id} no está conectado")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"Usuario {target_id} no está disponible"
                }))
                continue

            # Determinar el tipo de mensaje
            msg_type = msg.get("type")

            # 1. Llamada entrante — ✅ CORREGIDO: ahora incluye el SDP
            if msg_type == "incoming_call":
                #print(f"📞 {user_id} está llamando a {target_id}")
                await active_calls[target_id].send_text(json.dumps({
                    "type": "incoming_call",
                    "caller_id": user_id,
                    "caller_name": msg.get("caller_name", "Desconocido"),
                    "sdp": msg.get("sdp")  # 👈 ¡CLAVE! Reenviar el SDP del offer
                }))
                #print(f"📤 Mensaje de incoming_call enviado a {target_id}")

            # 2. Oferta SDP
            elif msg_type == "offer":
                #print(f"📡 OFFER reenviada de {user_id} a {target_id}")
                await active_calls[target_id].send_text(json.dumps({
                    "type": "offer",
                    "sdp": msg.get("sdp"),
                    "caller_id": user_id,
                    "caller_name": msg.get("senderName", "Desconocido")
                }))

            # 3. Respuesta SDP (answer)
            elif msg_type == "answer":
                #print(f"📡 ANSWER reenviada de {user_id} a {target_id}")
                await active_calls[target_id].send_text(json.dumps({
                    "type": "answer",
                    "sdp": msg.get("sdp")
                }))

            # 4. ICE Candidate
            elif msg_type == "ice-candidate":
                #print(f"❄️ ICE CANDIDATE reenviada de {user_id} a {target_id}")
                await active_calls[target_id].send_text(json.dumps({
                    "type": "ice-candidate",
                    "candidate": msg.get("candidate")
                }))

            # 5. Finalizar llamada
            elif msg_type == "end_call":
                #print(f"🔴 Llamada terminada entre {user_id} y {target_id}")
                await active_calls[target_id].send_text(json.dumps({
                    "type": "end_call",
                    "from": user_id
                }))

            else:
                print(f"⚠️ Tipo de mensaje desconocido: {msg_type}")

    except WebSocketDisconnect:
        #print(f"❌ Usuario {user_id} desconectado")
        if user_id in active_calls:
            del active_calls[user_id]
