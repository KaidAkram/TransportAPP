import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib import colors
from reportlab.lib.colors import HexColor

# Custom Colors based on app theme
HAITI = HexColor("#0f0c29")
ELECTRIC_VIOLET = HexColor("#834dfb")
TURBO = HexColor("#f5d020")
WHITE = colors.white
LIGHT_GREY = HexColor("#d1d5db")
EMERALD = HexColor("#10b981")
ROSE = HexColor("#f43f5e")

ROOT_DIR = r"C:\Users\Akram KAID\Desktop\Entreprise_transport"
BRAIN_DIR = r"C:\Users\Akram KAID\.gemini\antigravity-ide\brain\c4572d88-7076-4403-ae68-1fb4d61bd9c8"

def draw_header_footer(canvas, doc, title):
    canvas.saveState()
    
    # Header
    canvas.setFillColor(HAITI)
    canvas.rect(0, A4[1] - 80, A4[0], 80, fill=1, stroke=0)
    canvas.setFillColor(ELECTRIC_VIOLET)
    canvas.rect(0, A4[1] - 80, A4[0], 5, fill=1, stroke=0)
    
    canvas.setFont('Helvetica-Bold', 20)
    canvas.setFillColor(WHITE)
    canvas.drawString(40, A4[1] - 45, "Enterprise ERP System")
    canvas.setFont('Helvetica', 12)
    canvas.setFillColor(TURBO)
    canvas.drawString(40, A4[1] - 65, title)
    
    # Footer
    canvas.setFillColor(HAITI)
    canvas.rect(0, 0, A4[0], 40, fill=1, stroke=0)
    canvas.setFillColor(ELECTRIC_VIOLET)
    canvas.rect(0, 40, A4[0], 3, fill=1, stroke=0)
    canvas.setFont('Helvetica', 10)
    canvas.setFillColor(WHITE)
    canvas.drawString(40, 15, "© 2026 Enterprise Transport. All rights reserved.")
    canvas.drawRightString(A4[0] - 40, 15, f"Page {doc.page}")
    
    canvas.restoreState()

def get_styles():
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        name='CustomTitle',
        fontName='Helvetica-Bold',
        fontSize=28,
        textColor=HAITI,
        spaceAfter=30,
        alignment=1 # Center
    ))
    
    styles.add(ParagraphStyle(
        name='CustomHeading1',
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=ELECTRIC_VIOLET,
        spaceBefore=20,
        spaceAfter=15,
    ))
    
    styles.add(ParagraphStyle(
        name='CustomHeading2',
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=HAITI,
        spaceBefore=15,
        spaceAfter=10,
    ))
    
    styles.add(ParagraphStyle(
        name='CustomNormal',
        fontName='Helvetica',
        fontSize=11,
        textColor=HexColor("#374151"),
        leading=16,
        spaceAfter=10
    ))
    
    styles.add(ParagraphStyle(
        name='StepTitle',
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=ELECTRIC_VIOLET,
        leading=16,
        spaceBefore=5,
    ))
    
    return styles

def safe_image(path, width, height):
    if os.path.exists(path):
        return Image(path, width=width, height=height)
    return Spacer(1, 10)

def generate_user_guide():
    file_path = os.path.join(ROOT_DIR, "System_User_Guide.pdf")
    doc = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=40, leftMargin=40,
        topMargin=100, bottomMargin=60
    )
    
    styles = get_styles()
    story = []
    
    # Title Page
    story.append(Paragraph("System User Guide", styles['CustomTitle']))
    story.append(Spacer(1, 20))
    story.append(Paragraph("Welcome to the Enterprise Transport ERP", styles['CustomHeading1']))
    story.append(Paragraph("This manual provides an exhaustive, step-by-step guide to using the Enterprise Transport ERP system. Designed with a dark, high-contrast aesthetic, the platform unifies fleet management, maintenance, human resources, and financial tracking into one robust solution.", styles['CustomNormal']))
    
    # ---------------------------------------------------------
    # 1. Dashboard
    # ---------------------------------------------------------
    story.append(Paragraph("1. Tableau de bord (Dashboard)", styles['CustomHeading1']))
    story.append(Paragraph("The Dashboard is the first page you see upon logging in. It acts as your command center, offering real-time visibility into the health of your enterprise.", styles['CustomNormal']))
    
    story.append(Paragraph("Step 1: Review KPIs", styles['StepTitle']))
    story.append(Paragraph("At the top of the dashboard, review the Key Performance Indicators (Total Revenue, Active Vehicles, Unpaid Invoices). These metrics are live and updated instantly.", styles['CustomNormal']))
    
    story.append(Paragraph("Step 2: Navigate the Sidebar", styles['StepTitle']))
    story.append(Paragraph("On the left side of the screen is the primary navigation menu. Click on any module (Finances, Véhicules, Employés, etc.) to access it.", styles['CustomNormal']))
    
    img = safe_image(os.path.join(BRAIN_DIR, "dashboard_loaded_1787506825195.png"), 480, 260)
    story.append(Spacer(1, 10))
    story.append(img)
    
    story.append(PageBreak())
    
    # ---------------------------------------------------------
    # 2. Finances & Devis
    # ---------------------------------------------------------
    story.append(Paragraph("2. Finances & Devis", styles['CustomHeading1']))
    story.append(Paragraph("This module allows you to track expenses, issue invoices, manage payments, and generate quotes (devis).", styles['CustomNormal']))
    
    img = safe_image(os.path.join(BRAIN_DIR, "finances_page_1787507974347.png"), 480, 260)
    story.append(Spacer(1, 10))
    story.append(img)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Step 1: Create an Invoice", styles['StepTitle']))
    story.append(Paragraph("Click the '+ Nouvelle Facture' button. Select a client, add line items with their quantity and unit price, and the total will be calculated automatically including VAT.", styles['CustomNormal']))
    
    story.append(Paragraph("Step 2: Register a Payment", styles['StepTitle']))
    story.append(Paragraph("For an existing unpaid invoice, click 'Encaisser Paiement'. Specify the payment method (Bank Transfer, Cash, Check) and upload the receipt in the file uploader.", styles['CustomNormal']))

    story.append(PageBreak())

    # ---------------------------------------------------------
    # 3. Parc Automobile (Vehicles)
    # ---------------------------------------------------------
    story.append(Paragraph("3. Parc Automobile (Fleet Management)", styles['CustomHeading1']))
    story.append(Paragraph("Manage your entire fleet, including documents, mileage, accident reports (constats), and technical specifications.", styles['CustomNormal']))
    
    img = safe_image(os.path.join(BRAIN_DIR, "vehicules_list_1787506863038.png"), 480, 260)
    story.append(Spacer(1, 10))
    story.append(img)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Step 1: Add a Vehicle", styles['StepTitle']))
    story.append(Paragraph("Click '+ Nouveau Véhicule'. Fill in the license plate (immatriculation), brand, model, and initial mileage.", styles['CustomNormal']))
    
    story.append(Paragraph("Step 2: Access Vehicle Dossier", styles['StepTitle']))
    story.append(Paragraph("Click on any vehicle row to open its detailed sheet. Here you will see sub-tabs for 'Fiche Technique', 'Documents', 'Constats', and 'Maintenance'.", styles['CustomNormal']))
    
    img = safe_image(os.path.join(BRAIN_DIR, "vehicle_detail_1787506924920.png"), 480, 260)
    story.append(Spacer(1, 10))
    story.append(img)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Step 3: Document Management", styles['StepTitle']))
    story.append(Paragraph("In the 'Documents' tab of a vehicle, you can drop up to 10 files at once (e.g., Insurance, Gray Card) into the uploader zone. The system will track their expiration dates.", styles['CustomNormal']))

    story.append(PageBreak())

    # ---------------------------------------------------------
    # 4. Employés (Employees)
    # ---------------------------------------------------------
    story.append(Paragraph("4. Employés (Human Resources)", styles['CustomHeading1']))
    story.append(Paragraph("Manage drivers, mechanics, administrative staff, and their respective documents (ID cards, Driving Licenses).", styles['CustomNormal']))
    
    img = safe_image(os.path.join(BRAIN_DIR, "employes_page_1787507996221.png"), 480, 260)
    story.append(Spacer(1, 10))
    story.append(img)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Step 1: Filter Employees", styles['StepTitle']))
    story.append(Paragraph("Use the filter buttons (Tous, Chauffeurs, Mécaniciens) at the top of the page to easily find the staff you need.", styles['CustomNormal']))
    
    story.append(Paragraph("Step 2: Track Driving Licenses", styles['StepTitle']))
    story.append(Paragraph("When an employee is a driver, the system automatically highlights their driving license status (Valid, Expiring Soon, Expired).", styles['CustomNormal']))

    story.append(PageBreak())

    # ---------------------------------------------------------
    # 5. Partenaires CRM
    # ---------------------------------------------------------
    story.append(Paragraph("5. Partenaires CRM (Clients & Suppliers)", styles['CustomHeading1']))
    story.append(Paragraph("A unified CRM to manage both your Clients (for contracts and invoicing) and your Suppliers (for spare parts and external services).", styles['CustomNormal']))
    
    img = safe_image(os.path.join(BRAIN_DIR, "partenaires_crm_page_1787508029320.png"), 480, 260)
    story.append(Spacer(1, 10))
    story.append(img)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Step 1: Register a Partner", styles['StepTitle']))
    story.append(Paragraph("Click '+ Nouveau Partenaire'. Fill in their commercial name, NIF, RC, AI, and NIS for legal documentation.", styles['CustomNormal']))
    
    story.append(Paragraph("Step 2: Monitor Balances", styles['StepTitle']))
    story.append(Paragraph("The CRM list displays the 'Balance' of each client, helping you immediately identify clients with outstanding debts.", styles['CustomNormal']))

    story.append(PageBreak())

    # ---------------------------------------------------------
    # 6. Contrats (Contracts)
    # ---------------------------------------------------------
    story.append(Paragraph("6. Contrats (Contracts Management)", styles['CustomHeading1']))
    story.append(Paragraph("Track long-term transport contracts, their value, dates, and related guarantees.", styles['CustomNormal']))
    
    img = safe_image(os.path.join(BRAIN_DIR, "contrats_page_1787508074774.png"), 480, 260)
    story.append(Spacer(1, 10))
    story.append(img)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Step 1: Create a Contract", styles['StepTitle']))
    story.append(Paragraph("Click '+ Nouveau Contrat'. Link the contract to an existing Client from your CRM and specify the global value and expiration date.", styles['CustomNormal']))
    
    story.append(Paragraph("Step 2: Contract Notifications", styles['StepTitle']))
    story.append(Paragraph("Contracts nearing their expiration date will be flagged in red on the dashboard to ensure you renew them in time.", styles['CustomNormal']))

    story.append(PageBreak())

    # ---------------------------------------------------------
    # 7. Cautions Bancaires (Bank Guarantees)
    # ---------------------------------------------------------
    story.append(Paragraph("7. Cautions Bancaires", styles['CustomHeading1']))
    story.append(Paragraph("Manage financial guarantees provided to clients for tenders (Soumission) or good performance (Bonne Exécution).", styles['CustomNormal']))
    
    img = safe_image(os.path.join(BRAIN_DIR, "cautions_page_1787508116505.png"), 480, 260)
    story.append(Spacer(1, 10))
    story.append(img)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Step 1: Request a Guarantee", styles['StepTitle']))
    story.append(Paragraph("Click '+ Nouvelle Caution'. Choose the type (Soumission / Bonne Exécution) and link it to a specific Contract.", styles['CustomNormal']))
    
    story.append(Paragraph("Step 2: Attach Documents & Generate Letter", styles['StepTitle']))
    story.append(Paragraph("Use the generic upload area to attach relevant tender files. Check the 'Generate PDF' box to instantly produce the official bank request letter.", styles['CustomNormal']))
    
    story.append(PageBreak())
    
    # ---------------------------------------------------------
    # 8. Maintenance & GMAO
    # ---------------------------------------------------------
    story.append(Paragraph("8. Maintenance, Stock & GMAO", styles['CustomHeading1']))
    story.append(Paragraph("Plan work orders (Ordres de Travail) and track spare parts inventory using Dynamic Pricing (PUMP).", styles['CustomNormal']))
    
    img = safe_image(os.path.join(BRAIN_DIR, "maintenance_list_1787506886886.png"), 480, 260)
    story.append(Spacer(1, 10))
    story.append(img)
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("Step 1: Start an Intervention", styles['StepTitle']))
    story.append(Paragraph("Click '+ Créer Intervention'. Assign a mechanic and select the vehicle receiving maintenance.", styles['CustomNormal']))
    
    story.append(Paragraph("Step 2: Use Spare Parts (PUMP)", styles['StepTitle']))
    story.append(Paragraph("As you add parts to the intervention, the system automatically uses the Weighted Average Unit Price (Prix Unitaire Moyen Pondéré) of that part in your stock. This ensures perfect financial accuracy.", styles['CustomNormal']))
    
    story.append(Paragraph("Step 3: Complete Intervention", styles['StepTitle']))
    story.append(Paragraph("Enter the labor cost ('Main d'Oeuvre'). Upload any photos of the repair or external invoices to the unlimited document uploader. Click save.", styles['CustomNormal']))

    doc.build(story, onFirstPage=lambda c, d: draw_header_footer(c, d, "Comprehensive User Guide"), 
              onLaterPages=lambda c, d: draw_header_footer(c, d, "Comprehensive User Guide"))
    print(f"Created {file_path}")

if __name__ == "__main__":
    generate_user_guide()
