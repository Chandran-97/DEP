"""Application configuration. Local demo reads an Excel workbook; no Graph credentials needed."""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
_excel = Path(os.getenv("EXCEL_PATH", "data/Data Practice Resources.xlsx")).expanduser()
EXCEL_PATH = _excel if _excel.is_absolute() else BASE_DIR / _excel
FRONTEND_DIR = BASE_DIR / "frontend"
LOGIN_EMAIL = os.getenv("LOGIN_EMAIL", "").strip()
LOGIN_PASSWORD_HASH = os.getenv("LOGIN_PASSWORD_HASH", "")
SESSION_SECRET = os.getenv("SESSION_SECRET", "")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").strip().lower() in {"1", "true", "yes"}
REFRESH_SECONDS = max(5, int(os.getenv("REFRESH_SECONDS", "10")))
