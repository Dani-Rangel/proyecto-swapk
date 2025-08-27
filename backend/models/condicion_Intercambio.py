from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
import enum

class CondicionIntercambio(Base):
    __tablename__ = "condicion_intercambio"
    id = Column(Integer, primary_key=True)
    intercambio_id = Column(Integer, ForeignKey("intercambios.id"))
    condicion = Column(String(255))