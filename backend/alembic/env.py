import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# 🔗 Añadir la raíz del proyecto al path (para imports)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

# 🧩 Importar Base (sin * para evitar overhead)
from db.database import Base

# 🔧 Configuración de Alembic
config = context.config

# 📝 Logging (solo si hay archivo de config)
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 💡 Construir URL de conexión usando variables de Railway
host = os.getenv("MYSQLHOST", "mysql.railway.internal")
user = os.getenv("MYSQLUSER", "root")
password = os.getenv("MYSQLPASSWORD", "")
database = os.getenv("MYSQLDATABASE", "railway")
port = os.getenv("MYSQLPORT", "3306")

# ✅ URL segura (escapa caracteres especiales)
from urllib.parse import quote_plus
safe_password = quote_plus(password)
MARIADB_URL = f"mysql+pymysql://{user}:{safe_password}@{host}:{port}/{database}"

# ✅ Inyectar la URL en Alembic — con fallback si config ya la tiene
if not config.get_main_option("sqlalchemy.url"):
    config.set_main_option("sqlalchemy.url", MARIADB_URL)

# 🗂 Metadatos de los modelos
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Migraciones en modo offline."""
    context.configure(
        url=MARIADB_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Migraciones en modo online."""
    # ✅ Usa la URL ya inyectada (más robusto)
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


# 🚀 Ejecutar
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
