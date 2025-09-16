from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.db.database import get_db
from backend.services import intercambio_service
from backend.schemas.intercambio_schema import (
    IntercambioCreate,
    IntercambioConHabilidadesSeparadas
)

router = APIRouter(
    prefix="/intercambios",
    tags=["Intercambios"]
)

# -------------------------------
# Listar todos los intercambios
# -------------------------------
@router.get("/", response_model=List[IntercambioConHabilidadesSeparadas])
def listar_intercambios(db: Session = Depends(get_db)):
    return intercambio_service.obtener_intercambios(db)

# -------------------------------
# Obtener un intercambio por ID
# -------------------------------
@router.get("/{id}", response_model=IntercambioConHabilidadesSeparadas)
def obtener_intercambio(id: int, db: Session = Depends(get_db)):
    intercambio = intercambio_service.obtener_intercambio(db, id)
    if not intercambio:
        raise HTTPException(status_code=404, detail="Intercambio no encontrado")
    return intercambio

# -------------------------------
# Crear un nuevo intercambio
# -------------------------------
@router.post("/", response_model=IntercambioConHabilidadesSeparadas)
def crear_intercambio(intercambio: IntercambioCreate, db: Session = Depends(get_db)):
    return intercambio_service.crear_intercambio(db, intercambio)

# -------------------------------
# Actualizar un intercambio
# -------------------------------
@router.put("/{id}", response_model=IntercambioConHabilidadesSeparadas)
def actualizar_intercambio(id: int, intercambio: IntercambioCreate, db: Session = Depends(get_db)):
    actualizado = intercambio_service.actualizar_intercambio(db, id, intercambio)
    if not actualizado:
        raise HTTPException(status_code=404, detail="Intercambio no encontrado")
    return actualizado

# -------------------------------
# Eliminar un intercambio
# -------------------------------
@router.delete("/{id}")
def eliminar_intercambio(id: int, db: Session = Depends(get_db)):
    eliminado = intercambio_service.eliminar_intercambio(db, id)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Intercambio no encontrado")
    return {"message": "Intercambio eliminado correctamente"}