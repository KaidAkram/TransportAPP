import codecs
import re

with codecs.open('backend/app/services/pdf_service.py', 'r', 'utf-8') as f:
    content = f.read()

# Replace header_bold
content = re.sub(
    r"header_bold = ParagraphStyle\('HeaderBold', parent=styles\['Normal'\], fontName='Helvetica-Bold', fontSize=14\)",
    r"header_bold = ParagraphStyle('HeaderBold', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=14, leading=18, spaceAfter=6)",
    content
)

# Replace header_norm
content = re.sub(
    r"header_norm = ParagraphStyle\('HeaderNorm', parent=styles\['Normal'\], fontName='Helvetica', fontSize=10\)",
    r"header_norm = ParagraphStyle('HeaderNorm', parent=styles['Normal'], fontName='Helvetica', fontSize=10, leading=14, spaceAfter=6)",
    content
)

with codecs.open('backend/app/services/pdf_service.py', 'w', 'utf-8') as f:
    f.write(content)

print('Fixed spacing in pdf_service.py')
