from fastapi import FastAPI
from pathlib import Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles  # <-- Importa StaticFiles
from backend.db.database import Base, engine
from backend.controllers.auth_controller import router as auth_router
from backend.controllers.habilidad_controller import router as habilidad_router
from backend.controllers.forgot_password_controller import router as forgot_password_router
from backend.controllers import google_auth_controller 
from backend.controllers.user_controller import router as user_router
from backend.services.oauth2 import get_current_user
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
BASE_DIR = Path(__file__).resolve().parent  # backend/
UPLOADS_DIR = BASE_DIR / "uploads"          # backend/uploads/

# Base de datos
Base.metadata.create_all(bind=engine)

# Montar carpeta uploads como estática para servir archivos
# Montar la carpeta como ruta estática
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

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