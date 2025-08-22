from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from ..schemas import course_schema, attachment_schema
from ..services import course_service
from ..db.database import get_db
from typing import List

router = APIRouter(prefix="/api/courses", tags=["courses"])

@router.post("/", response_model=course_schema.Course)
async def create_course(
    course_data: course_schema.CourseCreate,
    attachments: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    # Procesar archivos adjuntos
    attachment_list = []
    for file in attachments:
        # Aquí iría la lógica para subir el archivo a S3/Azure/Google Storage
        file_url = f"https://storage.example.com/{file.filename}"
        attachment_list.append(
            attachment_schema.AttachmentBase(
                file_url=file_url,
                file_name=file.filename,
                file_size=file.size
            )
        )
    
    return course_service.create_course_with_attachments(db, course_data, attachment_list)