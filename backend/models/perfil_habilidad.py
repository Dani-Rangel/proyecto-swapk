from backend.db import Base
from sqlalchemy import Column, Integer, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

class NivelEnum(str, enum.Enum):
    PRINCIPIANTE = "Principiante"
    INTERMEDIO = "Intermedio"
    EXPERTO = "Experto"

class TipoEnum(str, enum.Enum):
    OFRECE = "Ofrece"
    BUSCA = "Busca"

class PerfilHabilidad(Base):
    __tablename__ = "perfil_habilidad"

    id = Column(Integer, primary_key=True)
    perfil_id = Column(Integer, ForeignKey("perfiles.id"))
    habilidad_id = Column(Integer, ForeignKey("habilidades.id"))
    tipo = Column(Enum(TipoEnum))
    nivel = Column(Enum(NivelEnum))

    # Relación con Habilidad
    habilidad = relationship("Habilidad")

    @property
    def habilidad_nombre(self):
        return self.habilidad.nombre if self.habilidad else None