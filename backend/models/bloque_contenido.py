# models/bloque_contenido.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from db import Base
import enum

class TipoBloque(str, enum.Enum):
    texto = "texto"
    video = "video"
    imagen = "imagen"
    archivo = "archivo"

class BloqueContenido(Base):
    __tablename__ = "bloque_contenido"

    id = Column(Integer, primary_key=True, index=True)
    leccion_id = Column(Integer, ForeignKey("contenido_curso.id"), nullable=False)  # apunta a una lección (nivel=2)
    tipo = Column(Enum(TipoBloque), nullable=False)
    contenido = Column(Text, nullable=False)  # URL o texto
    orden = Column(Integer, default=0, nullable=False)

    leccion = relationship("ContenidoCurso", back_populates="bloques")