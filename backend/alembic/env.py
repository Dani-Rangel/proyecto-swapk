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
from db.database import Base
from models import *

# Configuración de Alembic
config = context.config

# Logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Obtener las variables de entorno para la conexión a MySQL
host = os.getenv("MYSQLHOST", "mysql.railway.internal")
user = os.getenv("MYSQLUSER", "root")
password = os.getenv("MYSQLPASSWORD", "")
database = os.getenv("MYSQLDATABASE", "railway")
port = os.getenv("MYSQLPORT", "3306")

# Construir la URL de conexión
MARIADB_URL = f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}"

# Inyectar la URL en Alembic
config.set_main_option("sqlalchemy.url", ‎MARIADB_URL)

# Metadata de los modelos
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Migraciones en modo offline."""
    context.configure(
        url=‎MARIADB_URL,
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
