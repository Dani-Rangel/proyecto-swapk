import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

# Cargar credenciales desde variable de entorno
cred_json_str = os.getenv("FIREBASE_CREDENTIALS_JSON")

if not cred_json_str:
    raise ValueError("La variable de entorno FIREBASE_CREDENTIALS_JSON no está definida.")

try:
    cred_dict = json.loads(cred_json_str)
except json.JSONDecodeError as e:
    raise ValueError(f"El valor de FIREBASE_CREDENTIALS_JSON no es un JSON válido: {e}")

# Inicializar Firebase si no se ha hecho antes
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)

# Crear cliente de Firestore
firestore_db = firestore.client()
