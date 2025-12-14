# backend/controllers/user_admin_controller.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from models.usuarios import Usuario, RolUsuario
from models import Like, Comentario, Publicacion
from pydantic import BaseModel
from typing import List, Optional
from passlib.context import CryptContext
from datetime import datetime

router = APIRouter(prefix="/api/users", tags=["users"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Modelos Pydantic para validación
class UserCreate(BaseModel):
    nombre: str
    correo: str
    contrasena: str
    rol: RolUsuario = RolUsuario.Usuario

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    correo: Optional[str] = None
    rol: Optional[RolUsuario] = None

class UserOut(BaseModel):    
    id: int
    nombre: str
    correo: str
    rol: RolUsuario
    fecha_creacion: datetime

    class Config:
        from_attributes = True

# Obtener todos los usuarios
@router.get("/", response_model=List[UserOut])
def get_users(db: Session = Depends(get_db)):
    return db.query(Usuario).all()

# Crear usuario
@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Verificar si el correo ya existe
    db_user = db.query(Usuario).filter(Usuario.correo == user.correo).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(user.contrasena)
    db_user = Usuario(
        nombre=user.nombre,
        correo=user.correo,
        contrasena_hash=hashed_password,
        rol=user.rol
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Actualizar usuario
@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    for key, value in user_update.dict(exclude_unset=True).items():
        if key == "contrasena" and value:
            value = pwd_context.hash(value)
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)   
    return db_user

# Eliminar usuario
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db.query(Like).filter(Like.id_usuario == user_id).delete(synchronize_session=False)
    db.query(Comentario).filter(Comentario.id_usuario == user_id).delete(synchronize_session=False)
    db.query(Publicacion).filter(Publicacion.id_usuario == user_id).delete(synchronize_session=False)
    db.delete(db_user)
    db.commit()
    return