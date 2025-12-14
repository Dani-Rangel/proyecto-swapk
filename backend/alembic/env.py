from logging.config import fileConfig
import sys
import os
from sqlalchemy import create_engine, pool
from alembic import context

# Agrega el directorio raíz al sys.path para que Alembic encuentre tus modelos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

# Importa tus modelos (ajusta si la ruta es diferente)
from backend.db.base import Base
from backend.models import *  # Asegúrate de que esto importe todos tus modelos

# Configuración de Alembic
config = context.config

# Habilita logging si hay archivo de configuración
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_database_url():
    """Obtiene la URL de la base de datos desde Railway o usa MySQL local...."""
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        # Railway usa PostgreSQL → la URL ya es válida
        return database_url
    else:
        # Desarrollo local con MySQL
        return "mysql+pymysql://root:@localhost/swapk"


def run_migrations_offline():
    """Ejecuta migraciones en modo offline (sin conexión real)."""
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
    """Ejecuta migraciones en modo online (con conexión real a la BD)."""
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
