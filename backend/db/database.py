from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker


#Cadena de conexion
#MARIADB_URL = 'mysql+pymysql://root:admin@localhost:3315/swapk'
MARIADB_URL = 'mysql+pymysql://root:@localhost:3306/swapk'
#Crear el objeto de conexion
# Crear el objeto de conexión con configuración mas protunda
engine = create_engine(
    MARIADB_URL,
    pool_size=45,           # Más conexiones
    max_overflow=65,        # Más overflow
    pool_timeout=50,        # Timeout razonable
    pool_recycle=1800,      # Reciclar cada 30 min
    pool_pre_ping=True,     # Verificamos conexiones antes de usarlas
    echo=False              # Desactivamos logs SQL
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

