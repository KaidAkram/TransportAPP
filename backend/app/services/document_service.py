from datetime import date
from typing import Optional


def compute_validity_status(date_expiration: Optional[date]) -> str:
    """
    Computes semantic validity status for administrative documents.
    - Expiré: date_expiration < today
    - Expire bientôt: <= 30 days remaining
    - Valide: > 30 days remaining or no expiry date
    """
    if not date_expiration:
        return "Valide"

    today = date.today()
    diff = (date_expiration - today).days

    if diff < 0:
        return "Expiré"
    elif diff <= 30:
        return "Expire bientôt"
    else:
        return "Valide"
