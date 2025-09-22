from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from typing import List
from backend.services.chats.ws_manager import ws_manager, Connection
from backend.services.chats.firebase_client_services import firestore_db
from backend.services.chats.auth_ws import get_user_from_token_sync
from backend.services.oauth2 import get_current_user
from backend.models.chats import Chat, ChatUsuario, TipoChat
from backend.models.mensaje import Mensaje
from backend.db.database import get_db

from google.cloud import firestore

from google.cloud.firestore import Query

# Improtaciones de sqlalchemy
from sqlalchemy import func
from sqlalchemy.orm import Session
import time
import datetime
import json

router = APIRouter(prefix="/chats", tags=["Chats"])

# --- WebSocket endpoint para chat real-time ---
@router.websocket("/ws/{chat_id}")
async def chat_ws(websocket: WebSocket, chat_id: int, token: str = Query(None)):
    print(f"🔌 Intentando conectar WebSocket para chat_id: {chat_id}") # ✅ LOG
    await websocket.accept()

    if not token:
        print("❌ Token no proporcionado") # ✅ LOG
        await websocket.close(code=1008)
        return

    db: Session = next(get_db())
    user = get_user_from_token_sync(token, db)
    if user is None:
        print("❌ Usuario no autenticado") # ✅ LOG
        await websocket.close(code=1008)
        return

    print(f"✅ Usuario autenticado: {user.id}") # ✅ LOG
    conn = Connection(websocket=websocket, user_id=user.id)
    ws_manager.add(chat_id, conn)
    print(f"👥 Usuario {user.id} conectado al chat {chat_id}") # ✅ LOG

    try:
        while True:
            payload = await websocket.receive_json()
            print(f"📩 Mensaje recibido: {payload}") # ✅ LOG

            if payload.get("type") == "message":
                # 1. Guardar en SQL
                new_message = Mensaje(
                    chat_id=chat_id,
                    id_usuario=user.id,
                    contenido=payload.get("contenido"),
                    tipo=payload.get("tipo", "texto"),
                    leido=False
                )
                db.add(new_message)
                db.commit()
                db.refresh(new_message)

                print(f"💾 Mensaje guardado en SQL con ID: {new_message.id}") # ✅ LOG

                # 2. Guardar en Firestore para sincronización
                msgs_ref = firestore_db.collection("chats").document(str(chat_id)).collection("messages")
                firestore_data = {
                    "id": new_message.id,
                    "chat_id": chat_id,
                    "id_usuario": user.id,
                    "contenido": new_message.contenido,
                    "tipo": new_message.tipo,
                    "leido": new_message.leido,
                    "fecha": new_message.fecha.isoformat()
                }
                msgs_ref.add(firestore_data)

                print("☁️ Mensaje guardado en Firestore") # ✅ LOG

                # 3. Broadcast a todos los usuarios conectados
                await ws_manager.broadcast(chat_id, {"type": "message", "message": firestore_data})
                print("📤 Mensaje transmitido a todos los usuarios conectados") # ✅ LOG

    except WebSocketDisconnect:
        ws_manager.remove(chat_id, conn)
        print(f"🔌 Usuario {user.id} desconectado del chat {chat_id}") # ✅ LOG
    except Exception as e:
        print(f"❌ Error inesperado: {e}") # ✅ LOG
        ws_manager.remove(chat_id, conn)
        
        
@router.get("/")
def get_user_chats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Devuelve todos los chats donde el usuario actual está presente.
    Incluye la información del otro usuario y el último mensaje.
    """
    chats = (
        db.query(Chat)
        .join(Chat.usuarios)
        .filter(ChatUsuario.usuario_id == current_user.id)
        .all()
    )

    result = []
    for chat in chats:
        last_message = db.query(Mensaje).filter(Mensaje.chat_id == chat.id).order_by(Mensaje.fecha.desc()).first()

        result.append({
            "chat_id": chat.id,
            "tipo": chat.tipo,
            "usuarios": [{"id": cu.usuario.id, "nombre": cu.usuario.nombre} for cu in chat.usuarios],
            "ultimo_mensaje": last_message.contenido if last_message else None,
            "fecha_ultimo_mensaje": last_message.fecha if last_message else None
        })

    return {"chats": result}
        
@router.get("/{chat_id}/messages")
def get_messages(chat_id: int, limit: int = 50, after: str = None):
    try:
        print(f"🔍 Obteniendo mensajes para chat_id: {chat_id}") # ✅ LOG
        # Consulta Firestore y devuelve mensajes, paginación simple
        msgs_ref = firestore_db.collection("chats").document(str(chat_id)).collection("messages")
        q = msgs_ref.order_by("fecha", direction=firestore.Query.DESCENDING).limit(limit)  # ✅ ¡CORREGIDO AQUÍ!
        docs = q.stream()
        messages = [d.to_dict() for d in docs]
        print(f"✅ Mensajes obtenidos: {len(messages)}") # ✅ LOG
        return {"messages": list(reversed(messages))}
    except Exception as e:
        print(f"❌ Error en get_messages: {e}") # ✅ LOG
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/start/{other_user_id}")
def start_chat(other_user_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Crea un chat individual entre el usuario actual y otro usuario.
    Si ya existe, lo devuelve.
    """
    try:
        print(f"👤 Usuario actual: {current_user.id}") # ✅ LOG
        print(f"👥 Otro usuario: {other_user_id}") # ✅ LOG

        if other_user_id == current_user.id:
            raise HTTPException(status_code=400, detail="No puedes iniciar un chat contigo mismo.")

        # Verificar si ya existe un chat entre los dos usuarios
        existing_chat = (
            db.query(Chat)
            .join(Chat.usuarios)
            .filter(Chat.tipo == TipoChat.individual)
            .filter(ChatUsuario.usuario_id.in_([current_user.id, other_user_id]))
            .group_by(Chat.id)
            .having(func.count(ChatUsuario.usuario_id) == 2)
            .first()
        )

        if existing_chat:
            print(f"💬 Chat existente encontrado: {existing_chat.id}") # ✅ LOG
            return {"chat_id": existing_chat.id, "message": "Chat ya existente"}

        # Crear nuevo chat
        new_chat = Chat(tipo=TipoChat.individual)
        db.add(new_chat)
        db.flush()

        # Agregar los dos usuarios al chat
        db.add_all([
            ChatUsuario(chat_id=new_chat.id, usuario_id=current_user.id),
            ChatUsuario(chat_id=new_chat.id, usuario_id=other_user_id)
        ])

        db.commit()
        print(f"✅ Nuevo chat creado: {new_chat.id}") # ✅ LOG

        return {"chat_id": new_chat.id, "message": "Chat creado exitosamente"}
    except Exception as e:
        print(f"❌ Error en start_chat: {e}") # ✅ LOG
        raise HTTPException(status_code=500, detail=str(e))