from firebase_admin import credentials, firestore, initialize_app
import os
import json

cred_path = r"C:\proyectos\proyecto-swapk\backend\services\firebase\firebase_credentials.json"
with open(cred_path, "r", encoding="utf-8") as f:
    data = json.load(f)
    private_key = data["private_key"]

print("Contenido de la private_key:")
print(repr(private_key))


# Inicializar Firebase
cred = credentials.Certificate(cred_path)
initialize_app(cred)

db = firestore.client()

try:
    # Crear colección y documento de prueba
    doc_ref = db.collection("test_connection").document("doc1")
    doc_ref.set({"mensaje": "Hola desde Python 🚀"})

    print("✅ Documento creado con éxito")

    # Leer el documento
    doc = doc_ref.get()
    if doc.exists:
        print("📄 Documento leído:", doc.to_dict())
    else:
        print("❌ No se encontró el documento después de crearlo")

except Exception as e:
    print("❌ Error conectando a Firestore:", e)
