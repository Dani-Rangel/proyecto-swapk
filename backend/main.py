from fastapi import FastAPI, Depends
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from math import ceil
from urllib.parse import quote_plus

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base

# =====================
# CONTROLADORES
# =====================
from controllers.auth_controller import router as auth_router
from controllers.habilidad_controller import router as habilidad_router
from controllers.forgot_password_controller import router as forgot_password_router
from controllers import google_auth_controller
from controllers.user_controller import router as user_router
from controllers.profile_controller import router as perfil_router
from controllers.perfil_habilidad_controller import router as perfil_habilidad_router
from controllers import curso_controller
from controllers.attachments_controller import router as attachments_router
from controllers.publicaciones_controller import router as publicaciones_router
from controllers import curso_habilidad_controller
from controllers.expediente_controller import router as expediente_router
from controllers.moderador_controller import router as moderador_router
from controllers.intercambio_controller import router as intercambio_router
from controllers import intercambio_habilidad_controller
from controllers.chat_controller import router as chat_router
from controllers.call_controller import router as call_router
from controllers.user_admin_controller import router as userA_router
from controllers import intercambio_admin_controller
from controllers import perfil_admin_controller
from controllers import publicaciones_admin_controller
from controllers import notificacion_controller
from controllers import help_controller
from controllers import inscripcion_curso_controller
from controllers import reporte_controller as reportes_api
from controllers.resena_general_controller import router as resena_general_router
from controllers.contenido_curso_controller import router as contenido_router
from controllers.bloque_contenido_controller import router as bloque_contenido_router

# =====================
# MODELOS
# =====================
from models.perfil import Perfil
from models.usuarios import Usuario

# =====================
# DATABASE (Railway-ready)
# =====================
host = os.getenv("MYSQLHOST", "mysql.railway.internal")
user = os.getenv("MYSQLUSER", "root")
password = os.getenv("MYSQLPASSWORD", "")
database = os.getenv("MYSQLDATABASE", "railway")
port = os.getenv("MYSQLPORT", "3306")

# Construir URL segura
safe_password = quote_plus(password)
DATABASE_URL = f"mysql+pymysql://{user}:{safe_password}@{host}:{port}/{database}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =====================
# FASTAPI APP
# =====================
app = FastAPI()

# =====================
# CORS
# =====================
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://swapk-frontend.vercel.app",
    "https://learning-dashboard.vercel.app",
    "https://*.up.railway.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================
# STARTUP
# =====================
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

# =====================
# ROUTERS
# =====================
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

# =====================
# ENDPOINT PUBLICO
# =====================
@app.get("/public/perfiles")
def get_all_public_profiles(
    page: int = 1,
    limit: int = 12,
    db: Session = Depends(get_db),
):
    page = max(page, 1)
    limit = min(max(limit, 1), 100)

    offset = (page - 1) * limit
    total = db.query(Perfil).join(Usuario).count()

    perfiles = (
        db.query(Perfil)
        .join(Usuario)
        .offset(offset)
        .limit(limit)
        .all()
    )

    resultado = [
        {
            "id": p.id,
            "id_usuario": p.id_usuario,
            "nombre": p.usuario.nombre,
            "descripcion": p.descripcion or "",
            "ubicacion": p.ubicacion or "",
            "Tel": p.Tel,
            "foto_perfil": p.foto_perfil or "/img/user.png",
        }
        for p in perfiles
    ]

    return {
        "items": resultado,
        "total": total,
        "page": page,
        "pages": ceil(total / limit),
        "limit": limit,
    }

# =====================
# STATIC FILES
# =====================
BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# =====================
# LOCAL RUN
# =====================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
