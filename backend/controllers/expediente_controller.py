from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.schemas.expediente_schema import  (
    ExpedienteCreate,
    ExpedienteResponse,
    ExpedienteUpdate,
    ArchivoExpedienteResponse
)
from backend.services.expediente_service import (
    crear_expediente,
    obtener_expediente_por_usuario,
    obtener_expediente,
    actualizar_expediente,
    eliminar_expediente
)
from backend.services.expediente_service import guardar_archivo_expediente
from fastapi import Request

router = APIRouter(
    prefix="/expedientes",
    tags=["Expedientes"]
)

@router.post("/", response_model=ExpedienteResponse)
def crear_nuevo_expediente(expediente: ExpedienteCreate, db: Session = Depends(get_db)):
    return crear_expediente(db, expediente)


@router.get("/usuario/{usuario_id}", response_model=list[ExpedienteResponse])
def listar_expedientes_por_usuario(usuario_id: int, request: Request, db: Session = Depends(get_db)):
    expedientes = obtener_expediente_por_usuario(db, usuario_id)
    
    # Aquí construimos la respuesta manualmente para agregar la URL pública de los archivos
    resultado = []
    for exp in expedientes:
        archivos = []
        for arch in exp.archivos:
            archivos.append({
                "id": arch.id,
                "nombre": arch.nombre,
                # Construir URL pública para el archivo
                "ruta": arch.ruta,
                "fecha_subida": arch.fecha_subida,
            })
        resultado.append({
            "id": exp.id,
            "usuario_id": exp.usuario_id,
            "nombre": exp.nombre,
            "institucion": exp.institucion,
            "descripcion": exp.descripcion,
            "tipo": exp.tipo,
            "estado": exp.estado,
            "url_expediente": exp.url_expediente,
            "fecha_inicio": exp.fecha_inicio,
            "fecha_fin": exp.fecha_fin,
            "archivos": archivos,
        })
    return resultado

@router.get("/{expediente_id}", response_model=ExpedienteResponse)
def obtener_un_expediente(expediente_id: int, db: Session = Depends(get_db)):
    expediente = obtener_expediente(db, expediente_id)
    if not expediente:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")
    return expediente

@router.put("/{expediente_id}", response_model=ExpedienteResponse)
def actualizar_un_expediente(expediente_id: int, expediente_data: ExpedienteUpdate, db: Session = Depends(get_db)):
    expediente_actualizado = actualizar_expediente(db, expediente_id, expediente_data)
    if not expediente_actualizado:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")
    return expediente_actualizado

@router.delete("/{expediente_id}", response_model=dict)
def eliminar_un_expediente(expediente_id: int, db: Session = Depends(get_db)):
    eliminado = eliminar_expediente(db, expediente_id)
    if not eliminado:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")
    return {"message": "Expediente eliminado correctamente"}

@router.post("/{expediente_id}/archivo", response_model=ArchivoExpedienteResponse)
def subir_archivo_a_expediente(expediente_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    expediente = obtener_expediente(db, expediente_id)
    if not expediente:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")

    archivo = guardar_archivo_expediente(db, expediente_id, file)
    return archivo
