from logging.config import fileConfig
import sys
import os
from sqlalchemy import create_engine, pool
from alembic import context

# Añade el directorio raíz al sys.path para que se puedan importar los modelos
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Importa tus modelos
from backend.db.base import Base
from backend.models import *

# Configuración de Alembic
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def get_database_url():
    """Obtiene la URL de la base de datos desde la variable de entorno DATABASE_URL."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        # Fallback para desarrollo local (MySQL)
        database_url = "mysql+pymysql://root:@localhost/swapk"
    return database_url

def run_migrations_offline():
    """Ejecuta migraciones en modo offline."""
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    """Ejecuta migraciones en modo online."""
    url = get_database_url()
    connectable = create_engine(url, poolclass=pool.NullPool)

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
