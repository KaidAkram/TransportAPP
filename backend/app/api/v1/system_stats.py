import os
import shutil
import psutil
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.security import require_admin, CurrentUser

router = APIRouter(prefix="/admin/system", tags=["System Health"])

def format_bytes(size: float) -> str:
    power = 2**10
    n = 0
    power_labels = {0: 'Bytes', 1: 'KB', 2: 'MB', 3: 'GB', 4: 'TB'}
    while size > power and n < 4:
        size /= power
        n += 1
    return f"{size:.1f} {power_labels[n]}"

@router.get("/storage-usage", summary="Get system storage and memory usage (Admin Only)")
def get_system_storage_usage(
    admin_user: CurrentUser = Depends(require_admin),
    db: Session = Depends(get_db)
):
    response = {
        "database": {
            "used_bytes": 0,
            "used_formatted": "0.0 MB",
            "free_tier_limit_formatted": "500.0 MB",
            "usage_percentage": 0.0
        },
        "file_storage": {
            "used_bytes": 0,
            "used_formatted": "0.0 MB",
            "free_tier_limit_formatted": "1.0 GB",
            "usage_percentage": 0.0
        },
        "server": {
            "disk_used_formatted": "0.0 MB",
            "disk_total_formatted": "0.0 MB",
            "memory_usage_mb": 0.0
        }
    }

    # 1. Database Usage
    try:
        db_size_query = text("SELECT pg_database_size(current_database())")
        db_size_bytes = db.execute(db_size_query).scalar()
        if db_size_bytes is not None:
            db_size_bytes = int(db_size_bytes)
            response["database"]["used_bytes"] = db_size_bytes
            response["database"]["used_formatted"] = format_bytes(db_size_bytes)
            # 500 MB limit
            db_limit_bytes = 500 * 1024 * 1024
            response["database"]["usage_percentage"] = round((db_size_bytes / db_limit_bytes) * 100, 1)
    except Exception as e:
        print(f"Error fetching database size: {e}")

    # 2. File Storage Usage (Local uploads directory or DB)
    try:
        # Check size of the 'uploads' directory
        uploads_dir = "uploads"
        total_size = 0
        if os.path.exists(uploads_dir):
            for dirpath, _, filenames in os.walk(uploads_dir):
                for f in filenames:
                    fp = os.path.join(dirpath, f)
                    if not os.path.islink(fp):
                        total_size += os.path.getsize(fp)
        
        # If total_size is 0, fallback to checking the database documents table
        if total_size == 0:
            doc_size_query = text("SELECT COALESCE(SUM(size), 0) FROM documents")
            db_doc_size = db.execute(doc_size_query).scalar()
            if db_doc_size:
                total_size = int(db_doc_size)

        response["file_storage"]["used_bytes"] = total_size
        response["file_storage"]["used_formatted"] = format_bytes(total_size)
        # 1 GB limit
        storage_limit_bytes = 1024 * 1024 * 1024
        response["file_storage"]["usage_percentage"] = round((total_size / storage_limit_bytes) * 100, 1)
    except Exception as e:
        print(f"Error fetching file storage size: {e}")

    # 3. Server Disk & Memory
    try:
        disk_usage = shutil.disk_usage("/")
        response["server"]["disk_used_formatted"] = format_bytes(disk_usage.used)
        response["server"]["disk_total_formatted"] = format_bytes(disk_usage.total)
        
        mem_info = psutil.virtual_memory()
        response["server"]["memory_usage_mb"] = round(mem_info.used / (1024 * 1024), 1)
    except Exception as e:
        print(f"Error fetching server metrics: {e}")

    return response
