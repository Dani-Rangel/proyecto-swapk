from backend.db import Base 
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum, Float
import enum
from datetime import datetime
from sqlalchemy.orm import relationship


class EstadoIntercambio(str, enum.Enum):
    Pendiente = "Pendiente"
    Confirmado = "Confirmado"
    Finalizado = "Finalizado"


class ModoIntercambio(str, enum.Enum):
    Virtual = "Virtual"
    Presencial = "Presencial"
    Hibrido = "Hibrido"

class NivelIntercambio(str, enum.Enum):
    Principiante = "Principiante"
    Intermedio = "Intermedio"
    Avanzado = "Avanzado"    

class IdiomaIntercambio(str, enum.Enum):
    Ingles = "Ingles"
    Espanol = "Espanol"
    Portugues = "Portugues"



class Intercambio(Base):
    __tablename__ = "intercambios"
    id = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario1 = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    id_perfil = Column(Integer, ForeignKey("perfiles.id"), nullable=False)
    nivel = Column(Enum(NivelIntercambio), nullable=True)
    modo = Column(Enum(ModoIntercambio), nullable=True)
    disponibilidad = Column(String(255), nullable=True) 
    idioma = Column(Enum(IdiomaIntercambio), nullable=True)
    descripcion = Column(Text, nullable=True)
    valoracion = Column(Float, default=0.0)
    estado_trueque = Column(Boolean, default=True)
    estado = Column(Enum(EstadoIntercambio), default=EstadoIntercambio.Pendiente)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    ciclo = Column(Integer, default=1) 

    usuario1 = relationship("Usuario", foreign_keys=[id_usuario1])
    perfil = relationship("Perfil", foreign_keys=[id_perfil])
    habilidades = relationship("IntercambioHabilidad", back_populates="intercambio")
    propuestas = relationship("PropuestaIntercambio", back_populates="intercambio")
    reseñas = relationship("Resena", back_populates="intercambio")