import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path
import os

# Como no queremos hardcodear la ruta, usamos una variable de entorno FIREBASE_CRED_PATH
cred_path = os.getenv("FIREBASE_CRED_PATH", str(Path(__file__).resolve().parents[1] / "firebase_credentials.json"))

if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

firestore_db = firestore.client()