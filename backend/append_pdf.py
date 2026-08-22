
code_to_append = """
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

    sanitized = reception_numero.replace("/", "_").replace("\\", "_")
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
        Paragraph(f"Tél: {company_phone}" if company_phone else "", header_norm),
        Paragraph(f"Email: {company_email}" if company_email else "", header_norm),
        Paragraph(f"Activité: {company_activity}", header_norm),
    ]
    
    reg_info = [
        Paragraph(f"RC: {company_rc}", reg_style),
        Paragraph(f"NIF: {company_nif}", reg_style),
        Paragraph(f"NIS: {company_nis}", reg_style),
        Paragraph(f"AI: {company_ai}", reg_style),
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
    green_color = colors.Color(0.2, 0.6, 0.2)
    versement = 0.0
    reste = montant_total
    
    if mode_reglement != "A_Terme":
        versement = montant_total
        reste = 0.0

    totals_data = [
        [Paragraph("<b>Total achat</b>", styles['Normal']), Paragraph(f"<b>{montant_total:,.2f} DA</b>".replace(',', ' '), ParagraphStyle('R', parent=styles['Normal'], alignment=2))],
    ]
    
    if versement > 0:
        totals_data.append([
            Paragraph("<font color='#339933'><b>Versement effectué</b></font>", styles['Normal']), 
            Paragraph(f"<font color='#339933'><b>-{versement:,.2f} DA</b></font>".replace(',', ' '), ParagraphStyle('R', parent=styles['Normal'], alignment=2))
        ])
    
    totals_data.append([
        Paragraph("<font color='#339933'><b>Reste à payer</b></font>" if reste == 0 else "<b>Reste à payer</b>", styles['Normal']), 
        Paragraph(f"<font color='#339933'><b>{reste:,.2f} DA</b></font>".replace(',', ' ') if reste == 0 else f"<b>{reste:,.2f} DA</b>".replace(',', ' '), ParagraphStyle('R', parent=styles['Normal'], alignment=2))
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
"""

with open(r"c:\Users\Akram KAID\Desktop\Entreprise_transport\backend\app\services\pdf_service.py", "a", encoding="utf-8") as f:
    f.write(code_to_append)
