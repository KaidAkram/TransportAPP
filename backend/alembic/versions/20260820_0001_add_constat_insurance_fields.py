"""add_constat_insurance_fields

Revision ID: 20260820_0001
Revises: 20260813_0001
Create Date: 2026-08-20 21:00:00.000000+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260820_0001'
down_revision: Union[str, None] = '20260813_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new columns to constats
    with op.batch_alter_table('constats', schema=None) as batch_op:
        batch_op.add_column(sa.Column('statut_assurance', sa.String(length=50), server_default='En attente', nullable=False))
        batch_op.add_column(sa.Column('montant_rembourse', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('url_document', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('url_justificatif_assurance', sa.String(length=255), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('constats', schema=None) as batch_op:
        batch_op.drop_column('url_justificatif_assurance')
        batch_op.drop_column('url_document')
        batch_op.drop_column('montant_rembourse')
        batch_op.drop_column('statut_assurance')
