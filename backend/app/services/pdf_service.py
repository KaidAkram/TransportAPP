import os
from datetime import date as dt_date
from num2words import num2words
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable


def _amount_in_letters(amount: float, devise: str = "DA") -> str:
    """Convert amount to French text (e.g. 'Un Million Vingt-deux mille ... Dinars')."""
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
                                       numero_compte_bancaire, societe_nom)
    else:
        story = _build_soumission(doc, caution_number, amount, devise, client_name,
                                  client_address, objet, date_emission, date_echeance,
                                  ref_contrat, banque_name, lieu_soumission,
                                  numero_compte_bancaire, societe_nom)

    doc.build(story)
    return f"/assets/documents/cautions/{filename}"


# ═══════════════════════════════════════════════════════════════════
#  SOUMISSION  –  "LETTRE DEMANDE DE CAUTION DE SOUMISSION"
# ═══════════════════════════════════════════════════════════════════
def _build_soumission(doc, caution_number, amount, devise, client_name,
                      client_address, objet, date_emission, date_echeance,
                      ref_contrat, banque_name, lieu_soumission,
                      numero_compte_bancaire, societe_nom):
    styles = getSampleStyleSheet()
    societe = societe_nom or "Notre Société"
    lieu_s = lieu_soumission or "..."
    date_str = date_emission.strftime("%d/%m/%Y") if hasattr(date_emission, "strftime") else str(date_emission)
    lieu_date = f"{lieu_s}, le {date_str}"
    montant_chiffres = f"{amount:,.2f} {devise}".replace(",", " ")
    montant_lettres = _amount_in_letters(amount, devise)
    ref_display = ref_contrat or caution_number or "..."

    body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=11, leading=16,
                          alignment=0, fontName="Helvetica")
    body_j = ParagraphStyle("BodyJ", parent=body, alignment=4)
    body_r = ParagraphStyle("BodyR", parent=body, alignment=2)
    body_c = ParagraphStyle("BodyC", parent=body, alignment=1)
    bold_body = ParagraphStyle("BoldBody", parent=body, fontName="Helvetica-Bold")
    small = ParagraphStyle("Small", parent=body, fontSize=9, leading=13)

    story = []

    # ── Header (société) ──
    story.append(Paragraph(f"<b>{societe}</b>", ParagraphStyle("H", parent=body, fontSize=13, alignment=1, fontName="Helvetica-Bold")))
    story.append(Spacer(1, 24))

    # ── Addressee (right) + Date/lieu (right) — stacked vertically ──
    story.append(Paragraph("À l'attention de", body_r))
    story.append(Paragraph("<b>Monsieur Le Directeur</b>", body_r))
    story.append(Paragraph(f"De la Banque : {banque_name}", body_r))
    story.append(Spacer(1, 8))
    story.append(Paragraph(lieu_date, body_r))
    story.append(Spacer(1, 16))

    # ── Subject ──
    story.append(Paragraph("<b>Objet : Demande de caution de soumission</b>", body))
    story.append(Spacer(1, 10))

    # ── Body paragraph 1 ──
    story.append(Paragraph(
        f"Nous vous prions de fournir à <b>{societe}</b> sous notre pleine et entière "
        f"responsabilité à votre égard une caution personnelle et solidaire de "
        f"<b>{montant_chiffres}</b> ({montant_lettres}).",
        body,
    ))
    story.append(Spacer(1, 8))

    # ── Declaration ──
    story.append(Paragraph(
        f"Établie selon le texte repris ci-après.",
        body,
    ))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        f"Déclarons nous porter caution personnelle et solidaire de :",
        body,
    ))
    story.append(Paragraph(f"<b>{societe}</b>", body))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        f"Pour le montant du cautionnement provisoire auquel ce dernier est assujetti "
        f"pour être autorisé à soumissionner à l'adjudication qui doit avoir lieu à : "
        f"<b>{lieu_s}</b>",
        body,
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph(f"<b>Numéro Appel d'Offres :</b> {ref_display}", body))
    story.append(Paragraph(f"<b>Objet de prestation :</b> {objet}", body))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        f"Le dit cautionnement provisoire s'élève à <b>{montant_chiffres}</b> "
        f"({montant_lettres}).",
        body,
    ))
    story.append(Spacer(1, 10))

    # ── Legal commitment ──
    story.append(Paragraph("Nous vous autorisons :", body))
    story.append(Paragraph(
        "– dès à présent, à effectuer sur ordre de l'administration contractante, "
        "sans différer ou soulever de contestations pour quelque motif que soit, "
        "jusqu'à concurrence du montant sus-indiqué de la garantie dont il s'agit, "
        "le versement des sommes dont nous serions, selon ladite administration, "
        "débiteurs au titre du marché précité.",
        body,
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "Nous nous interdisons, formellement de contester à votre égard le bien fondé "
        "des versements que vous pourriez être amenés à effectuer et dont vous débiteriez "
        "notre compte sur vos livres. Au cas où la provision existante à ce compte serait "
        "alors insuffisante, nous vous verserions immédiatement, à première demande de "
        "votre part, le complément.",
        body,
    ))
    story.append(Spacer(1, 6))

    if numero_compte_bancaire:
        story.append(Paragraph(
            f"Conformément à nos accords verbaux, nous vous autorisons à constituer par le "
            f"débit de notre compte N°<b>{numero_compte_bancaire}</b> dans vos livres une "
            f"provision de garantie égale à 100% du montant de la caution dont il s'agit.",
            body,
        ))
    else:
        story.append(Paragraph(
            "Conformément à nos accords verbaux, nous vous autorisons à constituer par le "
            "débit de notre compte N° ... dans vos livres une provision de garantie égale "
            "à 100% du montant de la caution dont il s'agit.",
            body,
        ))
    story.append(Spacer(1, 20))

    # ── Closing ──
    story.append(Paragraph("Veuillez agréer, Monsieur Le Directeur, l'expression de nos meilleurs sentiments.", body))
    story.append(Spacer(1, 30))

    # ── Signature ──
    sig_data = [[
        Paragraph(f"<b>{societe}</b><br/><font size=9 color='#6B7280'>Cachet et signature du client</font>", body),
        Paragraph("", body),
    ]]
    sig_table = Table(sig_data, colWidths=[8.5 * cm, 8.5 * cm])
    sig_table.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 40),
    ]))
    story.append(sig_table)

    return story


# ═══════════════════════════════════════════════════════════════════
#  BONNE EXÉCUTION  –  "caution bonne execution"
# ═══════════════════════════════════════════════════════════════════
def _build_bonne_execution(doc, caution_number, amount, devise, client_name,
                           client_address, objet, date_emission, date_echeance,
                           ref_contrat, banque_name, lieu_demande,
                           numero_compte_bancaire, societe_nom):
    styles = getSampleStyleSheet()
    societe = societe_nom or "Notre Société"
    lieu_d = lieu_demande or "..."
    date_str = date_emission.strftime("%d/%m/%Y") if hasattr(date_emission, "strftime") else str(date_emission)
    lieu_date = f"{lieu_d}, le {date_str}"
    montant_chiffres = f"{amount:,.2f} {devise}".replace(",", " ")
    montant_lettres = _amount_in_letters(amount, devise)
    ref_display = ref_contrat or caution_number or "..."

    body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=11, leading=16,
                          alignment=0, fontName="Helvetica")
    body_j = ParagraphStyle("BodyJ", parent=body, alignment=4)
    body_r = ParagraphStyle("BodyR", parent=body, alignment=2)
    small = ParagraphStyle("Small", parent=body, fontSize=9, leading=13, alignment=0)

    story = []

    # ── Date & lieu (right) ──
    story.append(Paragraph(lieu_date, body_r))
    story.append(Spacer(1, 20))

    # ── Subject ──
    story.append(Paragraph("<b>Objet : Demande d'une caution de bonne exécution.</b>", body))
    story.append(Spacer(1, 12))

    # ── Opening greeting ──
    story.append(Paragraph("Monsieur le directeur,", body))
    story.append(Spacer(1, 8))

    # ── Request paragraph ──
    story.append(Paragraph(
        f"Nous Vous Prions de fournir à la <b>{societe}</b> sous notre pleine et entière "
        f"responsabilité à votre égard une caution personnelle et solidaire de "
        f"<b>{montant_chiffres}</b> ({montant_lettres}) "
        f"selon le texte repris ci après :",
        body,
    ))
    story.append(Spacer(1, 10))

    # ── Bank legal identity (detailed, from the Word template) ──
    story.append(Paragraph(
        f"Nous soussignés, <b>{banque_name}</b>, Société par actions au capital social "
        f"de 150 000 000 000.00 DA dont le siège social est sis à Alger, "
        f"08 Bd Ermesto Che Guevara, créée par Ordonnance N° 66.178 du 13 Juin 1966 "
        f"et Transformée en EPE-SPA par acte notarié du 14.02.1999 enregistrée au niveau "
        f"du CNRC Alger sous le N° 0012904B00.",
        body,
    ))
    story.append(Spacer(1, 8))

    # ── Bank representative ──
    story.append(Paragraph(
        f"Représentée par Mr <b>Directeur P/I</b> de la {banque_name} "
        f"ayant pouvoirs nécessaires à l'effet de présente.",
        body,
    ))
    story.append(Spacer(1, 10))

    # ── Contract details ──
    story.append(Paragraph(
        f"Connaissance prise du contrat <b>N°{ref_display}</b>, montant global, "
        f"conclu entre : <b>{societe}</b> d'une part et <b>{client_name}</b> autre part",
        body,
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph(
        f"<b>Ayant pour objet :</b> {objet}",
        body,
    ))
    story.append(Spacer(1, 10))

    # ── Caution emission ──
    story.append(Paragraph(
        f"Emettons en faveur de <b>{societe}</b>",
        body,
    ))
    story.append(Paragraph(
        f"Une caution de bonne exécution de "
        f"<b>{montant_chiffres}</b> ({montant_lettres})",
        body,
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        f"Représentant 100% du montant global en hors taxe de la convention susvisée, "
        f"qui couvre le risque d'inexécution ou exécution incomplète et/ou imparfaite "
        f"de ses obligations contractuelles.",
        body,
    ))
    story.append(Spacer(1, 10))

    # ── Legal commitments ──
    story.append(Paragraph(
        "Nous paierons, à sa première demande les sommes dont "
        f"<b>{societe}</b> sera reconnu débiteur au titre du marché et à concurrence "
        "de la somme garantie ci-dessus",
        body,
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        f"Sous réserve de prorogation qui demeure soumise à l'accord préalable de la "
        f"{banque_name}, cette caution de bonne exécution est transformée en caution "
        f"de garantie à la réception provisoire et demeure valable jusqu'à l'obtention "
        f"de la main levée et en tout état de cause 01 mois après la date de la réception "
        f"définitive.",
        body,
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "Nous vous autorisons, dès à présent, à effectuer sur ordre de l'Administration "
        "contractante, sans différer ou soulever de contestations pour quelque motif que soit "
        "jusqu'à concurrence du montant sus indiqué de la garantie dont il s'agit, le versement "
        "des sommes dont nous serions selon ladite administration, débiteurs au titre du marché "
        "précité.",
        body,
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "Nous nous interdisons, formellement de constater à votre égard le bien fondé des "
        "versements que vous pourriez être ainsi amenés à effectuer et dont vous débiteriez "
        "notre compte sur vos livres, au cas où la provision existante à ce compte serait alors "
        "insuffisante, nous vous verserions immédiatement, à première demande de votre part, "
        "le complément.",
        body,
    ))
    story.append(Spacer(1, 6))

    if numero_compte_bancaire:
        story.append(Paragraph(
            f"Conformément à nos accords verbaux, nous vous autorisons à constituer par le "
            f"débit de notre compte N°<b>{numero_compte_bancaire}</b> ouvert sur vos livres "
            f"une provision de garantie égale à <b>100%</b> du Montant de la caution dont il s'agit.",
            body,
        ))
    else:
        story.append(Paragraph(
            "Conformément à nos accords verbaux, nous vous autorisons à constituer par le "
            "débit de notre compte N° ... ouvert sur vos livres une provision de garantie "
            "égale à <b>100%</b> du Montant de la caution dont il s'agit.",
            body,
        ))
    story.append(Spacer(1, 20))

    # ── Closing ──
    story.append(Paragraph(
        "Veuillez agréer, Monsieur le Directeur l'expression de nos meilleurs sentiments.",
        body,
    ))
    story.append(Spacer(1, 30))

    # ── Single signature (client only) ──
    story.append(Paragraph(
        f"<b>{societe}</b><br/>"
        f"<font size=9 color='#6B7280'>Cachet et signature du client</font>",
        body,
    ))

    return story
