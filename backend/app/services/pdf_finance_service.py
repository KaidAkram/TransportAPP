import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
  SimpleDocTemplate,
  Paragraph,
  Spacer,
  Table,
  TableStyle,
  HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT


def generate_devis_pdf(devis, client, output_dir: str = None) ->str:
  if output_dir is None:
    output_dir = os.path.abspath(
      os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "public", "assets", "documents", "devis")
    )
  os.makedirs(output_dir, exist_ok=True)

  filename = f"devis_{devis.numero}.pdf"
  file_path = os.path.join(output_dir, filename)

  doc = SimpleDocTemplate(
    file_path,
    pagesize=A4,
    rightMargin=36,
    leftMargin=36,
    topMargin=36,
    bottomMargin=36,
  )

  styles = getSampleStyleSheet()
  header_style = ParagraphStyle(
    "HeaderMeta",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=9,
    leading=12,
    textColor=colors.HexColor("#4B5563"),
  )
  bold_style = ParagraphStyle(
    "BoldMeta",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=9,
    leading=12,
    textColor=colors.HexColor("#111827"),
  )

  story = []

  # 1. Header Company / Document Title
  header_data = [
    [
      Paragraph("<b>E-TRANSPORT VOYAGES EURL</b><br/>Capital Social : 50 000 000 DZD<br/>NIF : 001916001234567 — RC : 16/00-1234567B19<br/>Zone Industrielle Oued Smar, Alger<br/>Tél : +213 (0) 23 85 40 00", header_style),
      Paragraph(f"<b>DEVIS COMMERCIAL</b><br/><font size=14 color='#1E40AF'><b>N° {devis.numero}</b></font><br/>Date : {devis.date_emission.strftime('%d/%m/%Y')}<br/>Validité : {devis.date_validite.strftime('%d/%m/%Y')}", ParagraphStyle("RightHeader", parent=header_style, alignment=TA_RIGHT)),
    ]
  ]
  t_header = Table(header_data, colWidths=[300, 220])
  t_header.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
  story.append(t_header)
  story.append(Spacer(1, 14))
  story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1E40AF"), spaceAfter=14))

  # 2. Client Box
  client_name = getattr(client, "nom_commercial", "Client") if client else "Client"
  client_nif = getattr(client, "nif", "—") if client else "—"
  client_nis = getattr(client, "nis", "—") if client else "—"
  client_addr = getattr(client, "adresse", "Alger, Algérie") if client else "Alger, Algérie"
  client_tel = getattr(client, "telephone_principal", "—") if client else "—"

  client_box_data = [
    [
      Paragraph("<b>DESTINATAIRE (CLIENT) :</b>", bold_style),
      Paragraph(f"<b>{client_name}</b><br/>"
           f"NIF : {client_nif} | NIS : {client_nis}<br/>"
           f"Adresse : {client_addr}<br/>"
           f"Tél : {client_tel}", header_style)
    ]
  ]
  t_client = Table(client_box_data, colWidths=[160, 360])
  t_client.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
    ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
    ("PADDING", (0, 0), (-1, -1), 8),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
  ]))
  story.append(t_client)
  story.append(Spacer(1, 14))

  # 3. Object
  story.append(Paragraph(f"<b>Objet de la prestation :</b>{devis.objet}", bold_style))
  story.append(Spacer(1, 10))

  # 4. Lines Table
  lines_header = ["Service", "Description des Prestations", "Qté", "P.U (DZD)", "Total HT (DZD)"]
  table_rows = [lines_header]

  for lig in devis.lignes:
    table_rows.append([
      lig.service,
      lig.description,
      f"{lig.quantite:g}",
      f"{lig.prix_unitaire:,.2f}",
      f"{lig.total_ligne:,.2f}",
    ])

  t_lines = Table(table_rows, colWidths=[100, 220, 40, 80, 80])
  t_lines.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E40AF")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, 0), 8.5),
    ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
    ("PADDING", (0, 0), (-1, -1), 5),
  ]))
  story.append(t_lines)
  story.append(Spacer(1, 12))

  # 5. Financial Summary Totals
  summary_data = [
    ["Total Hors Taxes (HT) :", f"{devis.total_ht:,.2f} DZD"],
    [f"TVA ({devis.taux_tva}%) :", f"{devis.montant_tva:,.2f} DZD"],
    ["TOTAL GÉNÉRAL TTC :", f"{devis.total_ttc:,.2f} DZD"],
  ]
  t_sum = Table(summary_data, colWidths=[140, 120])
  t_sum.setStyle(TableStyle([
    ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
    ("FONTNAME", (0, 0), (-1, -2), "Helvetica-Bold"),
    ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
    ("FONTSIZE", (0, -1), (-1, -1), 10),
    ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#DBEAFE")),
    ("TEXTCOLOR", (0, -1), (-1, -1), colors.HexColor("#1E40AF")),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ("PADDING", (0, 0), (-1, -1), 5),
  ]))

  wrapper_table = Table([["", t_sum]], colWidths=[260, 260])
  wrapper_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
  story.append(wrapper_table)
  story.append(Spacer(1, 16))

  # 6. Conditions & Legal Signatures
  conditions_text = devis.conditions_reglement or "Règlement à 30 jours par virement bancaire. Prix fermes et non révisables durant la durée de validité."
  story.append(Paragraph(f"<b>Conditions de règlement :</b>{conditions_text}", header_style))
  story.append(Spacer(1, 16))

  signatures_data = [
    [
      Paragraph("<b>Pour le Client (Bon pour accord) :</b><br/>Nom, Qualité & Cachet légalisé<br/><br/><br/><br/>____________________________", header_style),
      Paragraph("<b>Pour E-TRANSPORT VOYAGES :</b><br/>Direction Commerciale & Exploitation<br/><br/><br/><br/><i>[Signé et Scellé Électroniquement]</i>", ParagraphStyle("RightSig", parent=header_style, alignment=TA_RIGHT)),
    ]
  ]
  t_sig = Table(signatures_data, colWidths=[260, 260])
  t_sig.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
  story.append(t_sig)

  doc.build(story)
  return f"/assets/documents/devis/{filename}"


def generate_facture_pdf(facture, client, output_dir: str = None) ->str:
  if output_dir is None:
    output_dir = os.path.abspath(
      os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend", "public", "assets", "documents", "factures")
    )
  os.makedirs(output_dir, exist_ok=True)

  filename = f"facture_{facture.numero}.pdf"
  file_path = os.path.join(output_dir, filename)

  doc = SimpleDocTemplate(
    file_path,
    pagesize=A4,
    rightMargin=36,
    leftMargin=36,
    topMargin=36,
    bottomMargin=36,
  )

  styles = getSampleStyleSheet()
  header_style = ParagraphStyle(
    "HeaderMeta",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=9,
    leading=12,
    textColor=colors.HexColor("#4B5563"),
  )
  bold_style = ParagraphStyle(
    "BoldMeta",
    parent=styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=9,
    leading=12,
    textColor=colors.HexColor("#111827"),
  )

  story = []

  # 1. Header
  header_data = [
    [
      Paragraph("<b>E-TRANSPORT VOYAGES EURL</b><br/>Capital Social : 50 000 000 DZD<br/>NIF : 001916001234567 — RC : 16/00-1234567B19<br/>Zone Industrielle Oued Smar, Alger", header_style),
      Paragraph(f"<b>FACTURE OFFICIELLE</b><br/><font size=14 color='#1E40AF'><b>N° {facture.numero}</b></font><br/>Date Émission : {facture.date_emission.strftime('%d/%m/%Y')}<br/>Date Échéance : {facture.date_echeance.strftime('%d/%m/%Y')}", ParagraphStyle("RightHeader", parent=header_style, alignment=TA_RIGHT)),
    ]
  ]
  t_header = Table(header_data, colWidths=[300, 220])
  t_header.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
  story.append(t_header)
  story.append(Spacer(1, 14))
  story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1E40AF"), spaceAfter=14))

  # 2. Client Box
  client_name = getattr(client, "nom_commercial", "Client") if client else "Client"
  client_nif = getattr(client, "nif", "—") if client else "—"
  client_nis = getattr(client, "nis", "—") if client else "—"
  client_addr = getattr(client, "adresse", "Alger, Algérie") if client else "Alger, Algérie"

  client_box_data = [
    [
      Paragraph("<b>CLIENT FACTURÉ :</b>", bold_style),
      Paragraph(f"<b>{client_name}</b><br/>"
           f"NIF : {client_nif} | NIS : {client_nis}<br/>"
           f"Adresse : {client_addr}", header_style)
    ]
  ]
  t_client = Table(client_box_data, colWidths=[160, 360])
  t_client.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
    ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#E2E8F0")),
    ("PADDING", (0, 0), (-1, -1), 8),
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
  ]))
  story.append(t_client)
  story.append(Spacer(1, 14))

  # 3. Lines Table
  lines_header = ["Service", "Description", "Qté", "P.U (DZD)", "Total HT (DZD)"]
  table_rows = [lines_header]

  for lig in facture.lignes:
    table_rows.append([
      lig.service,
      lig.description,
      f"{lig.quantite:g}",
      f"{lig.prix_unitaire:,.2f}",
      f"{lig.total_ligne:,.2f}",
    ])

  t_lines = Table(table_rows, colWidths=[100, 220, 40, 80, 80])
  t_lines.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E40AF")),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTSIZE", (0, 0), (-1, 0), 8.5),
    ("ALIGN", (2, 0), (-1, -1), "RIGHT"),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
    ("PADDING", (0, 0), (-1, -1), 5),
  ]))
  story.append(t_lines)
  story.append(Spacer(1, 12))

  # 4. Summary & Payments Ledger
  summary_data = [
    ["Total Hors Taxes (HT) :", f"{facture.total_ht:,.2f} DZD"],
    [f"TVA ({facture.taux_tva}%) :", f"{facture.montant_tva:,.2f} DZD"],
    ["TOTAL FACTURÉ TTC :", f"{facture.total_ttc:,.2f} DZD"],
    ["Montant Déjà Réglé :", f"{facture.montant_paye:,.2f} DZD"],
    ["NET RESTANT À PAYER :", f"{facture.montant_restant:,.2f} DZD"],
  ]
  t_sum = Table(summary_data, colWidths=[140, 120])
  t_sum.setStyle(TableStyle([
    ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
    ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
    ("FONTSIZE", (0, 2), (-1, 2), 9),
    ("BACKGROUND", (0, 2), (-1, 2), colors.HexColor("#F1F5F9")),
    ("FONTSIZE", (0, -1), (-1, -1), 10),
    ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#FEE2E2") if facture.montant_restant >0 else colors.HexColor("#DCFCE7")),
    ("TEXTCOLOR", (0, -1), (-1, -1), colors.HexColor("#991B1B") if facture.montant_restant >0 else colors.HexColor("#166534")),
    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
    ("PADDING", (0, 0), (-1, -1), 5),
  ]))

  wrapper_table = Table([["", t_sum]], colWidths=[260, 260])
  story.append(wrapper_table)
  story.append(Spacer(1, 16))

  # 5. Payment details
  story.append(Paragraph(f"<b>Mode de règlement :</b>{facture.mode_reglement.value if hasattr(facture.mode_reglement, 'value') else facture.mode_reglement}", header_style))
  story.append(Spacer(1, 16))

  signatures_data = [
    [
      Paragraph("<b>Direction Financière & Comptabilité :</b><br/>Cachet & Signature électronique certifiée<br/><br/><br/><br/><i>[Validé pour émission officielle]</i>", header_style),
      Paragraph(f"<b>Statut du Règlement :</b><br/><font size=12 color='{'#166534'if facture.montant_restant == 0 else '#B45309'}'><b>{facture.statut.value if hasattr(facture.statut, 'value') else facture.statut}</b></font>", ParagraphStyle("RightSig", parent=header_style, alignment=TA_RIGHT)),
    ]
  ]
  t_sig = Table(signatures_data, colWidths=[260, 260])
  story.append(t_sig)

  doc.build(story)
  return f"/assets/documents/factures/{filename}"
