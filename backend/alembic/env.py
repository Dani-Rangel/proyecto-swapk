from logging.config import fileConfig
import os
import sys
from sqlalchemy import engine_from_config, pool
from alembic import context

# Agregar la raíz del proyecto al path
sys.path.append(
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
)

# Importar Base y modelos
from backend.db.database import Base
from backend.models import *

# Configuración de Alembic
config = context.config

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Obtener DATABASE_URL desde variables de entorno
DB_SWAPK_URL = os.getenv("DB_SWAPK_URL")

if not DB_SWAPK_URL:
    raise RuntimeError("❌ DB_SWAPK_URL no está definida en las variables de entorno")

# Inyectar la URL en Alembic
config.set_main_option("sqlalchemy.url", DB_SWAPK_URL)

# Metadata de los modelos
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Migraciones en modo offline."""
    context.configure(
        url=DB_SWAPK_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Migraciones en modo online."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
