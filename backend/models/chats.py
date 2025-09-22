from backend.db import Base
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum


class TipoChat(str, enum.Enum): 
    individual = "individual"
    grupo = "grupo"
    
class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True)
    tipo = Column(Enum(TipoChat), default=TipoChat.individual)
    nombre = Column(String(255))  # Opcional: para grupos
    fecha_creacion = Column(DateTime(timezone=True), default=datetime.now)

    usuarios = relationship("ChatUsuario", back_populates="chat")
    mensajes = relationship("Mensaje", back_populates="chat", cascade="all, delete-orphan")

class ChatUsuario(Base):
    __tablename__ = "chat_usuarios"

    chat_id = Column(Integer, ForeignKey("chats.id"), primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), primary_key=True)
    estado = Column(String(20), default="activo")
    fecha_unirse = Column(DateTime(timezone=True), default=datetime.now)

    chat = relationship("Chat", back_populates="usuarios")
    usuario = relationship("Usuario")


