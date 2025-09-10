from sqlalchemy.orm import Session 
from fastapi import HTTPException
from backend.models.cursos import Curso
from backend.models.curso_habilidad import CursoHabilidad
from backend.models.habilidad import Habilidad
from backend.models.usuarios import Usuario
from backend.models.attachments import Attachment
from backend.schemas.curso_schema import CursoCreate, CursoUpdate

# =========================
# Crear curso
# =========================
def create_curso_service(curso: CursoCreate, db: Session) -> dict:
    new_curso = Curso(
        titulo=curso.titulo,
        descripcion=curso.descripcion,
        objetivo=curso.objetivo,
        img_Cursos=curso.img_Cursos,
        User_Id=curso.user_id,  # corregido a user_id
    )
    db.add(new_curso)
    db.commit()
    db.refresh(new_curso)

    # Asociar habilidades
    if curso.habilidades_ids:
        curso_habilidades = [
            CursoHabilidad(curso_id=new_curso.id, habilidad_id=hab_id)
            for hab_id in curso.habilidades_ids
        ]
        db.add_all(curso_habilidades)
        db.commit()

    # Asociar archivos (si se proporcionan)
    if curso.attachments:  # corregido de archivos a attachments
        nuevos_archivos = [
            Attachment(
                course_id=new_curso.id,
                file_url=archivo.file_url,
                file_name=archivo.file_name,
                file_size=archivo.file_size
            )
            for archivo in curso.attachments
        ]
        db.add_all(nuevos_archivos)
        db.commit()

    return get_curso_service(new_curso.id, db)


# =========================
# Listar todos los cursos
# =========================
def get_cursos_service(db: Session):
    cursos = db.query(Curso).all()
    resultados = []

    for curso in cursos:
        usuario = db.query(Usuario).filter(Usuario.id == curso.User_Id).first()

        curso_habilidades = db.query(CursoHabilidad).filter(CursoHabilidad.curso_id == curso.id).all()
        habilidades = [
            {
                "id": ch.habilidad_id,
                "habilidad_nombre": db.query(Habilidad).filter(Habilidad.id == ch.habilidad_id).first().nombre
            }
            for ch in curso_habilidades
            if db.query(Habilidad).filter(Habilidad.id == ch.habilidad_id).first()
        ]

        attachments = db.query(Attachment).filter(Attachment.course_id == curso.id).all()
        attachments_list = [{
            "id": att.id,
            "file_url": att.file_url,
            "file_name": att.file_name,
            "file_size": att.file_size,
            "fecha_subida": att.fecha_subida
        } for att in attachments]

        resultados.append({
            "id": curso.id,
            "titulo": curso.titulo,
            "descripcion": curso.descripcion,
            "objetivo": curso.objetivo,
            "img_Cursos": curso.img_Cursos,
            "user_id": curso.User_Id,  # <-- mantengo aquí el nombre consistente
            "usuario": {
                "nombre": usuario.nombre if usuario else "Usuario desconocido"
            },
            "habilidades": habilidades,
            "attachments": attachments_list
        })

    return resultados


# =========================
# Obtener curso por ID
# =========================
def get_curso_service(course_id: int, db: Session):
    curso = db.query(Curso).filter(Curso.id == course_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    usuario = db.query(Usuario).filter(Usuario.id == curso.User_Id).first()

    curso_habilidades = db.query(CursoHabilidad).filter(CursoHabilidad.curso_id == curso.id).all()
    habilidades = [
        {
            "id": ch.habilidad_id,
            "habilidad_nombre": db.query(Habilidad).filter(Habilidad.id == ch.habilidad_id).first().nombre
        }
        for ch in curso_habilidades
        if db.query(Habilidad).filter(Habilidad.id == ch.habilidad_id).first()
    ]

    attachments = db.query(Attachment).filter(Attachment.course_id == curso.id).all()
    attachments_list = [{
        "id": att.id,
        "file_url": att.file_url,
        "file_name": att.file_name,
        "file_size": att.file_size,
        "fecha_subida": att.fecha_subida
    } for att in attachments]

    return {
        "id": curso.id,
        "titulo": curso.titulo,
        "descripcion": curso.descripcion,
        "objetivo": curso.objetivo,
        "img_Cursos": curso.img_Cursos,
        "user_id": curso.User_Id,
        "usuario": {
            "nombre": usuario.nombre if usuario else "Usuario desconocido"
        },
        "habilidades": habilidades,
        "attachments": attachments_list
    }


# =========================
# Actualizar curso
# =========================
def update_curso_service(course_id: int, curso_data: CursoUpdate, db: Session):
    curso = db.query(Curso).filter(Curso.id == course_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    # Actualizar campos (excepto habilidades y attachments)
    for key, value in curso_data.dict(exclude_unset=True, exclude={"habilidades_ids", "attachments"}).items():
        setattr(curso, key, value)
    db.commit()

    # Actualizar habilidades si se proporcionan
    if curso_data.habilidades_ids is not None:
        db.query(CursoHabilidad).filter(CursoHabilidad.curso_id == course_id).delete()
        nuevas_habilidades = [
            CursoHabilidad(curso_id=course_id, habilidad_id=hab_id)
            for hab_id in curso_data.habilidades_ids
        ]
        db.add_all(nuevas_habilidades)
        db.commit()

    # Actualizar attachments si se proporcionan
    if curso_data.attachments is not None:
        # Eliminar archivos anteriores
        db.query(Attachment).filter(Attachment.course_id == course_id).delete()
        db.commit()

        # Agregar archivos nuevos
        nuevos_archivos = [
            Attachment(
                course_id=course_id,
                file_url=archivo.file_url,
                file_name=archivo.file_name,
                file_size=archivo.file_size
            )
            for archivo in curso_data.attachments
        ]
        db.add_all(nuevos_archivos)
        db.commit()

    return get_curso_service(course_id, db)


# =========================
# Eliminar curso
# =========================
def delete_curso_service(course_id: int, db: Session):
    curso = db.query(Curso).filter(Curso.id == course_id).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    db.delete(curso)
    db.commit()
    return {"message": "Curso eliminado correctamente"}


# =========================
# Función para eliminar todas las habilidades de un curso
# =========================
def delete_all_habilidades_por_curso(curso_id: int, db: Session):
    db.query(CursoHabilidad).filter(CursoHabilidad.curso_id == curso_id).delete()
    db.commit()
    return {"message": "Todas las habilidades asociadas al curso han sido eliminadas"}
