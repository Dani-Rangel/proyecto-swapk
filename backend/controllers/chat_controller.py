from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query

from typing import List

from backend.utils.ws_manager import ws_manager, Connection

from backend.services.firebase_client import firestore_db
from backend.services.auth_ws import get_user_from_token_sync
from backend.services.oauth2 import get_current_user

from backend.models.chats import Chat
from backend.db.database import get_db

from sqlalchemy.orm import Session

import time
import datetime
import json

router = APIRouter(prefix="/chats", tags=["Chats"])

# --- WebSocket endpoint para chat real-time ---
@router.websocket("/ws/{chat_id}")
async def chat_ws(websocket: WebSocket, chat_id: int, token: str = Query(None)):
    # El token lo enviaremos como un query param:
    # basicamente de la siguente forma 
    # ws://host/ws/1?token=xxx
    await websocket.accept()
    if not token:
        await websocket.close(code=1008)
        return

    # obtener user vía token
    db: Session = next(get_db())
    user = get_user_from_token_sync(token, db)
    if user is None:
        await websocket.close(code=1008)
        return

    conn = Connection(websocket=websocket, user_id=user.id)
    ws_manager.add(chat_id, conn)

    try:
        # opcional: enviar últimos N mensajes al cliente al conectarse
        # obtenemos los mensajes desde el Firestore
        msgs_ref = firestore_db.collection("chats").document(str(chat_id)).collection("messages")
        docs = msgs_ref.order_by("fecha", direction=firestore_db.Query.DESCENDING).limit(50).stream()
        history = []
        for d in docs:
            data = d.to_dict()
            history.append(data)
        # enviar historial (estamos trabajando para paginearlo)
        await websocket.send_json({"type": "history", "messages": list(reversed(history))})

        while True:
            payload = await websocket.receive_json()
            # payload ejemplo: { "type": "message", "contenido": "hola", "tipo":"texto", "url_archivo": null }
            if payload.get("type") == "message":
                msg = {
                    "chat_id": chat_id,
                    "id_usuario": user.id,
                    "contenido": payload.get("contenido"),
                    "tipo": payload.get("tipo", "texto"),
                    "url_archivo": payload.get("url_archivo", None),
                    "leido": False,
                    "fecha": datetime.datetime.utcnow().isoformat()
                }
                # Guardar en Firestore
                msgs_ref.add(msg)
                # Broadcast a todos en el chat
                await ws_manager.broadcast(chat_id, {"type": "message", "message": msg})
            elif payload.get("type") in ("offer", "answer", "candidate"):
                # Mensajes de señalización para WebRTC
                await ws_manager.broadcast(chat_id, {"type": payload.get("type"), "from": user.id, "data": payload.get("data")})
            else:
                # otros tipos: typing, read, etc
                await ws_manager.broadcast(chat_id, payload)
    except WebSocketDisconnect:
        ws_manager.remove(chat_id, conn)
    except Exception as e:
        ws_manager.remove(chat_id, conn)
        await websocket.close()
        
        
@router.get("/")
def get_user_chats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """
    Devuelve todos los chats del usuario actual.
    Si no hay chats, retorna una lista vacía.
    """
    chats = db.query(Chat).filter(
        (Chat.usuario1_id == current_user.id) | (Chat.usuario2_id == current_user.id)
    ).all()
    
    return {"chats": chats}
        
@router.get("/{chat_id}/messages")
def get_messages(chat_id: int, limit: int = 50, after: str = None):
    # Consulta Firestore y devuelve mensajes, paginación simple
    msgs_ref = firestore_db.collection("chats").document(str(chat_id)).collection("messages")
    q = msgs_ref.order_by("fecha", direction=firestore_db.Query.DESCENDING).limit(limit)
    docs = q.stream()
    messages = [d.to_dict() for d in docs]
    return {"messages": list(reversed(messages))}
