from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
from sqlalchemy.orm import relationship
import enum


class Perfil(Base):
    __tablename__ = "perfiles"

    id = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    # (NO duplicados con Usuario)
    descripcion = Column(Text, nullable=True)
    ubicacion = Column(String(255), nullable=True)
    Tel = Column(Integer)
    foto_perfil = Column(String(255))  

    # Relación con Usuario
    usuario = relationship("Usuario", back_populates="perfil", uselist=False)


    # Relación con Publicacion
    publicaciones = relationship("Publicacion", back_populates="perfil")

    def __repr__(self):
        return f"<Perfil(id={self.id}, usuario_id={self.id_usuario})>"
