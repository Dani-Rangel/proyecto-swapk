from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.models import Intercambio, IntercambioHabilidad
from backend.models.usuarios import Usuario
from backend.models.perfil import Perfil
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import enum

router = APIRouter(prefix="/admin/intercambios", tags=["Intercambios Admin"])

# ===== Enums reutilizables =====
class EstadoIntercambio(str, enum.Enum):
    Pendiente = "Pendiente"
    Confirmado = "Confirmado"
    Finalizado = "Finalizado"

class ModoIntercambio(str, enum.Enum):
    Virtual = "Virtual"
    Presencial = "Presencial"
    Hibrido = "Hibrido"

class NivelIntercambio(str, enum.Enum):
    Principiante = "Principiante"
    Intermedio = "Intermedio"
    Avanzado = "Avanzado"

class IdiomaIntercambio(str, enum.Enum):
    Ingles = "Ingles"
    Espanol = "Espanol"
    Portugues = "Portugues"

# ===== Schemas =====
class IntercambioBase(BaseModel):
    id_usuario1: int
    id_perfil: int
    nivel: Optional[NivelIntercambio]
    modo: Optional[ModoIntercambio]
    disponibilidad: Optional[str]
    idioma: Optional[IdiomaIntercambio]
    descripcion: Optional[str]
    valoracion: float = 0.0
    estado_trueque: bool = True
    estado: EstadoIntercambio = EstadoIntercambio.Pendiente

class IntercambioCreate(IntercambioBase):
    pass

# UPDATE solo con campos opcionales
class IntercambioUpdate(BaseModel):
    id_usuario1: Optional[int]
    id_perfil: Optional[int]
    nivel: Optional[NivelIntercambio]
    modo: Optional[ModoIntercambio]
    disponibilidad: Optional[str]
    idioma: Optional[IdiomaIntercambio]
    descripcion: Optional[str]
    valoracion: Optional[float]
    estado_trueque: Optional[bool]
    estado: Optional[EstadoIntercambio]

# === Subesquemas para usuario y perfil relacionados (solo para mostrar) ===
class UsuarioOut(BaseModel):
    id: int
    nombre: str
    correo: str

    class Config:
        orm_mode = True

class PerfilOut(BaseModel):
    id: int
    class Config:
        orm_mode = True

# === Salida extendida con relaciones ===
class IntercambioOutExtendido(BaseModel):
    id: int
    id_usuario1: int
    id_perfil: int
    nivel: Optional[NivelIntercambio]
    modo: Optional[ModoIntercambio]
    disponibilidad: Optional[str]
    idioma: Optional[IdiomaIntercambio]
    descripcion: Optional[str]
    valoracion: float
    estado_trueque: bool
    estado: EstadoIntercambio
    fecha_creacion: datetime
    usuario1: UsuarioOut
    perfil: PerfilOut

    class Config:
        orm_mode = True

# === RUTAS ===

@router.get("/usuarios", response_model=List[UsuarioOut])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()

# GET - listar todos
@router.get("/", response_model=List[IntercambioOutExtendido])
def listar_intercambios(db: Session = Depends(get_db)):
    return db.query(Intercambio).order_by(Intercambio.fecha_creacion.desc()).all()

# GET - obtener por ID
@router.get("/{intercambio_id}", response_model=IntercambioOutExtendido)
def obtener_intercambio(intercambio_id: int, db: Session = Depends(get_db)):
    intercambio = db.query(Intercambio).filter_by(id=intercambio_id).first()
    if not intercambio:
        raise HTTPException(status_code=404, detail="Intercambio no encontrado")
    return intercambio

# POST - crear
@router.post("/", response_model=IntercambioOutExtendido)
def crear_intercambio(data: IntercambioCreate, db: Session = Depends(get_db)):
    # Validar que el usuario existe
    usuario = db.query(Usuario).filter_by(id=data.id_usuario1).first()
    if not usuario:
        raise HTTPException(status_code=400, detail=f"El usuario con ID {data.id_usuario1} no existe")

    # Validar que el perfil existe
    perfil = db.query(Perfil).filter_by(id=data.id_perfil).first()
    if not perfil:
        raise HTTPException(status_code=400, detail=f"El perfil con ID {data.id_perfil} no existe")

    # Si ambas validaciones pasan, crear el intercambio
    nuevo = Intercambio(**data.dict())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

# PUT - actualizar
@router.put("/{intercambio_id}", response_model=IntercambioOutExtendido)
def actualizar_intercambio(intercambio_id: int, data: IntercambioUpdate, db: Session = Depends(get_db)):
    intercambio = db.query(Intercambio).filter_by(id=intercambio_id).first()
    if not intercambio:
        raise HTTPException(status_code=404, detail="Intercambio no encontrado")

    # Convertir los datos a un diccionario, excluyendo campos no establecidos
    update_data = data.dict(exclude_unset=True)

    # Si se está intentando actualizar id_usuario1, validar que exista
    if 'id_usuario1' in update_data:
        usuario = db.query(Usuario).filter_by(id=update_data['id_usuario1']).first()
        if not usuario:
            raise HTTPException(status_code=400, detail=f"El usuario con ID {update_data['id_usuario1']} no existe")

    # Si se está intentando actualizar id_perfil, validar que exista
    if 'id_perfil' in update_data:
        perfil = db.query(Perfil).filter_by(id=update_data['id_perfil']).first()
        if not perfil:
            raise HTTPException(status_code=400, detail=f"El perfil con ID {update_data['id_perfil']} no existe")

    # Aplicar las actualizaciones
    for key, value in update_data.items():
        setattr(intercambio, key, value)

    db.commit()
    db.refresh(intercambio)
    return intercambio

# DELETE - eliminar con relaciones
@router.delete("/{intercambio_id}")
def eliminar_intercambio(intercambio_id: int, db: Session = Depends(get_db)):
    intercambio = db.query(Intercambio).filter_by(id=intercambio_id).first()
    if not intercambio:
        raise HTTPException(status_code=404, detail="Intercambio no encontrado")

    # Eliminar relaciones en IntercambioHabilidad
    db.query(IntercambioHabilidad).filter_by(intercambio_id=intercambio_id).delete(synchronize_session=False)

    # Eliminar el intercambio
    db.delete(intercambio)
    db.commit()
    return {"ok": True, "message": "Intercambio eliminado correctamente"}

