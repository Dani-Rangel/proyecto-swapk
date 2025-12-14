from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from schemas.intercambio_habilidad_schema import IntercambioHabilidadCreate, IntercambioHabilidadResponse
from services import intercambio_habilidad_service

router = APIRouter(
    prefix="/intercambio_habilidades",
    tags=["IntercambioHabilidad"]
)

@router.post("/", response_model=IntercambioHabilidadResponse)
def crear_intercambio_habilidad(ih: IntercambioHabilidadCreate, db: Session = Depends(get_db)):
    return intercambio_habilidad_service.crear_intercambio_habilidad(db, ih)

@router.get("/intercambio/{intercambio_id}", response_model=List[IntercambioHabilidadResponse])
def listar_habilidades_por_intercambio(intercambio_id: int, db: Session = Depends(get_db)):
    return intercambio_habilidad_service.obtener_habilidades_por_intercambio(db, intercambio_id)

@router.get("/{id}", response_model=IntercambioHabilidadResponse)
def obtener_intercambio_habilidad(id: int, db: Session = Depends(get_db)):
    ih = intercambio_habilidad_service.obtener_intercambio_habilidad(db, id)
    if not ih:
        raise HTTPException(status_code=404, detail="IntercambioHabilidad no encontrada")
    return ih

@router.put("/{id}", response_model=IntercambioHabilidadResponse)
def actualizar_intercambio_habilidad(id: int, data: IntercambioHabilidadCreate, db: Session = Depends(get_db)):
    ih = intercambio_habilidad_service.actualizar_intercambio_habilidad(db, id, data)
    if not ih:
        raise HTTPException(status_code=404, detail="IntercambioHabilidad no encontrada")
    return ih

@router.delete("/{id}")
def eliminar_intercambio_habilidad(id: int, db: Session = Depends(get_db)):
    eliminado = intercambio_habilidad_service.eliminar_intercambio_habilidad(db, id)
    if not eliminado:
        raise HTTPException(status_code=404, detail="IntercambioHabilidad no encontrada")
    return {"message": "IntercambioHabilidad eliminada correctamente"}
