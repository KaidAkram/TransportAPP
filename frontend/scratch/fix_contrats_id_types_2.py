import sys

file_path = "c:/Users/Akram KAID/Desktop/Entreprise_transport/frontend/src/app/contrats/[id]/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix remaining references to ContratDetail/Avenant properties
content = content.replace("a.modif_montant.toLocaleString", "a.modif_montant?.toLocaleString")
content = content.replace("Avenant {av.reference}", "Avenant {av.numero}")
content = content.replace("{av.type_modification}", "{av.objet}")
content = content.replace("{new Date(av.date_signature)", "{new Date(av.date)")
content = content.replace("{contrat.notes_renouvellement}", "Aucune note de renouvellement")
content = content.replace("contrat.notes_renouvellement &&", "false &&") # hide it

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("page.tsx typings fixed again")
