from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.schemas.habilidad_schema import HabilidadCreateDTO
from backend.db.sessions import SessionLocal
from backend.models.habilidad import Habilidad
from backend.services import habilidad_service

#ApiRouter permite dividir las rutas en archivos

#Objeto que contiene este grupo de rutas

router = APIRouter(prefix='/habilidades')

#Crear cada ruta en el grupo


#Obtener el objeto session para Create

def get_session():
    db = SessionLocal() 
    try: 
        yield db
    finally:
        db.close()    
#Endpoints de prueba

@router.get('/')
def listar_habilidades(db: Session = Depends(get_session)):
    return habilidad_service.get_all_habilidades(db)

#Ruta parametrada
@router.get('/{id}')
def listar_habilidades_por_id(id: int):
    return "Lista habilidad cuyo id es : " +str(id)

#Ruta post

@router.post('/')
def crear_habilidad(
    nueva_habilidad: HabilidadCreateDTO,
    db: Session = Depends(get_session)
):
    return habilidad_service.create_habilidad(db, nueva_habilidad)

#Ruta put (Esta tiene que ver con que actualizas todos los atributos en un objeto)

@router.put('/{id}')
def actualizar_habilidad(id: int):
    return "Actualizando la habilidad n " +str(id)


