from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query, Body
from typing import List
from backend.services.chats.ws_manager import ws_manager, Connection
from backend.services.chats.firebase_client_services import firestore_db
from backend.services.chats.auth_ws import get_user_from_token_sync
from backend.services.oauth2 import get_current_user
from backend.models.chats import Chat, ChatUsuario, TipoChat
from backend.models.mensaje import Mensaje
from backend.db.database import get_db

from google.cloud import firestore

# SQLAlchemy
from sqlalchemy import func
from sqlalchemy.orm import Session
import datetime
import json

router = APIRouter(prefix="/chats", tags=["Chats"])


# --- WebSocket endpoint para chat en tiempo real ---
@router.websocket("/ws/{chat_id}")
async def chat_ws(websocket: WebSocket, chat_id: int, token: str = Query(None)):
    # print(f"🔌 Intentando conectar WebSocket para chat_id: {chat_id}")  # LOG
    await websocket.accept()

    if not token:
        # print("Token no proporcionado")  # LOG
        await websocket.close(code=1008)
        return

    db: Session = next(get_db())
    user = None
    try:
        user = get_user_from_token_sync(token, db)
        if user is None:
            # print("Usuario no autenticado")  # LOG
            await websocket.close(code=1008)
            db.close()
            return

        # print(f"Usuario autenticado en WebSocket: {user.id}")  # LOG
        conn = Connection(websocket=websocket, user_id=user.id)
        ws_manager.add(chat_id, conn)
        # print(f"Usuario {user.id} conectado al chat {chat_id}")  # LOG

        while True:
            payload = await websocket.receive_json()
            # print(f"Mensaje recibido: {payload}")  # LOG

            if payload.get("type") == "message":
                contenido_raw = payload.get("content")
                if contenido_raw is None:
                    # print("Contenido es null, ignorado")
                    continue

                contenido = str(contenido_raw).strip()
                
                # print(f"Mensaje recibido RAW: {repr(contenido_raw)}")
                # print(f"Mensaje después de strip(): '{contenido}'")

                if not contenido:
                    # print("Mensaje vacío recibido, ignorado")
                    continue

                # Abrir NUEVA sesión solo para esta operación
                db_msg = next(get_db())
                try:
                    new_message = Mensaje(
                        chat_id=chat_id,
                        id_usuario=user.id,
                        contenido=contenido,
                        tipo=payload.get("tipo", "texto"),
                        leido=False
                    )
                    db_msg.add(new_message)
                    db_msg.commit()
                    db_msg.refresh(new_message)

                    # print(f"💾 Mensaje guardado en SQL con ID: {new_message.id}")

                    # Guardar en Firestore
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
                    doc_ref = msgs_ref.add(firestore_data)
                    doc_id = doc_ref[1].id  # Obtener el ID del documento
                    # print(f" Mensaje guardado en Firestore con ID: {doc_id}")

                    # Notificar a todos los usuarios conectados
                    await ws_manager.broadcast(chat_id, {"type": "message", "message": firestore_data})
                    # print("Mensaje transmitido a todos los usuarios conectados")

                    # Notificar actualización global
                    await ws_manager.broadcast(0, {"type": "chat_update", "chat_id": chat_id})
                    # print(" Notificación global enviada")

                except Exception as e:
                    db_msg.rollback()
                    # print(f"Error guardando mensaje: {e}")
                finally:
                    db_msg.close()

    except WebSocketDisconnect:
        if 'conn' in locals():
            ws_manager.remove(chat_id, conn)
    except Exception as e:
        if 'conn' in locals():
            ws_manager.remove(chat_id, conn)
    finally:
        db.close()
        # print(" Sesión de DB cerrada al finalizar WebSocket")


# --- Obtener todos los chats del usuario actual ---
@router.get("/")
def get_user_chats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):

    #  Obtener todos los chats donde el usuario está involucrado
    chats = (
        db.query(Chat)
        .join(Chat.usuarios)
        .filter(ChatUsuario.usuario_id == current_user.id)
        .all()
    )

    result = []
    for chat in chats:
        # Obtener el último mensaje del chat
        last_message = (
            db.query(Mensaje)
            .filter(Mensaje.chat_id == chat.id)
            .order_by(Mensaje.fecha.desc())
            .first()
        )

        # Obtener los usuarios del chat
        usuarios = [{"id": cu.usuario.id, "nombre": cu.usuario.nombre} for cu in chat.usuarios]

        result.append({
            "chat_id": chat.id,
            "tipo": chat.tipo,
            "usuarios": usuarios,
            "ultimo_mensaje": last_message.contenido if last_message else None,
            "fecha_ultimo_mensaje": last_message.fecha.isoformat() if last_message else None
        })
    return {"chats": result}


# --- Obtener mensajes de un chat ---
@router.get("/{chat_id}/messages")
def get_messages(chat_id: int, limit: int = 50, after: str = None, current_user=Depends(get_current_user)):
    try:
        # print(f"Obteniendo mensajes para chat_id: {chat_id}, usuario: {current_user.id}")  # LOG

        msgs_ref = firestore_db.collection("chats").document(str(chat_id)).collection("messages")
        q = msgs_ref.order_by("fecha", direction=firestore.Query.ASCENDING).limit(limit)  # Orden ascendente
        docs = q.stream()
        messages = [d.to_dict() for d in docs]

        # Filtrar mensajes con contenido null
        messages = [msg for msg in messages if msg.get("contenido") is not None]

        # print(f"Mensajes obtenidos: {len(messages)}")  # LOG
        return {"messages": messages}  # No revertir el orden
    except Exception as e:
        # print(f"❌ Error en get_messages: {e}")  # LOG
        raise HTTPException(status_code=500, detail=str(e))


# --- Crear un chat individual o devolver el existente ---
@router.post("/start/{other_user_id}")
def start_chat(other_user_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    try:
        # print(f"👤 Usuario actual: {current_user.id}")  # LOG
        # print(f"👥 Otro usuario: {other_user_id}")  # LOG

        if other_user_id == current_user.id:
            raise HTTPException(status_code=400, detail="No puedes iniciar un chat contigo mismo.")

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
            # print(f"💬 Chat existente encontrado: {existing_chat.id}")  # LOG
            return {"chat_id": existing_chat.id, "message": "Chat ya existente"}

        new_chat = Chat(tipo=TipoChat.individual)
        db.add(new_chat)
        db.flush()

        db.add_all([
            ChatUsuario(chat_id=new_chat.id, usuario_id=current_user.id),
            ChatUsuario(chat_id=new_chat.id, usuario_id=other_user_id)
        ])

        db.commit()
        # print(f"✅ Nuevo chat creado: {new_chat.id}")  # LOG

        return {"chat_id": new_chat.id, "message": "Chat creado exitosamente"}
    except Exception as e:
        # print(f"❌ Error en start_chat: {e}")  # LOG
        raise HTTPException(status_code=500, detail=str(e))
    

# --- Editar un mensaje (solo el dueño) ---
@router.put("/messages/{message_id}")
def edit_message(
    message_id: int,
    new_content: str = Body(..., embed=True),  # ✅ Forzar que venga en el body
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    message = db.query(Mensaje).filter(Mensaje.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    if message.id_usuario != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes editar este mensaje")

    if not new_content.strip():
        raise HTTPException(status_code=400, detail="El contenido no puede estar vacío")

    message.contenido = new_content.strip()
    message.fecha = datetime.datetime.now()
    db.commit()

    # Actualizar también en Firestore
    msgs_ref = firestore_db.collection("chats").document(str(message.chat_id)).collection("messages")
    docs = msgs_ref.where("id", "==", message_id).stream()
    for doc in docs:
        doc.reference.update({
            "contenido": message.contenido,
            "fecha": message.fecha.isoformat()
        })

    return {"message": "Mensaje actualizado", "id": message.id, "contenido": message.contenido, "fecha": message.fecha.isoformat()}


# --- Eliminar un mensaje (solo el dueño) ---
@router.delete("/messages/{message_id}")
def delete_message(message_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    message = db.query(Mensaje).filter(Mensaje.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    if message.id_usuario != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes eliminar este mensaje")

    db.delete(message)
    db.commit()

    # Eliminar también en Firestore
    msgs_ref = firestore_db.collection("chats").document(str(message.chat_id)).collection("messages")
    docs = msgs_ref.where("id", "==", message_id).stream()
    for doc in docs:
        doc.reference.delete()

    return {"message": "Mensaje eliminado", "id": message_id}