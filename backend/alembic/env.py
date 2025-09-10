from logging.config import fileConfig
import sys
import os
from sqlalchemy import create_engine
from sqlalchemy import pool
from alembic import context

# Agrega el directorio raíz del proyecto al sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

# Importa configuración y modelos
from backend.db.database import MARIADB_URL
from backend.db.base import Base
from backend.models import * 

print("Modelos cargados:", [mapper.class_.__name__ for mapper in Base.registry.mappers])
print("Tablas detectadas:", list(Base.metadata.tables.keys()))

# Configuración de Alembic
config = context.config

# Habilita el logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Target metadata de todos los modelos
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Ejecución en modo 'offline'."""
    context.configure(
        url=MARIADB_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Ejecución en modo 'online'."""
    connectable = create_engine(MARIADB_URL, poolclass=pool.NullPool)

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
