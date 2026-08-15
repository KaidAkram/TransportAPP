import sys

file_path = "c:/Users/Akram KAID/Desktop/Entreprise_transport/frontend/src/app/contrats/[id]/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix references to ContratDetail/Avenant properties
content = content.replace("contrat.date_fin_actuelle", "contrat.date_fin")
content = content.replace("contrat.delai_paiement_jours", "contrat.conditions_paiement")
content = content.replace("contrat.taux_penalite_retard", "'N/A'")
content = content.replace("a.reference", "a.numero")
content = content.replace("a.date_signature", "a.date")
content = content.replace("a.type_modification", "a.objet")
content = content.replace("a.nouveau_montant", "a.modif_montant")
content = content.replace("a.statut === \"ACTIF\"", "true") # avenant doesn't have statut
content = content.replace("{a.statut}", "Validé")
content = content.replace("c.reference", "c.numero")
content = content.replace("c.type_caution", "c.type")
content = content.replace("c.banque_emettrie", "'N/A'")
content = content.replace("c.date_validite", "c.date_echeance || ''")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("page.tsx typings fixed")
