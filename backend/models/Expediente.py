from db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
import enum
from sqlalchemy.orm import relationship

class TipoExpedienteEnum(str, enum.Enum):
    CV = "CV"
    CERTIFICADO = "Certificado"
    ACTA = "Acta"
    CARTA = "Carta"
    BECAS = "BECAS"
    CONTRATOS = "CONTRATOS"
    PROYECTOS = "PROYECTOS"

class TipoEstadoEnum(str, enum.Enum):
    EN_PROCESO = "En proceso"
    VERIFICADO = "Verificado"
    PENDIENTE = "Pendiente"
    RECHAZADO = "Rechazado"

class Expediente(Base):
    __tablename__ = "expediente"
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    nombre = Column(String(255))
    institucion = Column(String(255))
    descripcion = Column(Text)
    tipo = Column(Enum(TipoExpedienteEnum))
    estado = Column(Enum(TipoEstadoEnum))
    url_expediente = Column(String(255))
    fecha_inicio = Column(DateTime)
    fecha_fin = Column(DateTime)
    

    archivos = relationship("Archivo_Expediente", back_populates="expediente", cascade="all, delete")