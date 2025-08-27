from backend.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean, Enum
import enum
from datetime import datetime


class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("cursos.id"))
    file_url = Column(String(255))
    file_name = Column(String(100))
    file_size = Column(Integer)
    fecha_subida = Column(DateTime, default= datetime.now) 