import os
from num2words import num2words
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib import colors


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
    company_address: str = "Zone Industrielle Oued Smar, Alger",
    company_phone: str = "+213 (0) 23 85 40 00",
    company_email: str = "contact@etransport.dz",
    company_activity: str = "Transport routier de marchandises",
    company_rib: str = "002 00612 0123456789 45",
    montant_contrat: float = None,
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
                                       numero_compte_bancaire, client_societe_nom,
                                       company_name, company_nif, company_nis,
                                       company_rc, company_ai, company_address, company_phone, company_email, company_activity, company_rib,
                                       lieu_soumission=lieu_soumission,
                                       montant_contrat=montant_contrat)
    else:
        story = _build_soumission(doc, caution_number, amount, devise, client_name,
                                  client_address, objet, date_emission, date_echeance,
                                  ref_contrat, banque_name, lieu_soumission,
                                  numero_compte_bancaire, client_societe_nom,
                                  company_name, company_nif, company_nis,
                                  company_rc, company_ai, company_address, company_phone, company_email, company_activity, company_rib,
                                  lieu_demande=lieu_demande)

    doc.build(story)
    return f"/assets/documents/cautions/{filename}"


# ═══════════════════════════════════════════════════════════════════
#  SOUMISSION
# ═══════════════════════════════════════════════════════════════════
def _build_soumission(doc, caution_number, amount, devise, client_name,
                      client_address, objet, date_emission, date_echeance,
                      ref_contrat, banque_name, lieu_soumission,
                      numero_compte_bancaire, client_societe_nom,
                      company_name, company_nif, company_nis,
                      company_rc, company_ai, company_address, company_phone, company_email, company_activity, company_rib,
                      lieu_demande=None):
    styles = getSampleStyleSheet()
    lieu_s = lieu_soumission or lieu_demande or "..."
    date_str = date_emission.strftime("%d/%m/%Y") if hasattr(date_emission, "strftime") else str(date_emission)
    montant_chiffres = f"{amount:,.2f} {devise}".replace(",", " ")
    montant_lettres = _amount_in_letters(amount, devise)
    ref_display = ref_contrat or caution_number or "..."
    num_compte = numero_compte_bancaire or "........"

    ent = company_name or "E-TRANSPORT VOYAGES & LOGISTIQUE EURL"
    nif = company_nif or "001916001234567"
    nis = company_nis or "..."
    rc = company_rc or "16/00-1234567B19"
    ai = company_ai or "..."
    addr = company_address or "Zone Industrielle Oued Smar, Alger"
    phone = company_phone or "+213 (0) 23 85 40 00"
    email = company_email or "contact@etransport.dz"
    act = company_activity or "Transport routier de marchandises"
    rib = company_rib or "002 00612 0123456789 45"

    body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=11, leading=16,
                          alignment=0, fontName="Helvetica")
    body_r = ParagraphStyle("BodyR", parent=body, alignment=2)
    body_c = ParagraphStyle("BodyC", parent=body, alignment=1, fontName="Helvetica-Bold", fontSize=13)
    header_bold = ParagraphStyle('HeaderBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=14)
    header_norm = ParagraphStyle('HeaderNorm', parent=styles['Normal'], fontName='Helvetica', fontSize=10)
    reg_style = ParagraphStyle('RegStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=8, alignment=2)

    story = []

    # ── Header: Company name + fiscal IDs ──
    comp_info = [
        Paragraph(f"<b>{ent}</b>", header_bold),
        Paragraph(f"<b>{addr}</b>", header_bold),
        Paragraph(f"RC: {rc} | NIF: {nif} | AI: {ai} | NIS: {nis}", header_norm),
        Paragraph(f"Tél: {phone}" if phone else "", header_norm),
        Paragraph(f"Email: {email}" if email else "", header_norm),
        Paragraph(f"Activité: {act}", header_norm),
    ]
    
    reg_info = [
        Paragraph(f"RIB: {rib}", reg_style),
    ]

    header_table = Table([[comp_info, reg_info]], colWidths=[10*cm, 6*cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 1*cm))

    # ── Addressee + Date (right-aligned) ──
    story.append(Paragraph("À l'attention de", body_r))
    story.append(Paragraph("<b>Monsieur le Directeur</b>", body_r))
    story.append(Paragraph(f"De la Banque : {banque_name}", body_r))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"{lieu_s}, le {date_str}", body_r))
    story.append(Spacer(1, 16))

    # ── Objet ──
    story.append(Paragraph("<b>Objet : Demande d'émission d'une caution de soumission</b>", body))
    story.append(Spacer(1, 12))

    # ── Body ──
    story.append(Paragraph("Monsieur le Directeur,", body))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "Nous avons l'honneur de vous demander de bien vouloir procéder à l'émission, "
        "pour notre compte et au profit du bénéficiaire ci-après désigné, d'une "
        "<b>caution de soumission</b>, dans le cadre de notre participation à l'appel "
        "d'offres suivant :",
        body,
    ))
    story.append(Spacer(1, 12))

    story.append(Paragraph(f"<b>Bénéficiaire :</b> {client_societe_nom or client_name}", body))
    story.append(Paragraph(f"<b>Référence de l'appel d'offres :</b> {ref_display}", body))
    story.append(Paragraph(f"<b>Objet de l'appel d'offres :</b> {objet}", body))
    story.append(Paragraph(f"<b>Montant de la caution :</b> {montant_chiffres} ({montant_lettres})", body))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "Nous vous prions de bien vouloir établir ladite caution conformément aux "
        "conditions et exigences prévues dans le dossier d'appel d'offres / cahier des "
        "charges concerné.",
        body,
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        f"La présente demande est effectuée sur la base de notre compte bancaire "
        f"n° <b>{num_compte}</b>, ouvert auprès de votre établissement.",
        body,
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "À cet effet, nous nous engageons à respecter l'ensemble des conditions "
        "applicables à cette opération et à vous fournir toute pièce "
        "ou information complémentaire nécessaire à l'établissement de ladite caution.",
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
                           numero_compte_bancaire, client_societe_nom,
                           company_name, company_nif, company_nis,
                           company_rc, company_ai, company_address, company_phone, company_email, company_activity, company_rib,
                           lieu_soumission=None,
                           montant_contrat=None):
    styles = getSampleStyleSheet()
    lieu_d = lieu_demande or lieu_soumission or "..."
    date_str = date_emission.strftime("%d/%m/%Y") if hasattr(date_emission, "strftime") else str(date_emission)
    montant_chiffres = f"{amount:,.2f} {devise}".replace(",", " ")
    montant_lettres = _amount_in_letters(amount, devise)
    ref_display = ref_contrat or caution_number or "..."
    num_compte = numero_compte_bancaire or "........"

    mc_chiffres = f"{montant_contrat:,.2f} {devise}".replace(",", " ") if montant_contrat else montant_chiffres
    mc_lettres = _amount_in_letters(montant_contrat, devise) if montant_contrat else montant_lettres

    ent = company_name or "E-TRANSPORT VOYAGES & LOGISTIQUE EURL"
    nif = company_nif or "001916001234567"
    nis = company_nis or "..."
    rc = company_rc or "16/00-1234567B19"
    ai = company_ai or "..."
    addr = company_address or "Zone Industrielle Oued Smar, Alger"
    phone = company_phone or "+213 (0) 23 85 40 00"
    email = company_email or "contact@etransport.dz"
    act = company_activity or "Transport routier de marchandises"
    rib = company_rib or "002 00612 0123456789 45"

    body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=11, leading=16,
                          alignment=0, fontName="Helvetica")
    body_r = ParagraphStyle("BodyR", parent=body, alignment=2)
    body_c = ParagraphStyle("BodyC", parent=body, alignment=1, fontName="Helvetica-Bold", fontSize=13)
    header_bold = ParagraphStyle('HeaderBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=14)
    header_norm = ParagraphStyle('HeaderNorm', parent=styles['Normal'], fontName='Helvetica', fontSize=10)
    reg_style = ParagraphStyle('RegStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=8, alignment=2)

    story = []

    # ── Header: Company name + fiscal IDs ──
    comp_info = [
        Paragraph(f"<b>{ent}</b>", header_bold),
        Paragraph(f"<b>{addr}</b>", header_bold),
        Paragraph(f"RC: {rc} | NIF: {nif} | AI: {ai} | NIS: {nis}", header_norm),
        Paragraph(f"Tél: {phone}" if phone else "", header_norm),
        Paragraph(f"Email: {email}" if email else "", header_norm),
        Paragraph(f"Activité: {act}", header_norm),
    ]
    
    reg_info = [
        Paragraph(f"RIB: {rib}", reg_style),
    ]

    header_table = Table([[comp_info, reg_info]], colWidths=[10*cm, 6*cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 1*cm))

    # ── Addressee + Date (right-aligned) ──
    story.append(Paragraph("À l'attention de", body_r))
    story.append(Paragraph("<b>Monsieur le Directeur</b>", body_r))
    story.append(Paragraph(f"De la Banque : {banque_name}", body_r))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"{lieu_d}, le {date_str}", body_r))
    story.append(Spacer(1, 16))

    # ── Objet ──
    story.append(Paragraph("<b>Objet : Demande d'émission d'une caution de bonne exécution</b>", body))
    story.append(Spacer(1, 12))

    # ── Body ──
    story.append(Paragraph("Monsieur le Directeur,", body))
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "Nous avons l'honneur de vous demander de bien vouloir procéder à l'émission, "
        "pour notre compte et au profit du bénéficiaire ci-après désigné, d'une "
        "<b>caution de bonne exécution</b>, destinée à garantir la bonne exécution de "
        "nos obligations contractuelles dans le cadre du marché suivant :",
        body,
    ))
    story.append(Spacer(1, 12))

    story.append(Paragraph(f"<b>Bénéficiaire :</b> {client_societe_nom or client_name}", body))
    story.append(Paragraph(f"<b>Référence du contrat :</b> {ref_display}", body))
    story.append(Paragraph(f"<b>Objet du contrat :</b> {objet}", body))
    story.append(Paragraph(f"<b>Montant du contrat :</b> {mc_chiffres} ({mc_lettres})", body))
    story.append(Paragraph(f"<b>Montant de la caution :</b> {montant_chiffres} ({montant_lettres})", body))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "Nous vous prions de bien vouloir établir ladite caution conformément aux "
        "clauses et exigences prévues dans le contrat concerné ainsi qu'aux conditions "
        "applicables à ce type de garantie bancaire.",
        body,
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        f"La présente demande est effectuée sur la base de notre compte bancaire "
        f"n° <b>{num_compte}</b>, ouvert auprès de votre établissement.",
        body,
    ))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "À cet effet, nous nous engageons à respecter l'ensemble des conditions "
        "applicables à cette opération et à vous fournir toute pièce "
        "ou information complémentaire nécessaire à l'établissement de ladite caution.",
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

def generate_bon_achat_pdf(
    reception_numero: str,
    date_reception,
    fournisseur_nom: str,
    fournisseur_tel: str,
    lignes: list,
    montant_total: float,
    mode_reglement: str,
    company_name: str = "GarageDZ",
    company_address: str = "25 ARZEW, ORAN",
    company_phone: str = "",
    company_email: str = "",
    company_activity: str = "Transport marchandise",
    company_rc: str = "RC N° 00000000000",
    company_nif: str = "00000000000000",
    company_nis: str = "00000000000000",
    company_ai: str = "00000000000",
    company_rib: str = "000 00000 0000000000 00",
) -> str:
    output_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "public", "assets", "documents", "achats")
    )
    os.makedirs(output_dir, exist_ok=True)

    sanitized = reception_numero.replace("/", "_").replace("\\\\", "_")
    filename = f"bon_achat_{sanitized}.pdf"
    filepath = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )
    styles = getSampleStyleSheet()
    
    # Custom styles
    header_bold = ParagraphStyle('HeaderBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=14)
    header_norm = ParagraphStyle('HeaderNorm', parent=styles['Normal'], fontName='Helvetica', fontSize=10)
    reg_style = ParagraphStyle('RegStyle', parent=styles['Normal'], fontName='Helvetica', fontSize=8, alignment=2)
    title_style = ParagraphStyle('TitleStyle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=18, spaceAfter=0)
    sub_title = ParagraphStyle('SubTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=12, alignment=1)
    
    elements = []

    # 1. Header (Company & Legal)
    comp_info = [
        Paragraph(f"<b>{company_name}</b>", header_bold),
        Paragraph(f"<b>{company_address}</b>", header_bold),
        Paragraph(f"RC: {company_rc} | NIF: {company_nif} | AI: {company_ai} | NIS: {company_nis}", header_norm),
        Paragraph(f"Tél: {company_phone}" if company_phone else "", header_norm),
        Paragraph(f"Email: {company_email}" if company_email else "", header_norm),
        Paragraph(f"Activité: {company_activity}", header_norm),
    ]
    
    reg_info = [
        Paragraph(f"RIB: {company_rib}", reg_style),
    ]

    header_table = Table([[comp_info, reg_info]], colWidths=[10*cm, 8*cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 1*cm))

    # 2. Document Title Block
    title_table = Table([
        [Paragraph("BON D'ACHAT", title_style)],
        [Paragraph(f"N° {reception_numero}", sub_title)]
    ], colWidths=[18*cm])
    
    title_table.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,0), 1, colors.lightgrey),
        ('LINEBELOW', (0,-1), (-1,-1), 1, colors.lightgrey),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,-1), (-1,-1), 10),
    ]))
    elements.append(title_table)
    elements.append(Spacer(1, 1*cm))

    # 3. Metadata & Supplier Information
    date_str = date_reception.strftime('%d/%m/%Y') if hasattr(date_reception, 'strftime') else str(date_reception)
    supplier_info = [
        Paragraph(f"<b>Date:</b> {date_str}", header_norm),
        Spacer(1, 10),
        Paragraph("<b>FOURNISSEUR</b>", ParagraphStyle('FTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11)),
        Paragraph(f"{fournisseur_nom}", header_norm),
        Paragraph(f"<b>Tél:</b> {fournisseur_tel}", header_norm),
    ]
    elements.append(Table([[supplier_info]], colWidths=[18*cm], style=TableStyle([('LEFTPADDING', (0,0), (-1,-1), 0)])))
    elements.append(Spacer(1, 1*cm))

    # 4. The Data Table (Purchased Items)
    table_data = [
        [
            Paragraph("<b>Réf.</b>", styles['Normal']), 
            Paragraph("<b>Désignation</b>", styles['Normal']), 
            Paragraph("<b>Qté</b>", ParagraphStyle('C', parent=styles['Normal'], alignment=1)), 
            Paragraph("<b>P.U.</b>", ParagraphStyle('R', parent=styles['Normal'], alignment=2)), 
            Paragraph("<b>Total</b>", ParagraphStyle('R', parent=styles['Normal'], alignment=2))
        ]
    ]
    
    for ligne in lignes:
        table_data.append([
            Paragraph(ligne['reference'], styles['Normal']),
            Paragraph(ligne['designation'], styles['Normal']),
            Paragraph(str(ligne['quantite']), ParagraphStyle('C', parent=styles['Normal'], alignment=1)),
            Paragraph(f"{ligne['prix_unitaire']:,.2f} DA".replace(',', ' '), ParagraphStyle('R', parent=styles['Normal'], alignment=2)),
            Paragraph(f"{ligne['montant_ligne']:,.2f} DA".replace(',', ' '), ParagraphStyle('R', parent=styles['Normal'], alignment=2)),
        ])

    items_table = Table(table_data, colWidths=[3.5*cm, 7.5*cm, 1.5*cm, 2.5*cm, 3*cm])
    items_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.lightgrey),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 1*cm))

    # 5. Financial Summary
    versement = 0.0
    reste = montant_total
    
    # "CREDIT" means not paid immediately
    if mode_reglement != "CREDIT":
        versement = montant_total
        reste = 0.0

    mode_labels = {
        "ESPECES": "Espèces",
        "CHEQUE": "Chèque",
        "VIREMENT": "Virement",
        "CCP": "CCP"
    }
    mode_str = mode_labels.get(mode_reglement, mode_reglement)

    totals_data = [
        [Paragraph("<b>Total achat</b>", styles['Normal']), Paragraph(f"<b>{montant_total:,.2f} DA</b>".replace(',', ' '), ParagraphStyle('R', parent=styles['Normal'], alignment=2))],
    ]
    
    if versement > 0:
        totals_data.append([
            Paragraph(f"<font color='#2e8b57'><b>Versement effectué ({mode_str})</b></font>", styles['Normal']), 
            Paragraph(f"<font color='#2e8b57'><b>-{versement:,.2f} DA</b></font>".replace(',', ' '), ParagraphStyle('R', parent=styles['Normal'], alignment=2))
        ])
    
    totals_data.append([
        Paragraph("<font color='#2e8b57'><b>Reste à payer</b></font>" if reste == 0 else "<b>Reste à payer</b>", styles['Normal']), 
        Paragraph(f"<font color='#2e8b57'><b>{reste:,.2f} DA</b></font>".replace(',', ' ') if reste == 0 else f"<b>{reste:,.2f} DA</b>".replace(',', ' '), ParagraphStyle('R', parent=styles['Normal'], alignment=2))
    ])

    totals_table = Table(totals_data, colWidths=[15*cm, 3*cm])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 1*cm))

    amount_words = _amount_in_letters(montant_total)
    elements.append(Paragraph(f"<i>Arrêté à la somme de: {amount_words}</i>", styles['Normal']))
    elements.append(Spacer(1, 2*cm))

    # 6. The Footer (Signatures)
    footer_data = [
        [Paragraph("<b>Cachet et signature</b>", styles['Normal']), Paragraph("<b>FOURNISSEUR</b>", ParagraphStyle('R', parent=styles['Normal'], alignment=2))],
        [Spacer(1, 2*cm), Spacer(1, 2*cm)],
    ]
    footer_table = Table(footer_data, colWidths=[9*cm, 9*cm])
    footer_table.setStyle(TableStyle([
        ('LINEBELOW', (0,1), (0,1), 1, colors.lightgrey),
        ('LINEBELOW', (1,1), (1,1), 1, colors.lightgrey),
    ]))
    
    elements.append(KeepTogether(footer_table))

    doc.build(elements)

    return f"/assets/documents/achats/{filename}"
