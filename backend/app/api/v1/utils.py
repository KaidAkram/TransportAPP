from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from app.core.database import get_db
from app.models.stock import Reception
from app.models.contrat import Caution
from app.models.employe import Employe
from app.models.vehicule import Vehicule

router = APIRouter()

@router.get("/next-sequence")
def get_next_sequence(entity: str, db: Session = Depends(get_db)):
    year = datetime.now().year
    
    if entity == "reception":
        # pattern: REC-YYYY-NNNN
        prefix = f"REC-{year}-"
        result = db.query(Reception.numero).filter(Reception.numero.like(f"{prefix}%")).order_by(Reception.numero.desc()).first()
        if result and result[0]:
            try:
                last_num = int(result[0].split("-")[-1])
                return {"next": f"{prefix}{last_num + 1:04d}"}
            except ValueError:
                return {"next": f"{prefix}0001"}
        return {"next": f"{prefix}0001"}
        
    elif entity == "caution":
        # pattern: CAU-YYYY-NNNN
        prefix = f"CAU-{year}-"
        result = db.query(Caution.numero).filter(Caution.numero.like(f"{prefix}%")).order_by(Caution.numero.desc()).first()
        if result and result[0]:
            try:
                last_num = int(result[0].split("-")[-1])
                return {"next": f"{prefix}{last_num + 1:04d}"}
            except ValueError:
                return {"next": f"{prefix}0001"}
        return {"next": f"{prefix}0001"}
        
    elif entity == "employe":
        # pattern: EMP-YYYY-NNNN
        prefix = f"EMP-{year}-"
        result = db.query(Employe.matricule).filter(Employe.matricule.like(f"{prefix}%")).order_by(Employe.matricule.desc()).first()
        if result and result[0]:
            try:
                last_num = int(result[0].split("-")[-1])
                return {"next": f"{prefix}{last_num + 1:04d}"}
            except ValueError:
                return {"next": f"{prefix}0001"}
        return {"next": f"{prefix}0001"}
        
    elif entity == "vehicule":
        # pattern: VEH-YYYY-NNNN
        prefix = f"VEH-{year}-"
        result = db.query(Vehicule.immatriculation).filter(Vehicule.immatriculation.like(f"{prefix}%")).order_by(Vehicule.immatriculation.desc()).first()
        if result and result[0]:
            try:
                last_num = int(result[0].split("-")[-1])
                return {"next": f"{prefix}{last_num + 1:04d}"}
            except ValueError:
                return {"next": f"{prefix}0001"}
        return {"next": f"{prefix}0001"}
        
    else:
        raise HTTPException(status_code=400, detail="Entité non supportée pour la génération de séquence.")
