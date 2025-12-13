from fastapi import FastAPI, Depends
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.db.database import Base, engine, get_db 
from sqlalchemy.orm import Session

# Controladores

from backend.controllers.auth_controller import router as auth_router
from backend.controllers.habilidad_controller import router as habilidad_router
from backend.controllers.forgot_password_controller import router as forgot_password_router
from backend.controllers import google_auth_controller 
from backend.controllers.user_controller import router as user_router
from backend.controllers.profile_controller import router as perfil_router
from backend.controllers.perfil_habilidad_controller import router as perfil_habilidad_router
from backend.controllers import curso_controller
from backend.controllers.attachments_controller import router as attachments_router
from backend.controllers.publicaciones_controller import router as publicaciones_router
from backend.controllers import curso_habilidad_controller
from backend.controllers.expediente_controller import router as expediente_router 
from backend.controllers.moderador_controller import router as moderador_router
from backend.controllers.intercambio_controller import router as intercambio_router
from backend.controllers import intercambio_habilidad_controller
from backend.controllers.chat_controller import router as chat_router 
from backend.controllers.call_controller import router as call_router
from backend.controllers.user_admin_controller import router as userA_router
from backend.controllers import intercambio_admin_controller
from backend.controllers import perfil_admin_controller
from backend.controllers import publicaciones_admin_controller
from backend.controllers import notificacion_controller
from backend.controllers import help_controller
from backend.controllers import inscripcion_curso_controller
from backend.controllers import reporte_controller as reportes_api
from backend.controllers.resena_general_controller import router as resena_general_router
from backend.controllers.contenido_curso_controller import router as contenido_router
from backend.controllers.bloque_contenido_controller import router as bloque_contenido_router

# Servicios

from backend.services.oauth2 import get_current_user

# Modelos

from backend.models.perfil import Perfil
from backend.models.usuarios import Usuario

from math import ceil

app = FastAPI()

# Configuración CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",# tu frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ruta absoluta a la carpeta 'uploads' dentro de backend
BASE_DIR = Path(__file__).resolve().parent  # → swapk/backend/
UPLOADS_DIR = BASE_DIR.parent / "uploads"   # → swapk/uploads/

print(f"📁 Uploads directory: {UPLOADS_DIR}")
if UPLOADS_DIR.exists():
    files = list(UPLOADS_DIR.glob("*.pdf"))[:3]
    print(f"   ✅ Encontrados {len(files)} PDFs (ej: {[f.name for f in files]})")
else:
    print("   ❌ ¡Carpeta 'uploads' NO EXISTE! Se creará al subir primer archivo.")
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Base de datos
Base.metadata.create_all(bind=engine)

# Rutas
app.include_router(auth_router, prefix="/auth")
app.include_router(habilidad_router)
app.include_router(forgot_password_router)
app.include_router(google_auth_controller.router, prefix="/auth/google", tags=["google-auth"])
app.include_router(user_router)
app.include_router(perfil_router)
app.include_router(perfil_habilidad_router)
app.include_router(curso_controller.router)
app.include_router(attachments_router)
app.include_router(publicaciones_router)
app.include_router(curso_habilidad_controller.router)
app.include_router(expediente_router)
app.include_router(moderador_router)
app.include_router(intercambio_router)
app.include_router(intercambio_habilidad_controller.router)
app.include_router(chat_router)
app.include_router(call_router)
app.include_router(notificacion_controller.router)
app.include_router(userA_router)
app.include_router(curso_controller.router, prefix="/admin")
app.include_router(intercambio_admin_controller.router)
app.include_router(perfil_admin_controller.router)
app.include_router(publicaciones_admin_controller.router)
app.include_router(help_controller.router)
app.include_router(inscripcion_curso_controller.router)
app.include_router(reportes_api.router)
app.include_router(resena_general_router)
app.include_router(contenido_router)
app.include_router(bloque_contenido_router)

# Creamos un "ENDPOINT" aca para traer los usuarios, este sera cambiado de lugar en unas proximas versiones

@app.get("/public/perfiles")
def get_all_public_profiles(
    page: int = 1,
    limit: int = 12,
    db: Session = Depends(get_db)
):
    if page < 1:
        page = 1
    if limit < 1:
        limit = 12
    if limit > 100:
        limit = 100

    offset = (page - 1) * limit
    total = db.query(Perfil).join(Usuario).count()

    perfiles = (
        db.query(Perfil)
        .join(Usuario)
        .offset(offset)
        .limit(limit)
        .all()
    )

    resultado = []
    for p in perfiles:
        resultado.append({
            "id": p.id,
            "id_usuario": p.id_usuario,
            "nombre": p.usuario.nombre,
            "descripcion": p.descripcion or "",
            "ubicacion": p.ubicacion or "",
            "Tel": p.Tel,
            "foto_perfil": p.foto_perfil or "/img/user.png"
        })

    total_pages = ceil(total / limit)

    return {
        "items": resultado,
        "total": total,
        "page": page,
        "pages": total_pages,
        "limit": limit
    }


# Servir archivos estáticos
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

if __name__ == "__main__":
    # Ejecuta las migraciones al iniciar
    from alembic.config import Config
    from alembic import command
    import os
    import sys

    def run_migrations():
        try:
            base_dir = Path(__file__).resolve().parent
            alembic_cfg = Config(str(base_dir / "alembic.ini"))
            command.upgrade(alembic_cfg, "head")
            print("✅ Migraciones aplicadas.")
        except Exception as e:
            print(f"❌ Error al ejecutar migraciones: {e}", file=sys.stderr)
            sys.exit(1)

    if os.getenv("RAILWAY_ENVIRONMENT") == "production":
        run_migrations()

    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
