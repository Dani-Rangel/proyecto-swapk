from backend.db import Base
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date
from sqlalchemy.orm import relationship


class Perfil(Base):
    __tablename__ = "perfiles"

    id = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    # (NO duplicados con Usuario)
    descripcion = Column(Text, nullable=True)
    ubicacion = Column(String(255), nullable=True)
    telefono = Column(String(20), nullable=True)
    foto_perfil = Column(String(500), nullable=True)  
    sitio_web = Column(String(500), nullable=True)
    fecha_nacimiento = Column(Date, nullable=True)  

    # Relación con Usuario
    usuario = relationship("Usuario", back_populates="perfil", uselist=False)


    # Relación con Publicacion
    publicaciones = relationship("Publicacion", back_populates="perfil")

    def __repr__(self):
        return f"<Perfil(id={self.id}, usuario_id={self.id_usuario})>"