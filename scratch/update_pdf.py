import codecs
import re

with codecs.open('backend/app/services/pdf_service.py', 'r', 'utf-8') as f:
    content = f.read()

content = content.replace('Paragraph(f"RC: {rc} | NIF: {nif} | AI: {ai} | NIS: {nis}", header_norm),', 'Paragraph(f"RC: {rc} &nbsp;&nbsp;|&nbsp;&nbsp; NIF: {nif} &nbsp;&nbsp;|&nbsp;&nbsp; AI: {ai} &nbsp;&nbsp;|&nbsp;&nbsp; NIS: {nis}", header_norm),')
content = content.replace('Paragraph(f"Tél: {phone}" if phone else "", header_norm),\n', '')
content = content.replace('Paragraph(f"Tél: {phone}" if phone else "", header_norm),', '')

with codecs.open('backend/app/services/pdf_service.py', 'w', 'utf-8') as f:
    f.write(content)
print('Updated pdf_service.py')
