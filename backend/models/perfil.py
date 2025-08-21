from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
from sqlalchemy.orm import relationship
import enum

class Perfil(Base):
    __tablename__ = "perfiles"
    id = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"))
    nombre = Column(String(255), nullable=True)
    correo = Column(String(255))
    descripcion = Column(Text, nullable=True)
    ubicacion = Column(String(255))
    Tel = Column(Integer)
    foto_perfil = Column(String(255))
    habilidad_Id = Column(Integer, ForeignKey("habilidad.id"))

