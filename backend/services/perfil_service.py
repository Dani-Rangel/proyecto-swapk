from sqlalchemy.orm import Session
from models.perfil import Perfil

def get_my_perfil(db: Session, user_id: int):
    return db.query(Perfil).filter(Perfil.id_usuario == user_id).first()
