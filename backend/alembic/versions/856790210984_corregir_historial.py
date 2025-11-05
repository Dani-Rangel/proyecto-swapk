"""corregir historial"""

from alembic import op
import sqlalchemy as sa

revision = '856790210984'
down_revision = None  # o el ID de la migración anterior si lo conoces
branch_labels = None
depends_on = None

def upgrade():
    pass  # no hace nada

def downgrade():
    pass  # no hace nada