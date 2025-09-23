from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from backend.db.database import get_db
from backend.models.usuarios import Usuario
from backend.schemas.user_schema import UserResponse, UserUpdate, PasswordUpdate, PasswordConfirm, UserForChatResponse 
from backend.services.oauth2 import get_current_user
from backend.models.perfil import Perfil


router = APIRouter(prefix="/users", tags=["Users"])

ph = PasswordHasher()

# Obtener perfil del usuario autenticado
from backend.models.usuarios import Usuario  # Asegúrate de importar tu modelo

@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: Usuario = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_user(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    if update_data.nombre:
        current_user.nombre = update_data.nombre
    if update_data.email:
        current_user.correo = update_data.email

    db.commit()
    db.refresh(current_user)
    return current_user

# Cambiar contraseña
@router.put("/me/change-password")
def change_password(
    passwords: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    ph = PasswordHasher()
    try:
        # Verifica la contraseña actual
        ph.verify(current_user.contrasena_hash, passwords.old_password)
    except VerifyMismatchError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contraseña actual incorrecta"
        )

    # Guarda la nueva contraseña
    current_user.contrasena_hash = ph.hash(passwords.new_password)
    db.commit()
    db.refresh(current_user)
    return {"msg": "Contraseña actualizada con éxito"}

# Eliminar cuenta
@router.delete("/me")
def delete_account(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Eliminar perfiles relacionados primero
    db.query(Perfil).filter(Perfil.id_usuario == current_user.id).delete()
    # Luego eliminar usuario
    db.delete(current_user)
    db.commit()
    return {"msg": "Cuenta eliminada correctamente"}



# Obtendremos todos los usuarios (para la funcionalidad chat)
@router.get("/all", response_model=list[UserForChatResponse])
def get_all_users(db: Session = Depends(get_db)):
    """
    Obtiene todos los usuarios registrados para mostrar en el selector de chat.
    """
    users = db.query(Usuario).all()
    
    return [
        UserForChatResponse(
            id=str(user.id),
            name=user.nombre,
            username=user.correo.split("@")[0],  # Ej: "jeffersonsticcorrealelopez@gmail.com" → "jeffersonsticcorrealelopez"
            avatar=f"https://ui-avatars.com/api/?name={user.nombre}&background=random&color=fff&size=128"
        )
        for user in users
    ]