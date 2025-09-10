# backend/services/auth_ws.py
from jose import jwt, JWTError
from backend.config import SECRET_KEY, ALGORITHM
from backend.db.database import get_db
from backend.models.usuarios import Usuario

def get_user_from_token_sync(token: str, db):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    user = db.query(Usuario).filter(Usuario.id == int(user_id)).first()
    return user
