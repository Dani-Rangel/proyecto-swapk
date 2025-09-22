from backend.db import Base
from sqlalchemy import Column, Integer, Text, DateTime, Boolean, String, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime


class Mensaje(Base):
    __tablename__ = "mensajes"

    id = Column(Integer, primary_key=True)
    chat_id = Column(Integer, ForeignKey("chats.id"))
    id_usuario = Column(Integer, ForeignKey("usuarios.id"))
    contenido = Column(Text)
    tipo = Column(String(20), default="texto")  # texto, imagen, archivo
    url_archivo = Column(String(500))  # URL del archivo subido (Cloudinary/S3)
    leido = Column(Boolean, default=False)
    fecha = Column(DateTime(timezone=True), default=datetime.now)

    chat = relationship("Chat", back_populates="mensajes")
    usuario = relationship("Usuario")