from sqlalchemy.orm import Session
from fastapi import HTTPException
from backend.models.cursos import Curso
from backend.models.Curso_Habilidad import CursoHabilidad
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
        User_Id=curso.User_Id,
    )
    db.add(new_curso)
    db.commit()
    db.refresh(new_curso)
    
    # Ahora devolvemos un diccionario en lugar del objeto ORM
    return {
        "id": new_curso.id,
        "titulo": new_curso.titulo,
        "descripcion": new_curso.descripcion,
        "objetivo": new_curso.objetivo,
        "img_Cursos": new_curso.img_Cursos,
        "User_Id": new_curso.User_Id,
        "usuario": None,  # Se poblará en consultas separadas si es necesario
        "habilidades": [],
        "attachments": []
    }

# =========================
# Listar todos los cursos
# =========================
def get_cursos_service(db: Session):
    # Primero obtenemos todos los cursos
    cursos = db.query(Curso).all()
    
    resultados = []
    for curso in cursos:
        # Obtenemos el usuario asociado al curso
        usuario = db.query(Usuario).filter(Usuario.id == curso.User_Id).first()
        
        # Obtenemos las habilidades del curso
        curso_habilidades = db.query(CursoHabilidad).filter(CursoHabilidad.curso_id == curso.id).all()
        habilidades = []
        for ch in curso_habilidades:
            habilidad = db.query(Habilidad).filter(Habilidad.id == ch.habilidad_id).first()
            if habilidad:
                habilidades.append({
                    "id": ch.id,
                    "habilidad_nombre": habilidad.nombre,
                    "tipo": ch.tipo
                })
        
        # Obtenemos los attachments del curso
        attachments = db.query(Attachment).filter(Attachment.course_id  == curso.id).all()
        attachments_list = [{
            "id": att.id,
            "file_url": att.file_url,
            "file_name": att.file_name,
            "file_size": att.file_size,
            "fecha_subida": att.fecha_subida
        } for att in attachments]
        
        # Construimos el resultado
        resultados.append({
            "id": curso.id,
            "titulo": curso.titulo,
            "descripcion": curso.descripcion,
            "objetivo": curso.objetivo,
            "img_Cursos": curso.img_Cursos,
            "User_Id": curso.User_Id,
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
def get_curso_service( course_id : int, db: Session):
    curso = db.query(Curso).filter(Curso.id ==  course_id ).first()
    
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")
    
    # Obtenemos el usuario asociado al curso
    usuario = db.query(Usuario).filter(Usuario.id == curso.User_Id).first()
    
    # Obtenemos las habilidades del curso
    curso_habilidades = db.query(CursoHabilidad).filter(CursoHabilidad.curso_id  == curso.id).all()
    habilidades = []
    for ch in curso_habilidades:
        habilidad = db.query(Habilidad).filter(Habilidad.id == ch.habilidad_id).first()
        if habilidad:
            habilidades.append({
                "id": ch.id,
                "habilidad_nombre": habilidad.nombre,
                "tipo": ch.tipo
            })
    
    # Obtenemos los attachments del curso
    attachments = db.query(Attachment).filter(Attachment.course_id  == curso.id).all()
    attachments_list = [{
        "id": att.id,
        "file_url": att.file_url,
        "file_name": att.file_name,
        "file_size": att.file_size,
        "fecha_subida": att.fecha_subida
    } for att in attachments]
    
    # Construimos el resultado
    return {
        "id": curso.id,
        "titulo": curso.titulo,
        "descripcion": curso.descripcion,
        "objetivo": curso.objetivo,
        "img_Cursos": curso.img_Cursos,
        "User_Id": curso.User_Id,
        "usuario": {
            "nombre": usuario.nombre if usuario else "Usuario desconocido"
        },
        "habilidades": habilidades,
        "attachments": attachments_list
    }

# =========================
# Actualizar curso
# =========================
def update_curso_service( course_id : int, curso_data: CursoUpdate, db: Session):
    curso = db.query(Curso).filter(Curso.id ==  course_id ).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    for key, value in curso_data.dict(exclude_unset=True).items():
        setattr(curso, key, value)

    db.commit()
    db.refresh(curso)
    
    # Después de actualizar, obtenemos los datos relacionados manualmente
    return get_curso_service( course_id , db)

# =========================
# Eliminar curso
# =========================
def delete_curso_service( course_id : int, db: Session):
    curso = db.query(Curso).filter(Curso.id ==  course_id ).first()
    if not curso:
        raise HTTPException(status_code=404, detail="Curso no encontrado")

    db.delete(curso)
    db.commit()
    return {"message": "Curso eliminado correctamente"}