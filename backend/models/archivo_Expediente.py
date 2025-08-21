from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
import enum 
import datetime

class Archivo_Expediente(Base):
    __tablename__ = "archivo"
    id = Column(Integer, primary_key=True)
    expediente_id = Column(Integer, ForeignKey("expediente.id"))
    nombre = Column(String)
    ruta = Column(String)
    fecha_subida = Column(DateTime, default= datetime.now)