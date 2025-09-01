from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import os
import shutil
from typing import List

from backend.db.database import get_db
from backend.models.cursos import Curso
from backend.models.attachments import Attachment

router = APIRouter(prefix="/attachments", tags=["Attachments"])

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "uploads")
UPLOAD_DIR = os.path.abspath(UPLOAD_DIR)

@router.post("/upload/{curso_id}")
def subir_attachments(
    curso_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    try:
        print("Ruta uploads absoluta:", UPLOAD_DIR)
        print("Lista directorio backend:", os.listdir(os.path.join(BASE_DIR, "..")))
        print("Existe carpeta?:", os.path.exists(UPLOAD_DIR))

        curso = db.query(Curso).filter(Curso.id == curso_id).first()
        if not curso:
            raise HTTPException(status_code=404, detail="Curso no encontrado")

        # Crear carpeta si no existe
        if not os.path.exists(UPLOAD_DIR):
            print(f"La carpeta '{UPLOAD_DIR}' no existe, creando...")
            os.makedirs(UPLOAD_DIR, exist_ok=True)

        saved_files = []

        for file in files:
            file_path = os.path.join(UPLOAD_DIR, file.filename)

            try:
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error guardando archivo: {str(e)}")

            try:
                nuevo_attachment = Attachment(
                    course_id=curso_id,
                    file_url=file_path,
                    file_name=file.filename,
                    file_size=os.path.getsize(file_path),
                    fecha_subida=datetime.now()
                )
                db.add(nuevo_attachment)
                db.commit()
                db.refresh(nuevo_attachment)

                saved_files.append({
                    "id": nuevo_attachment.id,
                    "file_name": nuevo_attachment.file_name,
                    "file_size": nuevo_attachment.file_size,
                    "fecha_subida": nuevo_attachment.fecha_subida
                })
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error DB: {str(e)}")

        return {
            "message": f"{len(saved_files)} archivo(s) subido(s) correctamente",
            "attachments": saved_files
        }

    except HTTPException as e:
        print(f"HTTPException: {e.detail}")
        raise e
    except Exception as e:
        print(f"ERROR GENERAL: {str(e)}")
        raise HTTPException(status_code=500, detail="Error inesperado")
