import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

# Intentar usar FIREBASE_CRED_JSON (para Railway)
firebase_cred_json = os.getenv("FIREBASE_CRED_JSON")

if firebase_cred_json:
    print("✅ Usando credenciales JSON desde variable de entorno")
    cred_dict = json.loads(firebase_cred_json)
    cred = credentials.Certificate(cred_dict)
else:
    # Fallback a archivo local (solo desarrollo)
    from pathlib import Path
    cred_path = os.getenv("FIREBASE_CRED_PATH", str(Path(__file__).resolve().parents[1] / "firebase" / "firebase_credentials.json"))
    print("📁 Usando credenciales desde archivo:", cred_path)
    cred = credentials.Certificate(cred_path)

# Inicializar solo si no está ya inicializado
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

firestore_db = firestore.client()
