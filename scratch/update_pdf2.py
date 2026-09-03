import codecs
import re

with codecs.open('backend/app/services/pdf_finance_service.py', 'r', 'utf-8') as f:
    content = f.read()

# Replace header NIF/RC separators and remove phone
# Original: "NIF : 001916001234567 | RC : 16/00-1234567B19<br/>Zone Industrielle Oued Smar, Alger<br/>Tél : +213 (0) 23 85 40 00"
content = content.replace("NIF : 001916001234567 | RC : 16/00-1234567B19", "NIF : 001916001234567 &nbsp;&nbsp;|&nbsp;&nbsp; RC : 16/00-1234567B19")
content = content.replace("<br/>Tél : +213 (0) 23 85 40 00", "")

# Replace Client NIF / NIS separator
# Original: "NIF : {client_nif} | NIS : {client_nis}<br/>"
content = content.replace("NIF : {client_nif} | NIS : {client_nis}", "NIF : {client_nif} &nbsp;&nbsp;|&nbsp;&nbsp; NIS : {client_nis}")

# Original: "Tél : {client_tel}" -> wait, the user asked to remove "tel", probably company tel, but let's remove client tel too?
# The image shows "Tél: +213 (0) 23 85 40 00" which is the company's phone. So we only need to remove the company phone.
# We just did that with `<br/>Tél : +213...`.

with codecs.open('backend/app/services/pdf_finance_service.py', 'w', 'utf-8') as f:
    f.write(content)
print('Updated pdf_finance_service.py')
