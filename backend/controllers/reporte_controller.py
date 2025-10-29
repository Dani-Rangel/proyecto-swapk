from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.models import Reporte, Usuario
from backend.models.reporte import EstadoReporte 
from backend.schemas.reporte_schema import ReporteCreate, ReporteResponse
from backend.services.oauth2 import get_current_user

router = APIRouter(prefix="/reportes", tags=["reportes"])

@router.post("/", response_model=ReporteResponse, status_code=status.HTTP_201_CREATED)
def crear_reporte(
    reporte_data: ReporteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    nuevo_reporte = Reporte(
        id_usuario=current_user.id,
        tipo=reporte_data.tipo,
        motivo=reporte_data.motivo.strip(),
        estado=EstadoReporte.Enviado  # ✅ explícito
    )
    db.add(nuevo_reporte)
    db.commit()
    db.refresh(nuevo_reporte)
    return nuevo_reporte