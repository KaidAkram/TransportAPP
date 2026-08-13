import os
from datetime import date
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable


def generate_caution_pdf(
    caution_number: str,
    caution_type: str,
    amount: float,
    devise: str,
    client_name: str,
    client_address: str,
    objet: str,
    date_emission: date,
    date_echeance: date = None,
    ref_contrat: str = None,
    banque_name: str = "Banque Nationale d'Algérie (BNA)",
) -> str:
    """
    Generates a formal, professional PDF bank guarantee letter (Acte de Caution Bancaire).
    Saves file to frontend public directory and returns relative asset path.
    """
    # Ensure target directory exists
    output_dir = os.path.abspath("frontend/public/assets/documents/cautions")
    os.makedirs(output_dir, exist_ok=True)

    sanitized_num = caution_number.replace("/", "_").replace("\\", "_")
    filename = f"caution_{sanitized_num}.pdf"
    filepath = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CautionTitle",
        parent=styles["Heading1"],
        fontSize=16,
        leading=20,
        alignment=1,  # Center
        textColor=colors.HexColor("#1E40AF"),
        fontName="Helvetica-Bold",
    )
    subtitle_style = ParagraphStyle(
        "CautionSubTitle",
        parent=styles["Normal"],
        fontSize=11,
        leading=15,
        alignment=1,
        textColor=colors.HexColor("#4B5563"),
        fontName="Helvetica",
    )
    body_style = ParagraphStyle(
        "CautionBody",
        parent=styles["Normal"],
        fontSize=10,
        leading=15,
        textColor=colors.HexColor("#1F2937"),
        fontName="Helvetica",
    )
    bold_body_style = ParagraphStyle(
        "CautionBoldBody",
        parent=body_style,
        fontName="Helvetica-Bold",
    )

    story = []

    # 1. Header Table (Bank Info & Caution Ref)
    header_data = [
        [
            Paragraph(f"<b>{banque_name}</b><br/><font size=8 color='#6B7280'>Direction des Engagements & Cautions</font>", body_style),
            Paragraph(f"<b>ACTE N° : {caution_number}</b><br/><font size=8 color='#6B7280'>Date : {date_emission.strftime('%d/%m/%Y')}</font>", ParagraphStyle("RightHeader", parent=body_style, alignment=2)),
        ]
    ]
    header_table = Table(header_data, colWidths=[9 * cm, 8 * cm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1E40AF"), spaceAfter=15))

    # 2. Document Title
    caution_type_label = (
        "CAUTION DE BONNE EXÉCUTION"
        if "BONNE_EXECUTION" in str(caution_type).upper() or "BONNE EXÉCUTION" in str(caution_type).upper()
        else "CAUTION DE SOUMISSION"
    )
    story.append(Paragraph(f"ATTESTATION DE {caution_type_label}", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Engagement Bancaire & Garantie Financière à Première Demande", subtitle_style))
    story.append(Spacer(1, 15))

    # 3. Main Legal Body
    p1 = f"""
    Nous soussignés, <b>{banque_name}</b>, agissant pour le compte et à la demande de l'<b>Entreprise de Transport de Voyageurs</b>,
    déclarons par la présente nous constituer caution solidaire et indivisible au profit de :
    """
    story.append(Paragraph(p1, body_style))
    story.append(Spacer(1, 8))

    # Beneficiary Card
    beneficiary_data = [
        [Paragraph("<b>BÉNÉFICIAIRE :</b>", bold_body_style), Paragraph(f"<b>{client_name}</b>", bold_body_style)],
        [Paragraph("<b>ADRESSE :</b>", bold_body_style), Paragraph(client_address or "Non renseignée", body_style)],
        [Paragraph("<b>OBJET :</b>", bold_body_style), Paragraph(objet, body_style)],
        [Paragraph("<b>RÉFÉRENCE CONTRAT :</b>", bold_body_style), Paragraph(ref_contrat or "Convention Commerciale", body_style)],
    ]
    beneficiary_table = Table(beneficiary_data, colWidths=[4.5 * cm, 12.5 * cm])
    beneficiary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F3F4F6")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(beneficiary_table)
    story.append(Spacer(1, 12))

    # Amount Guarantee Section
    amount_str = f"{amount:,.2f} {devise}".replace(",", " ")
    p2 = f"""
    À concurrence d'un montant maximum garanti de : <b><font color='#1E40AF' size=11>{amount_str}</font></b>.
    """
    story.append(Paragraph(p2, body_style))
    story.append(Spacer(1, 8))

    p3 = f"""
    En vertu de cet engagement, nous nous obligeons irrévocablement à payer au bénéficiaire, à sa première demande écrite,
    toutes sommes qu'il viendrait à réclamer jusqu'à concurrence du montant susvisé, sans qu'il soit besoin d'une mise en demeure préalable
    ou d'une action judiciaire, nonobstant toute contestation de la part du titulaire.
    """
    story.append(Paragraph(p3, body_style))
    story.append(Spacer(1, 8))

    # Expiration clause
    echeance_str = date_echeance.strftime('%d/%m/%Y') if date_echeance else "la mainlevée définitive notifiée par le client"
    p4 = f"""
    La présente caution prend effet à compter du <b>{date_emission.strftime('%d/%m/%Y')}</b> et demeurera en vigueur jusqu'au <b>{echeance_str}</b>,
    date après laquelle notre engagement deviendra caduc de plein droit, que le présent acte nous soit retourné ou non.
    """
    story.append(Paragraph(p4, body_style))
    story.append(Spacer(1, 20))

    # Signature Table
    sig_data = [
        [
            Paragraph("<b>Pour le Titulaire</b><br/><font size=8>Cachet & Signature Direction</font>", body_style),
            Paragraph(f"<b>Pour {banque_name}</b><br/><font size=8>Signature & Cachet Émetteur</font>", ParagraphStyle("RightSig", parent=body_style, alignment=2)),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[8.5 * cm, 8.5 * cm])
    sig_table.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 40),
    ]))
    story.append(sig_table)

    doc.build(story)
    return f"/assets/documents/cautions/{filename}"
