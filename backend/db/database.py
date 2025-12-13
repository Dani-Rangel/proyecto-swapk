from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Obtener las variables de entorno
host = os.getenv("MYSQLHOST", "localhost")
user = os.getenv("MYSQLUSER", "root")
password = os.getenv("MYSQLPASSWORD", "")
database = os.getenv("MYSQLDATABASE", "swapk")
port = os.getenv("MYSQLPORT", "3306")

# Construir la URL de conexión
MARIADB_URL = f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}"

# Crear el objeto de conexión
engine = create_engine(MARIADB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

