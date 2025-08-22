from sqlalchemy.orm import Session
from ..models import Curso, Habilidad, DBCourseSkill

def create_course(db: Session, course_data, skill_ids: List[int]):
    # Crear el curso
    db_course = Curso(
        title=course_data.title,
        description=course_data.description,
        # ... otros campos
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    
    # Agregar relaciones con habilidades
    for skill_id in skill_ids:
        db_skill = db.query(Habilidad).filter(Habilidad.id == skill_id).first()
        if db_skill:
            relation = DBCourseSkill(
                course_id=db_course.id,
                skill_id=skill_id
            )
            db.add(relation)
    
    db.commit()
    return db_course

def get_course_with_skills(db: Session, course_id: int):
    return db.query(DBCourse).options(
        joinedload(DBCourse.skill_relations).joinedload(DBCourseSkill.skill)
    ).filter(DBCourse.id == course_id).first()