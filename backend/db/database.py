import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ✅ OBTENER VARIABLES DE ENTORNO (¡NUNCA USAR "localhost"!)
host = os.getenv("MYSQLHOST", "mysql.railway.internal")  # ✅ Por defecto, el correcto
user = os.getenv("MYSQLUSER", "root")
password = os.getenv("MYSQLPASSWORD", "")
database = os.getenv("MYSQLDATABASE", "railway")
port = os.getenv("MYSQLPORT", "3306")

# ✅ CONSTRUIR LA URL DE CONEXIÓN
MARIADB_URL = f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}"

# ✅ CREAR CONEXIÓN
engine = create_engine(MARIADB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
