from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
from sqlalchemy.orm import relationship
import enum

class TipoHabilidad(str, enum.Enum):
    OFRECE = "ofrece"
    BUSCA = "busca"

class IntercambioHabilidad(Base):
    __tablename__ = "intercambio_habilidad"
    id = Column(Integer, primary_key=True)
    intercambio_id = Column(Integer, ForeignKey("intercambios.id"))
    habilidad_id = Column(Integer, ForeignKey("habilidad.id"))
    tipo = Column(Enum(TipoHabilidad), nullable=False) 

    intercambio = relationship("Intercambio", back_populates="habilidades")
    habilidad = relationship("Habilidad", back_populates="intercambios")