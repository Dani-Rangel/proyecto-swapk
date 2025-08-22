from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
import enum

class NivelEnum(str, enum.Enum):
    PRINCIPIANTE = "Principiante"
    INTERMEDIO = "Intermedio"
    EXPERTO = "Experto"

class TipoEnum(str, enum.Enum):
    OFRECE = "Ofrece"
    BUSCA = "Busca"

class perfilHabilidad(Base):
    __tablename__ = "Perfil_Habilidad"
    id = Column(Integer, primary_key=True)
    intercambio_id = Column(Integer, ForeignKey("intercambio.id"))
    habilidad_id = Column(Integer, ForeignKey("habilidad.id"))
    tipo = Column(Enum(TipoEnum))
    nivel = Column(Enum(NivelEnum))