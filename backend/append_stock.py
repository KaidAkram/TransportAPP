
code_to_append = """
@router.post("/receptions/{reception_id}/generate-pdf-achat", response_model=ReceptionRead, summary="Generate Bon d'Achat PDF", dependencies=[Depends(require_feature("create_stock_entry"))])
def generate_bon_achat(reception_id: UUID, db: Session = Depends(get_db)):
  r = db.query(Reception).options(joinedload(Reception.fournisseur), joinedload(Reception.lignes).joinedload(ReceptionLigne.piece)).filter(Reception.id == reception_id).first()
  if not r:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Réception introuvable.")

  from app.services.pdf_service import generate_bon_achat_pdf
  settings = get_or_create_settings(db)
  
  fournisseur_nom = r.fournisseur.nom_commercial if r.fournisseur else "INCONNU"
  fournisseur_tel = r.fournisseur.telephone if (r.fournisseur and r.fournisseur.telephone) else "-"
  
  lignes_data = []
  for l in r.lignes:
      lignes_data.append({
          "reference": l.piece.reference if l.piece else "-",
          "designation": l.piece.designation if l.piece else "-",
          "quantite": l.quantite,
          "prix_unitaire": l.prix_unitaire,
          "montant_ligne": l.montant_ligne
      })
      
  pdf_url = generate_bon_achat_pdf(
      reception_numero=r.numero,
      date_reception=r.date,
      fournisseur_nom=fournisseur_nom,
      fournisseur_tel=fournisseur_tel,
      lignes=lignes_data,
      montant_total=r.montant_total,
      mode_reglement=r.mode_reglement.name if r.mode_reglement else "A_Terme",
      company_name=settings.company_name or "GarageDZ",
      company_address=settings.company_address or "25 ARZEW, ORAN",
      company_phone=settings.company_phone or "",
      company_rc=settings.company_rc or "RC N° 00000000000",
      company_nif=settings.company_nif or "00000000000000",
      company_nis=settings.company_nis or "00000000000000",
      company_ai=settings.company_ai or "00000000000",
  )
  
  r.url_pdf = pdf_url
  db.commit()
  db.refresh(r)
  
  lignes_read = []
  for l in r.lignes:
    lignes_read.append({
      "id": l.id,
      "piece_id": l.piece_id,
      "piece_reference": l.piece.reference if l.piece else None,
      "piece_designation": l.piece.designation if l.piece else None,
      "quantite": l.quantite,
      "prix_unitaire": l.prix_unitaire,
      "montant_ligne": l.montant_ligne,
    })

  return ReceptionRead(
    id=r.id,
    numero=r.numero,
    fournisseur_id=r.fournisseur_id,
    fournisseur_nom=r.fournisseur.nom_commercial if r.fournisseur else None,
    date=r.date,
    lieu=r.lieu,
    montant_total=r.montant_total,
    mode_reglement=r.mode_reglement,
    motif=r.motif,
    reference_document=r.reference_document,
    url_pdf=r.url_pdf,
    created_at=r.created_at,
    updated_at=r.updated_at,
  )
"""

with open(r"c:\Users\Akram KAID\Desktop\Entreprise_transport\backend\app\api\v1\stock.py", "a", encoding="utf-8") as f:
    f.write(code_to_append)
