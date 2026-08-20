"""add_logo_to_partenaires

Revision ID: 20260820_0002
Revises: 20260820_0001
Create Date: 2026-08-20 21:40:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260820_0002'
down_revision: Union[str, None] = '20260820_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add logo column to partenaires
    with op.batch_alter_table('partenaires', schema=None) as batch_op:
        batch_op.add_column(sa.Column('logo', sa.String(length=255), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('partenaires', schema=None) as batch_op:
        batch_op.drop_column('logo')
