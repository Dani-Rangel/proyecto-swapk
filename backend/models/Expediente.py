from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
import enum

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
    Nombre = Column(String(255))
    Intitucion = Column(String(255))
    descripcion = Column(Text)
    tipo = Column(Enum(TipoExpedienteEnum))
    estado = Column(Enum(TipoEstadoEnum))
    Url_Expediente = Column(String(255))
    Fecha_Inicio = Column(DateTime)
    Fecha_Fin = Column(DateTime)
    