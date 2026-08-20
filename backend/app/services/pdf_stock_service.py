import os
import base64
from io import BytesIO
from num2words import num2words
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image,
)


def _amount_in_letters(amount: float, devise: str = "Dinars Algeriens") -> str:
    integer_part = int(amount)
    decimal_part = round((amount - integer_part) * 100)
    text = num2words(integer_part, lang="fr").capitalize()
    text += f" {devise}"
    if decimal_part:
        text += f" et {decimal_part:02d} centimes"
    return text


def generate_reception_pdf(reception, lignes, settings) -> str:
    output_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "public", "assets", "documents", "receptions")
    )
    os.makedirs(output_dir, exist_ok=True)

    sanitized = reception.numero.replace("/", "_").replace("\\", "_")
    filename = f"reception_{sanitized}.pdf"
    filepath = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(filepath, pagesize=A4,
                            rightMargin=2 * cm, leftMargin=2 * cm,
                            topMargin=1.5 * cm, bottomMargin=1.5 * cm)

    styles = getSampleStyleSheet()

    header_style = ParagraphStyle("Header", parent=styles["Normal"], fontSize=9, leading=12, fontName="Helvetica")
    header_bold = ParagraphStyle("HeaderBold", parent=header_style, fontName="Helvetica-Bold", fontSize=10)
    header_right = ParagraphStyle("HeaderRight", parent=header_style, alignment=TA_RIGHT, fontSize=9)
    header_right_bold = ParagraphStyle("HeaderRightBold", parent=header_right, fontName="Helvetica-Bold", fontSize=10)
    title_style = ParagraphStyle("Title", parent=styles["Normal"], fontSize=16, leading=20, alignment=TA_CENTER, fontName="Helvetica-Bold", spaceAfter=2)
    subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"], fontSize=11, leading=14, alignment=TA_CENTER, fontName="Helvetica-Bold")
    body_style = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, leading=14, fontName="Helvetica")
    body_bold = ParagraphStyle("BodyBold", parent=body_style, fontName="Helvetica-Bold")
    body_right = ParagraphStyle("BodyRight", parent=body_style, alignment=TA_RIGHT)
    body_right_bold = ParagraphStyle("BodyRightBold", parent=body_right, fontName="Helvetica-Bold")
    body_italic = ParagraphStyle("BodyItalic", parent=body_style, fontName="Helvetica-Oblique", fontSize=9, leading=13)
    small = ParagraphStyle("Small", parent=body_style, fontSize=8, leading=10)
    small_right = ParagraphStyle("SmallRight", parent=small, alignment=TA_RIGHT)

    story = []

    # ── HEADER ──
    company_name = settings.company_name if settings else "E-TRANSPORT"
    company_addr = settings.company_address if settings else ""
    company_rc = settings.company_rc if settings else ""
    company_nif = settings.company_nif if settings else ""
    company_nis = settings.company_nis if settings else ""
    company_ai = settings.company_ai if settings else ""
    company_phone = settings.company_phone if settings else ""

    left_lines = [
        Paragraph(f"<b>{company_name}</b>", header_bold),
        Paragraph(company_addr, header_style),
        Paragraph(f"Tel : {company_phone}", header_style),
    ]
    right_lines = [
        Paragraph(f"RC : {company_rc}", header_right),
        Paragraph(f"NIF : {company_nif}", header_right),
        Paragraph(f"NIS : {company_nis}", header_right),
        Paragraph(f"AI : {company_ai}", header_right),
    ]

    header_data = [[left_lines, right_lines]]
    header_table = Table(header_data, colWidths=[doc.width * 0.6, doc.width * 0.4])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#333333")))
    story.append(Spacer(1, 10))

    # ── TITLE BLOCK ──
    story.append(Paragraph("BON DE RECEPTION", title_style))
    story.append(Paragraph(f"N\u00b0 {reception.numero}", subtitle_style))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#333333")))
    story.append(Spacer(1, 12))

    # ── METADATA ──
    date_str = reception.date.strftime("%d/%m/%Y") if hasattr(reception.date, "strftime") else str(reception.date)
    story.append(Paragraph(f"<b>Date :</b> {date_str}", body_style))

    if reception.fournisseur:
        story.append(Spacer(1, 4))
        story.append(Paragraph("<b>FOURNISSEUR</b>", body_bold))
        story.append(Paragraph(f"{reception.fournisseur.nom_commercial}", body_style))
        if reception.fournisseur.telephone_principal:
            story.append(Paragraph(f"<b>Tel :</b> {reception.fournisseur.telephone_principal}", body_style))

    if reception.lieu:
        story.append(Paragraph(f"<b>Lieu :</b> {reception.lieu}", body_style))

    story.append(Spacer(1, 16))

    # ── ITEMS TABLE ──
    col_widths = [doc.width * 0.15, doc.width * 0.35, doc.width * 0.1, doc.width * 0.2, doc.width * 0.2]

    table_header = [
        Paragraph("<b>Réf.</b>", body_bold),
        Paragraph("<b>Désignation</b>", body_bold),
        Paragraph("<b>Qté</b>", ParagraphStyle("Qte", parent=body_bold, alignment=TA_CENTER)),
        Paragraph("<b>P.U.</b>", body_right_bold),
        Paragraph("<b>Total</b>", body_right_bold),
    ]

    table_data = [table_header]
    for ligne in lignes:
        ref = ligne.piece_reference or "—"
        designation = ligne.piece_designation or "—"
        table_data.append([
            Paragraph(ref, ParagraphStyle("RefCell", parent=body_style, fontSize=9, fontName="Helvetica-Bold")),
            Paragraph(designation, ParagraphStyle("DescCell", parent=body_style, fontSize=9)),
            Paragraph(str(ligne.quantite), ParagraphStyle("QteCell", parent=body_style, fontSize=9, alignment=TA_CENTER)),
            Paragraph(f"{ligne.prix_unitaire:,.2f} DA".replace(",", " "), ParagraphStyle("PUCell", parent=body_style, fontSize=9, alignment=TA_RIGHT)),
            Paragraph(f"{ligne.montant_ligne:,.2f} DA".replace(",", " "), ParagraphStyle("TotalCell", parent=body_style, fontSize=9, alignment=TA_RIGHT, fontName="Helvetica-Bold")),
        ])

    items_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2563EB")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F3F4F6")]),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, 0), 1, colors.HexColor("#2563EB")),
        ("LINEBELOW", (0, -1), (-1, -1), 1, colors.HexColor("#D1D5DB")),
        ("LINEBEFORE", (0, 0), (0, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("LINEAFTER", (-1, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 16))

    # ── FINANCIAL SUMMARY ──
    montant_total = reception.montant_total
    total_label = ParagraphStyle("TotalLabel", parent=body_bold, fontSize=10)
    total_value = ParagraphStyle("TotalValue", parent=body_right_bold, fontSize=11)

    summary_data = [
        [
            Paragraph("<b>Total achat</b>", total_label),
            Paragraph(f"<b>{montant_total:,.2f} DA</b>".replace(",", " "), total_value),
        ],
    ]
    summary_table = Table(summary_data, colWidths=[doc.width * 0.6, doc.width * 0.4])
    summary_table.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.HexColor("#D1D5DB")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(summary_table)

    # Payment line (green if paid)
    mode_label = reception.mode_reglement.value if reception.mode_reglement else "N/C"
    payment_style = ParagraphStyle("Payment", parent=body_style, fontSize=9, textColor=colors.HexColor("#16A34A"))
    payment_right = ParagraphStyle("PaymentRight", parent=body_right, fontSize=9, textColor=colors.HexColor("#16A34A"))

    payment_data = [
        [
            Paragraph(f"Versement effectué ({mode_label})", payment_style),
            Paragraph(f"-{montant_total:,.2f} DA".replace(",", " "), payment_right),
        ],
    ]
    payment_table = Table(payment_data, colWidths=[doc.width * 0.6, doc.width * 0.4])
    payment_table.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(payment_table)

    balance_data = [
        [
            Paragraph("<b>Reste à payer</b>", ParagraphStyle("Balance", parent=body_bold, fontSize=10, textColor=colors.HexColor("#16A34A"))),
            Paragraph(f"<b>0,00 DA</b>", ParagraphStyle("BalanceVal", parent=body_right_bold, fontSize=10, textColor=colors.HexColor("#16A34A"))),
        ],
    ]
    balance_table = Table(balance_data, colWidths=[doc.width * 0.6, doc.width * 0.4])
    balance_table.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.HexColor("#16A34A")),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(balance_table)
    story.append(Spacer(1, 10))

    # ── WRITTEN SUM ──
    montant_lettres = _amount_in_letters(montant_total)
    story.append(Paragraph(f"<i>Arrêté à la somme de : {montant_lettres}</i>", body_italic))
    story.append(Spacer(1, 30))

    # ── SIGNATURES ──
    sig_data = [[
        Paragraph("<b>Cachet et signature</b>", ParagraphStyle("SigLeft", parent=body_bold, alignment=TA_CENTER, fontSize=9)),
        Paragraph("<b>FOURNISSEUR</b>", ParagraphStyle("SigRight", parent=body_bold, alignment=TA_CENTER, fontSize=9)),
    ]]
    sig_table = Table(sig_data, colWidths=[doc.width * 0.5, doc.width * 0.5])
    sig_table.setStyle(TableStyle([
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 40),
        ("LINEBELOW", (0, 0), (0, 0), 1, colors.HexColor("#9CA3AF")),
        ("LINEBELOW", (1, 0), (1, 0), 1, colors.HexColor("#9CA3AF")),
    ]))
    story.append(sig_table)

    doc.build(story)
    return f"/api/v1/stock/receptions/{reception.id}/pdf"
