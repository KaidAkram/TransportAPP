"""Initial schema

Revision ID: 20260813_0001
Revises: 
Create Date: 2026-08-13 19:50:00.000000+00:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260813_0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create Enums
    statut_vehicule = postgresql.ENUM('DISPONIBLE', 'EN_MISSION', 'MAINTENANCE', 'IMMOBILISE', 'HORS_SERVICE', name='statut_vehicule', create_type=False)
    statut_employe = postgresql.ENUM('ACTIF', 'ABSENT', 'SUSPENDU', 'QUITTE', name='statut_employe', create_type=False)
    type_employe = postgresql.ENUM('CHAUFFEUR', 'MECANICIEN', 'ADMINISTRATIF', name='type_employe', create_type=False)
    role_partenaire = postgresql.ENUM('CLIENT', 'FOURNISSEUR', 'PARTENAIRE_MIXTE', name='role_partenaire', create_type=False)
    type_partenaire = postgresql.ENUM('AGENCE_VOYAGE', 'ENTREPRISE', 'HOTEL', 'ORGANISME', 'ASSOCIATION', 'PARTICULIER', 'AUTRE', name='type_partenaire', create_type=False)
    statut_contrat = postgresql.ENUM('ACTIF', 'EXPIRE', name='statut_contrat', create_type=False)
    type_caution = postgresql.ENUM('SOUMISSION', 'BONNE_EXECUTION', name='type_caution', create_type=False)
    statut_caution = postgresql.ENUM('CREATION', 'CHEZ_CLIENT', 'RETOURNEE', 'MAIN_LEVEE', name='statut_caution', create_type=False)
    categorie_intervention = postgresql.ENUM('PREVENTIVE', 'CORRECTIVE', name='categorie_intervention', create_type=False)
    statut_intervention = postgresql.ENUM('PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE', name='statut_intervention', create_type=False)
    type_mouvement = postgresql.ENUM('ENTREE', 'SORTIE', 'INVENTAIRE', name='type_mouvement', create_type=False)

    for enum_type in [
        statut_vehicule, statut_employe, type_employe, role_partenaire, type_partenaire,
        statut_contrat, type_caution, statut_caution, categorie_intervention, statut_intervention, type_mouvement
    ]:
        enum_type.create(op.get_bind(), checkfirst=True)

    # 2. Table: documents
    op.create_table(
        'documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('nom', sa.String(length=255), nullable=False),
        sa.Column('type', sa.String(length=100), nullable=False),
        sa.Column('url_fichier', sa.String(length=500), nullable=False),
        sa.Column('date_emission', sa.Date(), nullable=True),
        sa.Column('date_expiration', sa.Date(), nullable=True),
        sa.Column('statut_validite', sa.String(length=50), nullable=True),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('idx_documents_entity', 'documents', ['entity_type', 'entity_id'])

    # 3. Table: employes
    op.create_table(
        'employes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('matricule', sa.String(length=50), nullable=False, unique=True),
        sa.Column('nom', sa.String(length=100), nullable=False),
        sa.Column('prenom', sa.String(length=100), nullable=False),
        sa.Column('photo', sa.String(length=500), nullable=True),
        sa.Column('date_naissance', sa.Date(), nullable=True),
        sa.Column('telephone', sa.String(length=50), nullable=True),
        sa.Column('adresse', sa.String(length=255), nullable=True),
        sa.Column('date_embauche', sa.Date(), nullable=True),
        sa.Column('statut', statut_employe, nullable=False),
        sa.Column('type_employe', type_employe, nullable=False),
        sa.Column('fonction', sa.String(length=100), nullable=True),
        sa.Column('assurance', sa.Boolean(), nullable=True),
        sa.Column('specialite', sa.String(length=100), nullable=True),
        sa.Column('type_mecanicien', sa.String(length=100), nullable=True),
        sa.Column('experience', sa.String(length=50), nullable=True),
        sa.Column('est_responsable', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('idx_employes_matricule', 'employes', ['matricule'])
    op.create_index('idx_employes_type', 'employes', ['type_employe'])

    # 4. Table: permis
    op.create_table(
        'permis',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('chauffeur_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('employes.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('numero', sa.String(length=50), nullable=False, unique=True),
        sa.Column('categories', sa.String(length=100), nullable=False),
        sa.Column('date_obtention', sa.Date(), nullable=True),
        sa.Column('date_expiration', sa.Date(), nullable=True),
        sa.Column('scan_permis', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 5. Table: partenaires
    op.create_table(
        'partenaires',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('nom_commercial', sa.String(length=200), nullable=False),
        sa.Column('nif', sa.String(length=50), nullable=True),
        sa.Column('nis', sa.String(length=50), nullable=True),
        sa.Column('registre_commerce', sa.String(length=50), nullable=True),
        sa.Column('article_imposition', sa.String(length=50), nullable=True),
        sa.Column('adresse', sa.String(length=255), nullable=True),
        sa.Column('wilaya', sa.String(length=100), nullable=True),
        sa.Column('commune', sa.String(length=100), nullable=True),
        sa.Column('code_postal', sa.String(length=20), nullable=True),
        sa.Column('telephone_principal', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('site_web', sa.String(length=150), nullable=True),
        sa.Column('statut_crm', sa.String(length=50), nullable=True),
        sa.Column('role_partenaire', role_partenaire, nullable=False),
        sa.Column('type_client', type_partenaire, nullable=True),
        sa.Column('specialite', sa.String(length=150), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('idx_partenaires_nom', 'partenaires', ['nom_commercial'])
    op.create_index('idx_partenaires_role', 'partenaires', ['role_partenaire'])

    # 6. Table: contacts
    op.create_table(
        'contacts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('partenaire_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('partenaires.id', ondelete='CASCADE'), nullable=False),
        sa.Column('nom', sa.String(length=100), nullable=False),
        sa.Column('prenom', sa.String(length=100), nullable=False),
        sa.Column('fonction', sa.String(length=100), nullable=True),
        sa.Column('telephone', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('whatsapp', sa.String(length=50), nullable=True),
        sa.Column('est_principal', sa.Boolean(), default=False, nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 7. Table: contrats
    op.create_table(
        'contrats',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('reference', sa.String(length=50), nullable=False, unique=True),
        sa.Column('partenaire_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('partenaires.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('objet', sa.Text(), nullable=False),
        sa.Column('type_contrat', sa.String(length=100), default='Transport', nullable=False),
        sa.Column('date_debut', sa.Date(), nullable=False),
        sa.Column('date_fin', sa.Date(), nullable=True),
        sa.Column('montant', sa.Float(), default=0.0, nullable=False),
        sa.Column('devise', sa.String(length=10), default='DZD', nullable=False),
        sa.Column('mode_facturation', sa.String(length=100), nullable=True),
        sa.Column('conditions_paiement', sa.String(length=200), nullable=True),
        sa.Column('statut', statut_contrat, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 8. Table: avenants
    op.create_table(
        'avenants',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('contrat_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contrats.id', ondelete='CASCADE'), nullable=False),
        sa.Column('numero', sa.String(length=50), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('objet', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('modif_montant', sa.Float(), nullable=True),
        sa.Column('nouvelle_date_fin', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 9. Table: cautions
    op.create_table(
        'cautions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('numero', sa.String(length=50), nullable=False, unique=True),
        sa.Column('type', type_caution, nullable=False),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('partenaires.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('contrat_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contrats.id', ondelete='SET NULL'), nullable=True),
        sa.Column('montant', sa.Float(), nullable=False),
        sa.Column('devise', sa.String(length=10), default='DZD', nullable=False),
        sa.Column('reference_type', sa.String(length=50), default='Contrat', nullable=False),
        sa.Column('reference_numero', sa.String(length=100), nullable=False),
        sa.Column('objet', sa.Text(), nullable=False),
        sa.Column('date_emission', sa.Date(), nullable=False),
        sa.Column('date_retour', sa.Date(), nullable=True),
        sa.Column('statut', statut_caution, nullable=False),
        sa.Column('url_caution_pdf', sa.String(length=500), nullable=True),
        sa.Column('url_main_levee_pdf', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 10. Table: pieces
    op.create_table(
        'pieces',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('reference', sa.String(length=50), nullable=False, unique=True),
        sa.Column('designation', sa.String(length=200), nullable=False),
        sa.Column('categorie', sa.String(length=100), nullable=False),
        sa.Column('marque', sa.String(length=100), nullable=True),
        sa.Column('modele_compatibilite', sa.String(length=255), nullable=True),
        sa.Column('unite', sa.String(length=20), default='Pièce', nullable=False),
        sa.Column('stock_actuel', sa.Integer(), default=0, nullable=False),
        sa.Column('stock_minimum', sa.Integer(), default=5, nullable=False),
        sa.Column('emplacement', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('idx_pieces_ref', 'pieces', ['reference'])
    op.create_index('idx_pieces_categorie', 'pieces', ['categorie'])

    # 11. Table: vehicules
    op.create_table(
        'vehicules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('immatriculation', sa.String(length=50), nullable=False, unique=True),
        sa.Column('marque', sa.String(length=100), nullable=False),
        sa.Column('modele', sa.String(length=100), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('nombre_places', sa.Integer(), default=1, nullable=False),
        sa.Column('annee', sa.Integer(), nullable=True),
        sa.Column('date_mise_circulation', sa.Date(), nullable=True),
        sa.Column('kilometrage_actuel', sa.Float(), default=0.0, nullable=False),
        sa.Column('statut', statut_vehicule, nullable=False),
        sa.Column('cout_total', sa.Float(), default=0.0, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('idx_vehicules_immat', 'vehicules', ['immatriculation'])

    # 12. Table: constats
    op.create_table(
        'constats',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('vehicule_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('vehicules.id', ondelete='CASCADE'), nullable=False),
        sa.Column('chauffeur_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('employes.id', ondelete='SET NULL'), nullable=True),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('heure', sa.String(length=20), nullable=True),
        sa.Column('lieu', sa.String(length=255), nullable=False),
        sa.Column('circonstances', sa.Text(), nullable=False),
        sa.Column('dommages', sa.Text(), nullable=False),
        sa.Column('tiers_implique', sa.Boolean(), default=False, nullable=False),
        sa.Column('infos_tiers', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 13. Table: interventions
    op.create_table(
        'interventions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('numero', sa.String(length=50), nullable=False, unique=True),
        sa.Column('vehicule_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('vehicules.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('mecanicien_responsable_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('employes.id', ondelete='RESTRICT'), nullable=True),
        sa.Column('type', categorie_intervention, nullable=False),
        sa.Column('categorie', sa.String(length=100), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('kilometrage', sa.Float(), nullable=False),
        sa.Column('probleme_constate', sa.Text(), nullable=True),
        sa.Column('diagnostic', sa.Text(), nullable=True),
        sa.Column('travail_effectue', sa.Text(), nullable=True),
        sa.Column('est_externe', sa.Boolean(), default=False, nullable=False),
        sa.Column('prestataire_nom', sa.String(length=150), nullable=True),
        sa.Column('prestataire_telephone', sa.String(length=50), nullable=True),
        sa.Column('prochaine_date_maintenance', sa.Date(), nullable=True),
        sa.Column('prochain_kilo_maintenance', sa.Float(), nullable=True),
        sa.Column('statut', statut_intervention, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('idx_interventions_num', 'interventions', ['numero'])

    # 14. Table: intervention_mecaniciens (Junction)
    op.create_table(
        'intervention_mecaniciens',
        sa.Column('intervention_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('interventions.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('mecanicien_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('employes.id', ondelete='CASCADE'), primary_key=True),
    )

    # 15. Table: intervention_pieces (Junction)
    op.create_table(
        'intervention_pieces',
        sa.Column('intervention_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('interventions.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('piece_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('pieces.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('quantite_utilisee', sa.Integer(), default=1, nullable=False),
    )

    # 16. Table: mouvements_stock
    op.create_table(
        'mouvements_stock',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('piece_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('pieces.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('type', type_mouvement, nullable=False),
        sa.Column('quantite', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('motif', sa.String(length=200), nullable=False),
        sa.Column('ecart_inventaire', sa.Integer(), nullable=True),
        sa.Column('intervention_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('interventions.id', ondelete='SET NULL'), nullable=True),
        sa.Column('fournisseur_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('partenaires.id', ondelete='SET NULL'), nullable=True),
        sa.Column('reference_document', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('mouvements_stock')
    op.drop_table('intervention_pieces')
    op.drop_table('intervention_mecaniciens')
    op.drop_table('interventions')
    op.drop_table('constats')
    op.drop_table('vehicules')
    op.drop_table('pieces')
    op.drop_table('cautions')
    op.drop_table('avenants')
    op.drop_table('contrats')
    op.drop_table('contacts')
    op.drop_table('partenaires')
    op.drop_table('permis')
    op.drop_table('employes')
    op.drop_table('documents')

    # Drop enums
    for enum_name in [
        'type_mouvement', 'statut_intervention', 'categorie_intervention',
        'statut_caution', 'type_caution', 'statut_contrat', 'type_partenaire',
        'role_partenaire', 'type_employe', 'statut_employe', 'statut_vehicule'
    ]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name} CASCADE")
