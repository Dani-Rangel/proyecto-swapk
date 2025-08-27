from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
import enum
from datetime import datetime


class EstadoIntercambio(str, enum.Enum):
    Pendiente = "Pendiente"
    Confirmado = "Confirmado"
    Finalizado = "Finalizado"

class Intercambio(Base):
    __tablename__ = "intercambios"
    id = Column(Integer, primary_key=True)
    id_Perfil1 = Column(Integer, ForeignKey("perfiles.id"))
    id_Perfil2 = Column(Integer, ForeignKey("perfiles.id"))
    estado = Column(Enum(EstadoIntercambio))
    fecha_inicio = Column(DateTime, default= datetime.now)
    fecha_fin = Column(DateTime)