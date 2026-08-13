from datetime import datetime, date as dt_date, timezone
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.vehicule import Vehicule
from app.models.employe import Employe, Chauffeur, Mecanicien, Permis
from app.models.partenaire import Partenaire, Client, Fournisseur
from app.models.contrat import Contrat, Caution
from app.models.stock import Piece, MouvementStock
from app.models.intervention import Intervention
from app.models.document import Document
from app.models.enums import (
    StatutVehicule,
    StatutEmploye,
    RolePartenaire,
    StatutContrat,
    StatutCaution,
    StatutIntervention,
    TypeMouvement,
)
from app.schemas.dashboard import (
    DashboardResponse,
    DashboardKpi,
    VehiculeKpi,
    EmployeKpi,
    PartenaireKpi,
    ContratKpi,
    CautionKpi,
    StockKpi,
    MaintenanceKpi,
    ActivityItem,
    AlertsResponse,
    AlertItem,
)

router = APIRouter(prefix="", tags=["Dashboard & Système d'Alertes"])


@router.get("/dashboard", response_model=DashboardResponse, summary="Get Central Command Center Metrics & Activity Feed")
def get_dashboard_metrics(db: Session = Depends(get_db)):
    # 1. Fleet KPIs
    vehicules_all = db.query(Vehicule).filter(Vehicule.archived_at.is_(None)).all()
    v_total = len(vehicules_all)
    v_dispo = sum(1 for v in vehicules_all if v.statut == StatutVehicule.DISPONIBLE)
    v_mission = sum(1 for v in vehicules_all if v.statut == StatutVehicule.EN_MISSION)
    v_maint = sum(1 for v in vehicules_all if v.statut in (StatutVehicule.MAINTENANCE, StatutVehicule.IMMOBILISE))

    # 2. Employees KPIs
    employes_all = db.query(Employe).filter(Employe.archived_at.is_(None)).all()
    e_total = len(employes_all)
    e_chauffeurs = sum(1 for e in employes_all if e.type_employe.value == "CHAUFFEUR" or str(e.type_employe) == "CHAUFFEUR")
    e_mecaniciens = sum(1 for e in employes_all if e.type_employe.value == "MECANICIEN" or str(e.type_employe) == "MECANICIEN")

    # 3. Partners CRM KPIs
    partenaires_all = db.query(Partenaire).all()
    p_total = len(partenaires_all)
    p_clients = sum(1 for p in partenaires_all if p.role_partenaire in (RolePartenaire.CLIENT, RolePartenaire.PARTENAIRE_MIXTE))
    p_fournisseurs = sum(1 for p in partenaires_all if p.role_partenaire in (RolePartenaire.FOURNISSEUR, RolePartenaire.PARTENAIRE_MIXTE))

    # 4. Contracts & Cautions KPIs
    contrats_all = db.query(Contrat).filter(Contrat.archived_at.is_(None)).all()
    c_actifs = [c for c in contrats_all if c.statut == StatutContrat.ACTIF]
    c_volume = sum(c.montant for c in c_actifs)

    cautions_all = db.query(Caution).all()
    cau_chez_client = [c for c in cautions_all if c.statut == StatutCaution.CHEZ_CLIENT]
    cau_encours = sum(c.montant for c in cau_chez_client)

    # 5. Stock & Inventory KPIs
    pieces_all = db.query(Piece).filter(Piece.archived_at.is_(None)).all()
    s_total = len(pieces_all)
    s_normal = sum(1 for p in pieces_all if p.stock_actuel > p.stock_minimum)
    s_faible = sum(1 for p in pieces_all if 0 < p.stock_actuel <= p.stock_minimum)
    s_rupture = sum(1 for p in pieces_all if p.stock_actuel <= 0)

    # 6. Maintenance GMAO KPIs
    interventions_all = db.query(Intervention).filter(Intervention.archived_at.is_(None)).all()
    m_terminees = sum(1 for i in interventions_all if i.statut == StatutIntervention.TERMINEE)
    m_en_cours = sum(1 for i in interventions_all if i.statut == StatutIntervention.EN_COURS)
    m_budget = sum(i.cout_total for i in interventions_all)

    # 7. Chronological Activity Feed
    activity_items: List[ActivityItem] = []

    # Interventions
    for it in db.query(Intervention).order_by(desc(Intervention.created_at)).limit(3).all():
        activity_items.append(
            ActivityItem(
                id=str(it.id),
                type="INTERVENTION",
                title=f"Ordre de Travail {it.numero}",
                description=f"{it.categorie} sur {it.vehicule.immatriculation if it.vehicule else 'Véhicule'} — {it.statut.value if hasattr(it.statut, 'value') else it.statut}",
                date=str(it.date),
                link="/maintenance",
                badge_label="Maintenance",
                badge_variant="warning" if it.statut == StatutIntervention.EN_COURS else "success",
            )
        )

    # Stock Movements
    for m in db.query(MouvementStock).order_by(desc(MouvementStock.created_at)).limit(3).all():
        is_entry = m.type == TypeMouvement.ENTREE
        activity_items.append(
            ActivityItem(
                id=str(m.id),
                type="STOCK",
                title=f"{'Entrée' if is_entry else 'Sortie'} Stock ({m.piece.reference if m.piece else 'Pièce'})",
                description=f"{'+' if is_entry else '-'}{m.quantite} {m.piece.unite if m.piece else 'unités'} — {m.motif}",
                date=str(m.date),
                link="/stock",
                badge_label="Magasin Stock",
                badge_variant="success" if is_entry else "primary",
            )
        )

    # Contracts
    for ctr in db.query(Contrat).order_by(desc(Contrat.created_at)).limit(2).all():
        activity_items.append(
            ActivityItem(
                id=str(ctr.id),
                type="CONTRAT",
                title=f"Marché {ctr.reference}",
                description=f"{ctr.objet[:55]}... ({ctr.montant:,.0f} DZD)",
                date=str(ctr.date_debut),
                link=f"/contrats/{ctr.id}",
                badge_label="Contrat",
                badge_variant="primary",
            )
        )

    # Cautions
    for cau in db.query(Caution).order_by(desc(Caution.created_at)).limit(2).all():
        activity_items.append(
            ActivityItem(
                id=str(cau.id),
                type="CAUTION",
                title=f"Caution {cau.numero}",
                description=f"{cau.type.value if hasattr(cau.type, 'value') else cau.type} — {cau.montant:,.0f} DZD",
                date=str(cau.date_emission),
                link="/cautions",
                badge_label="Caution",
                badge_variant="warning",
            )
        )

    return DashboardResponse(
        kpi=DashboardKpi(
            vehicules=VehiculeKpi(
                total=v_total,
                disponibles=v_dispo,
                en_mission=v_mission,
                en_maintenance=v_maint,
            ),
            employes=EmployeKpi(
                total=e_total,
                chauffeurs=e_chauffeurs,
                mecaniciens=e_mecaniciens,
            ),
            partenaires=PartenaireKpi(
                total=p_total,
                clients=p_clients,
                fournisseurs=p_fournisseurs,
            ),
            contrats=ContratKpi(
                total_actifs=len(c_actifs),
                total_volume_dzd=c_volume,
            ),
            cautions=CautionKpi(
                total_chez_client=len(cau_chez_client),
                total_encours_dzd=cau_encours,
            ),
            stock=StockKpi(
                total_references=s_total,
                stock_normal=s_normal,
                stock_faible=s_faible,
                stock_rupture=s_rupture,
            ),
            maintenance=MaintenanceKpi(
                interventions_terminees=m_terminees,
                interventions_en_cours=m_en_cours,
                budget_maintenance_dzd=m_budget,
            ),
        ),
        recent_activity=activity_items[:8],
    )


@router.get("/alertes", response_model=AlertsResponse, summary="Get Global System Alerts and Expirations")
def get_global_alerts(db: Session = Depends(get_db)):
    today = dt_date.today()
    alert_items: List[AlertItem] = []

    # 1. Documents Expirations (Vehicles, Employees, General)
    docs = db.query(Document).filter(Document.archived_at.is_(None), Document.date_expiration.isnot(None)).all()
    for doc in docs:
        delta = (doc.date_expiration - today).days
        target_link = (
            f"/vehicules/{doc.entity_id}"
            if doc.entity_type == "vehicule"
            else f"/employes/{doc.entity_id}"
            if doc.entity_type == "employe"
            else f"/contrats/{doc.entity_id}"
            if doc.entity_type == "contrat"
            else "/"
        )

        if delta < 0:
            alert_items.append(
                AlertItem(
                    id=f"doc-exp-{doc.id}",
                    type="DOCUMENT",
                    severity="URGENT",
                    title=f"Document Expiré : {doc.nom}",
                    message=f"Le document ({doc.type}) est expiré depuis {abs(delta)} jour(s).",
                    entity_type=doc.entity_type or "document",
                    entity_id=str(doc.entity_id or doc.id),
                    link=target_link,
                    days_left=delta,
                    badge_label="🔴 Expiré",
                )
            )
        elif delta <= 7:
            alert_items.append(
                AlertItem(
                    id=f"doc-urg-{doc.id}",
                    type="DOCUMENT",
                    severity="URGENT",
                    title=f"Expiration Imminente : {doc.nom}",
                    message=f"Le document ({doc.type}) expire dans {delta} jour(s).",
                    entity_type=doc.entity_type or "document",
                    entity_id=str(doc.entity_id or doc.id),
                    link=target_link,
                    days_left=delta,
                    badge_label=f"🔴 {delta}j restants",
                )
            )
        elif delta <= 30:
            alert_items.append(
                AlertItem(
                    id=f"doc-warn-{doc.id}",
                    type="DOCUMENT",
                    severity="WARNING",
                    title=f"Échéance Document : {doc.nom}",
                    message=f"Le document ({doc.type}) arrive à échéance dans {delta} jours.",
                    entity_type=doc.entity_type or "document",
                    entity_id=str(doc.entity_id or doc.id),
                    link=target_link,
                    days_left=delta,
                    badge_label=f"🟠 {delta} jours",
                )
            )

    # 2. Driver Licenses Expirations (Permis)
    permis_all = db.query(Permis).all()
    for p in permis_all:
        if p.date_expiration:
            delta = (p.date_expiration - today).days
            if delta < 0:
                alert_items.append(
                    AlertItem(
                        id=f"permis-exp-{p.id}",
                        type="DOCUMENT",
                        severity="URGENT",
                        title=f"Permis Expiré : {p.numero}",
                        message=f"Le titre de conduite du chauffeur {p.chauffeur.nom if p.chauffeur else ''} est expiré.",
                        entity_type="employe",
                        entity_id=str(p.chauffeur_id),
                        link=f"/employes/{p.chauffeur_id}",
                        days_left=delta,
                        badge_label="🔴 Permis Expiré",
                    )
                )
            elif delta <= 30:
                alert_items.append(
                    AlertItem(
                        id=f"permis-warn-{p.id}",
                        type="DOCUMENT",
                        severity="WARNING",
                        title=f"Échéance Permis : {p.numero}",
                        message=f"Le permis du chauffeur {p.chauffeur.nom if p.chauffeur else ''} expire dans {delta} jours.",
                        entity_type="employe",
                        entity_id=str(p.chauffeur_id),
                        link=f"/employes/{p.chauffeur_id}",
                        days_left=delta,
                        badge_label=f"🟠 {delta} jours",
                    )
                )

    # 3. Contract Expirations
    contrats = db.query(Contrat).filter(Contrat.archived_at.is_(None), Contrat.statut == StatutContrat.ACTIF).all()
    for ctr in contrats:
        delta = (ctr.date_fin - today).days
        if delta <= 7:
            alert_items.append(
                AlertItem(
                    id=f"ctr-urg-{ctr.id}",
                    type="CONTRAT",
                    severity="URGENT",
                    title=f"Contrat Expirant : {ctr.reference}",
                    message=f"La convention avec {ctr.partenaire.nom_commercial if ctr.partenaire else 'le client'} expire dans {delta} jour(s).",
                    entity_type="contrat",
                    entity_id=str(ctr.id),
                    link=f"/contrats/{ctr.id}",
                    days_left=delta,
                    badge_label=f"🔴 {delta}j",
                )
            )
        elif delta <= 30:
            alert_items.append(
                AlertItem(
                    id=f"ctr-warn-{ctr.id}",
                    type="CONTRAT",
                    severity="WARNING",
                    title=f"Échéance Contrat : {ctr.reference}",
                    message=f"Convention à renouveler dans {delta} jours.",
                    entity_type="contrat",
                    entity_id=str(ctr.id),
                    link=f"/contrats/{ctr.id}",
                    days_left=delta,
                    badge_label=f"🟠 {delta}j",
                )
            )

    # 4. Caution Expirations
    cautions = db.query(Caution).filter(Caution.statut == StatutCaution.CHEZ_CLIENT).all()
    for cau in cautions:
        if cau.date_echeance:
            delta = (cau.date_echeance - today).days
            if delta <= 30:
                alert_items.append(
                    AlertItem(
                        id=f"cau-warn-{cau.id}",
                        type="CAUTION",
                        severity="WARNING",
                        title=f"Caution à Réclamer : {cau.numero}",
                        message=f"Caution de {cau.montant:,.0f} DZD chez {cau.client.nom_commercial if cau.client else 'client'} à échéance dans {delta} jours.",
                        entity_type="caution",
                        entity_id=str(cau.id),
                        link="/cautions",
                        days_left=delta,
                        badge_label=f"🟠 {delta}j",
                    )
                )

    # 5. Spare Parts Inventory Shortages (Stock)
    pieces = db.query(Piece).filter(Piece.archived_at.is_(None)).all()
    for p in pieces:
        if p.stock_actuel <= 0:
            alert_items.append(
                AlertItem(
                    id=f"stock-rup-{p.id}",
                    type="STOCK",
                    severity="URGENT",
                    title=f"Rupture de Stock : {p.reference}",
                    message=f"{p.designation} épuisé (Stock: 0 {p.unite}). Commande fournisseur requise.",
                    entity_type="stock",
                    entity_id=str(p.id),
                    link="/stock",
                    badge_label="🔴 Rupture",
                )
            )
        elif p.stock_actuel <= p.stock_minimum:
            alert_items.append(
                AlertItem(
                    id=f"stock-low-{p.id}",
                    type="STOCK",
                    severity="WARNING",
                    title=f"Seuil Minimum Atteint : {p.reference}",
                    message=f"{p.designation} ({p.stock_actuel} {p.unite} restants sur seuil min de {p.stock_minimum}).",
                    entity_type="stock",
                    entity_id=str(p.id),
                    link="/stock",
                    badge_label="🟠 Réappro",
                )
            )

    # 6. Workshop Fleet Immobilization (Maintenance)
    interventions_in_progress = db.query(Intervention).filter(Intervention.statut == StatutIntervention.EN_COURS).all()
    for it in interventions_in_progress:
        alert_items.append(
            AlertItem(
                id=f"maint-prog-{it.id}",
                type="MAINTENANCE",
                severity="WARNING",
                title=f"Véhicule Immobilisé : {it.vehicule.immatriculation if it.vehicule else 'Atelier'}",
                message=f"Ordre de travail {it.numero} ({it.categorie}) en cours de réparation à l'atelier.",
                entity_type="intervention",
                entity_id=str(it.id),
                link="/maintenance",
                badge_label="🟠 Atelier",
            )
        )

    # Sort alerts: URGENT first, then WARNING, then INFO
    severity_order = {"URGENT": 0, "WARNING": 1, "INFO": 2}
    alert_items.sort(key=lambda x: severity_order.get(x.severity, 99))

    urgent_c = sum(1 for a in alert_items if a.severity == "URGENT")
    warning_c = sum(1 for a in alert_items if a.severity == "WARNING")
    info_c = sum(1 for a in alert_items if a.severity == "INFO")

    return AlertsResponse(
        items=alert_items,
        total=len(alert_items),
        urgent_count=urgent_c,
        warning_count=warning_c,
        info_count=info_c,
    )
