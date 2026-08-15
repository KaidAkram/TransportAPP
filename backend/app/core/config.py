import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
  PROJECT_NAME: str = "E-Transport ERP API"
  VERSION: str = "1.0.0"
  API_V1_STR: str = "/api/v1"

  # CORS
  BACKEND_CORS_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
  ]

  # Database
  DATABASE_URL: str = "sqlite:///./etransport.db"

  # JWT & Auth
  JWT_SECRET: str = "e-transport-jwt-secret-key-algeria-2026-production"
  JWT_ALGORITHM: str = "HS256"
  ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days

  # Supabase Credentials
  SUPABASE_URL: str = "https://placeholder-project.supabase.co"
  SUPABASE_KEY: str = "placeholder-service-key"
  SUPABASE_ANON_KEY: str = "placeholder-anon-key"
  SUPABASE_JWT_SECRET: str = "placeholder-jwt-secret"

  model_config = SettingsConfigDict(
    env_file=".env",
    env_file_encoding="utf-8",
    case_sensitive=True,
    extra="ignore",
  )


settings = Settings()
