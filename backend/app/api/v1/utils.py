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
        results = db.query(Reception.numero).filter(Reception.numero.like(f"{prefix}%")).all()
        max_num = 0
        for res in results:
            try:
                num = int(res[0].split("-")[-1])
                if num > max_num:
                    max_num = num
            except (ValueError, IndexError):
                pass
        return {"next": f"{prefix}{max_num + 1:04d}"}
        
    elif entity == "caution":
        # pattern: CAU-YYYY-NNNN
        prefix = f"CAU-{year}-"
        results = db.query(Caution.numero).filter(Caution.numero.like(f"{prefix}%")).all()
        max_num = 0
        for res in results:
            try:
                num = int(res[0].split("-")[-1])
                if num > max_num:
                    max_num = num
            except (ValueError, IndexError):
                pass
        return {"next": f"{prefix}{max_num + 1:04d}"}
        
    elif entity == "employe":
        # pattern: EMP-YYYY-NNNN
        prefix = f"EMP-{year}-"
        results = db.query(Employe.matricule).filter(Employe.matricule.like(f"{prefix}%")).all()
        max_num = 0
        for res in results:
            try:
                num = int(res[0].split("-")[-1])
                if num > max_num:
                    max_num = num
            except (ValueError, IndexError):
                pass
        return {"next": f"{prefix}{max_num + 1:04d}"}
        
    elif entity == "vehicule":
        # pattern: VEH-YYYY-NNNN
        prefix = f"VEH-{year}-"
        results = db.query(Vehicule.immatriculation).filter(Vehicule.immatriculation.like(f"{prefix}%")).all()
        max_num = 0
        for res in results:
            try:
                num = int(res[0].split("-")[-1])
                if num > max_num:
                    max_num = num
            except (ValueError, IndexError):
                pass
        return {"next": f"{prefix}{max_num + 1:04d}"}
        
    else:
        raise HTTPException(status_code=400, detail="Entité non supportée pour la génération de séquence.")
