from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
import enum

class Curso(Base):
    __tablename__ = "cursos"
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255))
    descripcion = Column(Text)
    objetivo = Column(String(255))
    User_Id = Column(Integer, ForeignKey("usuarios.id"))
    img_Cursos = Column(String(255), nullable= True)
