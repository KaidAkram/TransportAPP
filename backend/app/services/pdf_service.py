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
  Generates a clean official bank guarantee letter PDF.
  Same function signature — returns relative asset path.
  """
  output_dir = os.path.abspath("frontend/public/assets/documents/cautions")
  os.makedirs(output_dir, exist_ok=True)

  sanitized_num = caution_number.replace("/", "_").replace("\\", "_")
  filename = f"caution_{sanitized_num}.pdf"
  filepath = os.path.join(output_dir, filename)

  doc = SimpleDocTemplate(
    filepath,
    pagesize=A4,
    rightMargin=2.5 * cm,
    leftMargin=2.5 * cm,
    topMargin=2.5 * cm,
    bottomMargin=2.5 * cm,
  )

  styles = getSampleStyleSheet()

  # ── Styles ──────────────────────────────────────────────────
  header_style = ParagraphStyle(
    "Header",
    parent=styles["Normal"],
    fontSize=10,
    leading=14,
    alignment=0,
    textColor=colors.HexColor("#111827"),
    fontName="Helvetica",
  )
  header_right_style = ParagraphStyle(
    "HeaderRight",
    parent=header_style,
    alignment=2,
  )
  title_style = ParagraphStyle(
    "Title",
    parent=styles["Heading1"],
    fontSize=15,
    leading=20,
    alignment=1,
    textColor=colors.HexColor("#111827"),
    fontName="Helvetica-Bold",
    spaceAfter=4,
  )
  subtitle_style = ParagraphStyle(
    "Subtitle",
    parent=styles["Normal"],
    fontSize=9,
    leading=13,
    alignment=1,
    textColor=colors.HexColor("#6B7280"),
    fontName="Helvetica",
    spaceAfter=14,
  )
  body_style = ParagraphStyle(
    "Body",
    parent=styles["Normal"],
    fontSize=10.5,
    leading=16,
    textColor=colors.HexColor("#1F2937"),
    fontName="Helvetica",
    spaceAfter=6,
  )
  bold_style = ParagraphStyle(
    "Bold",
    parent=body_style,
    fontName="Helvetica-Bold",
  )
  field_label_style = ParagraphStyle(
    "FieldLabel",
    parent=styles["Normal"],
    fontSize=9,
    leading=12,
    fontName="Helvetica-Bold",
    textColor=colors.HexColor("#374151"),
  )
  field_value_style = ParagraphStyle(
    "FieldValue",
    parent=styles["Normal"],
    fontSize=10.5,
    leading=14,
    fontName="Helvetica",
    textColor=colors.HexColor("#111827"),
  )
  footer_style = ParagraphStyle(
    "Footer",
    parent=styles["Normal"],
    fontSize=8,
    leading=11,
    alignment=1,
    textColor=colors.HexColor("#9CA3AF"),
    fontName="Helvetica",
    spaceBefore=20,
  )

  story = []

  # ── 1. Header ───────────────────────────────────────────────
  header_data = [[
    Paragraph(f"<b>{banque_name}</b><br/><font size=8 color='#6B7280'>Direction des Engagements &amp; Cautions</font>", header_style),
    Paragraph(f"<b>ACTE N° {caution_number}</b><br/><font size=8 color='#6B7280'>Date : {date_emission.strftime('%d/%m/%Y')}</font>", header_right_style),
  ]]
  header_table = Table(header_data, colWidths=[9.5 * cm, 7.5 * cm])
  header_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
  ]))
  story.append(header_table)
  story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1E40AF"), spaceAfter=16))

  # ── 2. Title ────────────────────────────────────────────────
  caution_type_upper = str(caution_type).upper()
  if "BONNE" in caution_type_upper or "EXECUTION" in caution_type_upper:
    type_label = "DEMANDE DE CAUTION DE BONNE EXÉCUTION"
  elif "DEMANDE" in caution_type_upper:
    type_label = "DEMANDE DE CAUTION BANCAIRE"
  else:
    type_label = "DEMANDE DE CAUTION DE SOUMISSION"

  story.append(Paragraph(type_label, title_style))
  story.append(Paragraph("Engagement Bancaire &amp; Garantie Financière à Première Demande", subtitle_style))

  # ── 3. Opening paragraph ────────────────────────────────────
  story.append(Paragraph(
    f"Nous soussignés, <b>{banque_name}</b>, agissant pour le compte et à la demande de l'"
    "<b>Entreprise de Transport de Voyageurs</b>, déclarons par la présente nous constituer "
    "caution solidaire et indivisible au profit du bénéficiaire désigné ci-dessous.",
    body_style,
  ))
  story.append(Spacer(1, 10))

  # ── 4. Seven-field info card ────────────────────────────────
  ref_display = ref_contrat or "—"
  amount_str = f"{amount:,.2f} {devise}".replace(",", " ")
  type_display = (
    "Bonne Exécution" if "BONNE" in caution_type_upper or "EXECUTION" in caution_type_upper
    else "Soumission"
  )
  client_display = client_name or "Bénéficiaire"

  card_data = [
    [Paragraph("<b>Banque Émettrice :</b>", field_label_style), Paragraph(banque_name, field_value_style)],
    [Paragraph("<b>N° Caution :</b>", field_label_style), Paragraph(caution_number, field_value_style)],
    [Paragraph("<b>Type :</b>", field_label_style), Paragraph(type_display, field_value_style)],
    [Paragraph("<b>Montant Garanti :</b>", field_label_style), Paragraph(f"<b>{amount_str}</b>", field_value_style)],
    [Paragraph("<b>Bénéficiaire :</b>", field_label_style), Paragraph(client_display, field_value_style)],
    [Paragraph("<b>Date d'Émission :</b>", field_label_style), Paragraph(date_emission.strftime("%d/%m/%Y"), field_value_style)],
    [Paragraph("<b>Référence AO / Contrat :</b>", field_label_style), Paragraph(ref_display, field_value_style)],
  ]
  card_table = Table(card_data, colWidths=[5 * cm, 12 * cm])
  card_table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F9FAFB")),
    ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#D1D5DB")),
    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
    ("TOPPADDING", (0, 0), (-1, -1), 7),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
  ]))
  story.append(card_table)
  story.append(Spacer(1, 14))

  # ── 5. Legal commitment text ────────────────────────────────
  story.append(Paragraph(
    f"À concurrence d'un montant maximum garanti de : <b><font color='#1E40AF' size=11>{amount_str}</font></b>.",
    body_style,
  ))
  story.append(Spacer(1, 4))
  story.append(Paragraph(
    "En vertu de cet engagement, nous nous obligeons irrévocablement à payer au bénéficiaire, "
    "à sa première demande écrite, toutes sommes qu'il viendrait à réclamer jusqu'à concurrence "
    "du montant susvisé, sans qu'il soit besoin d'une mise en demeure préalable ou d'une action "
    "judiciaire, nonobstant toute contestation de la part du titulaire.",
    body_style,
  ))
  story.append(Spacer(1, 4))

  echeance_display = (
    date_echeance.strftime("%d/%m/%Y") if date_echeance
    else "la mainlevée définitive notifiée par le client"
  )
  story.append(Paragraph(
    f"La présente caution prend effet à compter du <b>{date_emission.strftime('%d/%m/%Y')}</b> "
    f"et demeurera en vigueur jusqu'au <b>{echeance_display}</b>, date après laquelle notre "
    "engagement deviendra caduc de plein droit, que le présent acte nous soit retourné ou non.",
    body_style,
  ))
  story.append(Spacer(1, 24))

  # ── 6. Objet (if provided) ──────────────────────────────────
  if objet:
    story.append(Paragraph(f"<b>Objet :</b> {objet}", body_style))
    story.append(Spacer(1, 16))

  # ── 7. Signature block ─────────────────────────────────────
  sig_data = [[
    Paragraph("<b>Pour le Titulaire</b><br/><font size=8 color='#6B7280'>Cachet &amp; Signature Direction</font>", body_style),
    Paragraph(f"<b>Pour {banque_name}</b><br/><font size=8 color='#6B7280'>Signature &amp; Cachet Émetteur</font>", header_right_style),
  ]]
  sig_table = Table(sig_data, colWidths=[8.5 * cm, 8.5 * cm])
  sig_table.setStyle(TableStyle([
    ("TOPPADDING", (0, 0), (-1, -1), 10),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 40),
  ]))
  story.append(sig_table)

  # ── 8. Footer ───────────────────────────────────────────────
  story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#D1D5DB"), spaceAfter=6))
  story.append(Paragraph(
    f"Acte N° {caution_number} — {banque_name} — {date_emission.strftime('%d/%m/%Y')}",
    footer_style,
  ))

  doc.build(story)
  return f"/assets/documents/cautions/{filename}"
