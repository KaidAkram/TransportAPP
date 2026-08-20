import os
from num2words import num2words
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer


def _amount_in_letters(amount: float, devise: str = "DA") -> str:
    integer_part = int(amount)
    decimal_part = round((amount - integer_part) * 100)
    text = num2words(integer_part, lang="fr").capitalize()
    if decimal_part:
        text += f" {devise} et {decimal_part:02d} cts"
    else:
        text += f" {devise}"
    return text


def generate_caution_pdf(
    caution_number: str,
    caution_type: str,
    amount: float,
    devise: str,
    client_name: str,
    client_address: str,
    objet: str,
    date_emission,
    date_echeance=None,
    ref_contrat: str = None,
    banque_name: str = "Banque Nationale d'Algérie (BNA)",
    lieu_demande: str = None,
    lieu_soumission: str = None,
    numero_compte_bancaire: str = None,
    societe_nom: str = None,
    client_societe_nom: str = None,
    company_name: str = None,
    company_nif: str = None,
    company_nis: str = None,
    company_rc: str = None,
    company_ai: str = None,
) -> str:
    output_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "public", "assets", "documents", "cautions")
    )
    os.makedirs(output_dir, exist_ok=True)

    sanitized = caution_number.replace("/", "_").replace("\\", "_")
    filename = f"caution_{sanitized}.pdf"
    filepath = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(filepath, pagesize=A4,
                            rightMargin=2.5 * cm, leftMargin=2.5 * cm,
                            topMargin=2.5 * cm, bottomMargin=2.5 * cm)

    ct = (caution_type or "").upper()
    if "BONNE" in ct or "EXECUTION" in ct:
        story = _build_bonne_execution(doc, caution_number, amount, devise, client_name,
                                       client_address, objet, date_emission, date_echeance,
                                       ref_contrat, banque_name, lieu_demande,
                                       client_societe_nom, company_name, company_nif,
                                       company_nis, company_rc, company_ai)
    else:
        story = _build_soumission(doc, caution_number, amount, devise, client_name,
                                  client_address, objet, date_emission, date_echeance,
                                  ref_contrat, banque_name, lieu_soumission,
                                  client_societe_nom, company_name, company_nif,
                                  company_nis, company_rc, company_ai)

    doc.build(story)
    return f"/assets/documents/cautions/{filename}"


# ═══════════════════════════════════════════════════════════════════
#  SOUMISSION
# ═══════════════════════════════════════════════════════════════════
def _build_soumission(doc, caution_number, amount, devise, client_name,
                      client_address, objet, date_emission, date_echeance,
                      ref_contrat, banque_name, lieu_soumission,
                      client_societe_nom, company_name, company_nif,
                      company_nis, company_rc, company_ai):
    styles = getSampleStyleSheet()
    lieu_s = lieu_soumission or "..."
    date_str = date_emission.strftime("%d/%m/%Y") if hasattr(date_emission, "strftime") else str(date_emission)
    montant_chiffres = f"{amount:,.2f} {devise}".replace(",", " ")
    montant_lettres = _amount_in_letters(amount, devise)
    ref_display = ref_contrat or caution_number or "..."

    ent = company_name or "Notre Société"
    nif = company_nif or "..."
    nis = company_nis or "..."
    rc = company_rc or "..."
    ai = company_ai or "..."

    body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=11, leading=16,
                          alignment=0, fontName="Helvetica")
    body_r = ParagraphStyle("BodyR", parent=body, alignment=2)
    body_c = ParagraphStyle("BodyC", parent=body, alignment=1, fontName="Helvetica-Bold", fontSize=13)

    story = []

    # ── Header: Company name + fiscal IDs ──
    story.append(Paragraph(f"<b>{ent}</b>", body_c))
    story.append(Paragraph(
        f"<font size=9>NIF : {nif}  |  NIS : {nis}  |  RC : {rc}  |  AI : {ai}</font>",
        ParagraphStyle("HeaderIDs", parent=body, fontSize=9, alignment=1, leading=13),
    ))
    story.append(Spacer(1, 24))

    # ── Addressee + Date (right-aligned) ──
    story.append(Paragraph("À l'attention de", body_r))
    story.append(Paragraph("<b>Monsieur Le Directeur</b>", body_r))
    story.append(Paragraph(f"De la Banque : {banque_name}", body_r))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"{lieu_s}, le {date_str}", body_r))
    story.append(Spacer(1, 16))

    # ── Objet ──
    story.append(Paragraph("<b>Objet : Demande d'émission d'une caution de soumission</b>", body))
    story.append(Spacer(1, 12))

    # ── Body ──
    story.append(Paragraph(
        "Nous avons l'honneur de vous demander de bien vouloir procéder à l'émission, "
        "en notre faveur, d'une <b>caution de soumission</b> destinée à être remise au "
        "bénéficiaire ci-après désigné, dans le cadre de la participation à l'appel "
        "d'offres suivant :",
        body,
    ))
    story.append(Spacer(1, 12))

    story.append(Paragraph(f"<b>Bénéficiaire :</b> {client_societe_nom or client_name}", body))
    story.append(Paragraph(f"<b>Référence du marché / appel d'offres :</b> {ref_display}", body))
    story.append(Paragraph(f"<b>Objet du marché / appel d'offres :</b> {objet}", body))
    story.append(Paragraph(f"<b>Montant de la caution :</b> {montant_chiffres} ({montant_lettres})", body))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "Nous vous prions de bien vouloir établir ladite caution conformément aux "
        "conditions et exigences prévues dans le dossier de consultation / cahier des "
        "charges concerné.",
        body,
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "À cet effet, nous nous engageons à respecter l'ensemble des conditions "
        "applicables à cette opération et à vous fournir, le cas échéant, toute pièce "
        "ou information complémentaire nécessaire à l'établissement de la caution.",
        body,
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "Nous vous remercions de bien vouloir donner suite à la présente demande dans "
        "les meilleurs délais et de nous informer de la disponibilité de la caution pour "
        "retrait.",
        body,
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "Veuillez agréer, Monsieur le Directeur, l'expression de notre considération distinguée.",
        body,
    ))
    story.append(Spacer(1, 30))

    # ── Signature ──
    story.append(Paragraph(
        f"<b>{ent}</b><br/>"
        f"<font size=9 color='#6B7280'>Cachet et signature</font>",
        body,
    ))

    return story


# ═══════════════════════════════════════════════════════════════════
#  BONNE EXÉCUTION
# ═══════════════════════════════════════════════════════════════════
def _build_bonne_execution(doc, caution_number, amount, devise, client_name,
                           client_address, objet, date_emission, date_echeance,
                           ref_contrat, banque_name, lieu_demande,
                           client_societe_nom, company_name, company_nif,
                           company_nis, company_rc, company_ai):
    styles = getSampleStyleSheet()
    lieu_d = lieu_demande or "..."
    date_str = date_emission.strftime("%d/%m/%Y") if hasattr(date_emission, "strftime") else str(date_emission)
    montant_chiffres = f"{amount:,.2f} {devise}".replace(",", " ")
    montant_lettres = _amount_in_letters(amount, devise)
    ref_display = ref_contrat or caution_number or "..."

    ent = company_name or "Notre Société"
    nif = company_nif or "..."
    nis = company_nis or "..."
    rc = company_rc or "..."
    ai = company_ai or "..."

    body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=11, leading=16,
                          alignment=0, fontName="Helvetica")
    body_r = ParagraphStyle("BodyR", parent=body, alignment=2)
    body_c = ParagraphStyle("BodyC", parent=body, alignment=1, fontName="Helvetica-Bold", fontSize=13)

    story = []

    # ── Header: Company name + fiscal IDs ──
    story.append(Paragraph(f"<b>{ent}</b>", body_c))
    story.append(Paragraph(
        f"<font size=9>NIF : {nif}  |  NIS : {nis}  |  RC : {rc}  |  AI : {ai}</font>",
        ParagraphStyle("HeaderIDs", parent=body, fontSize=9, alignment=1, leading=13),
    ))
    story.append(Spacer(1, 24))

    # ── Addressee + Date (right-aligned) ──
    story.append(Paragraph("À l'attention de", body_r))
    story.append(Paragraph("<b>Monsieur Le Directeur</b>", body_r))
    story.append(Paragraph(f"De la Banque : {banque_name}", body_r))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"{lieu_d}, le {date_str}", body_r))
    story.append(Spacer(1, 16))

    # ── Objet ──
    story.append(Paragraph("<b>Objet : Demande d'émission d'une caution de bonne exécution</b>", body))
    story.append(Spacer(1, 12))

    # ── Body ──
    story.append(Paragraph(
        "Nous avons l'honneur de vous demander de bien vouloir procéder à l'émission, "
        "en notre faveur, d'une <b>caution de bonne exécution</b>, destinée à garantir "
        "la bonne exécution de nos obligations contractuelles au titre du marché suivant :",
        body,
    ))
    story.append(Spacer(1, 12))

    story.append(Paragraph(f"<b>Bénéficiaire :</b> {client_societe_nom or client_name}", body))
    story.append(Paragraph(f"<b>Référence du marché / contrat :</b> {ref_display}", body))
    story.append(Paragraph(f"<b>Objet du marché / contrat :</b> {objet}", body))
    story.append(Paragraph(f"<b>Montant du marché :</b> {montant_chiffres} ({montant_lettres})", body))
    story.append(Paragraph(f"<b>Montant de la caution :</b> {montant_chiffres} ({montant_lettres})", body))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "Nous vous prions de bien vouloir établir ladite caution conformément aux "
        "dispositions du contrat concerné et aux exigences du bénéficiaire.",
        body,
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "Nous nous engageons à vous fournir l'ensemble des documents et informations "
        "nécessaires à l'établissement de cette garantie, ainsi qu'à accomplir toutes "
        "les formalités requises à cet effet.",
        body,
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "Nous vous remercions de bien vouloir donner suite à la présente demande dans "
        "les meilleurs délais.",
        body,
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "Veuillez agréer, Monsieur le Directeur, l'expression de notre considération distinguée.",
        body,
    ))
    story.append(Spacer(1, 30))

    # ── Signature ──
    story.append(Paragraph(
        f"<b>{ent}</b><br/>"
        f"<font size=9 color='#6B7280'>Cachet et signature</font>",
        body,
    ))

    return story
