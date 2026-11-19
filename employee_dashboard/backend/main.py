from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import Response
from backend.auth_utils import validate_password_hash
from backend.config import COOKIE_SECURE, FRONTEND_DIR, LOGIN_EMAIL, LOGIN_PASSWORD_HASH, SESSION_SECRET
from backend.routers import auth, dashboard, employees
 
@asynccontextmanager
async def lifespan(app: FastAPI):
    missing = [n for n,v in (("LOGIN_EMAIL",LOGIN_EMAIL),("LOGIN_PASSWORD_HASH",LOGIN_PASSWORD_HASH),("SESSION_SECRET",SESSION_SECRET)) if not v]
    if missing: raise RuntimeError(f"Missing authentication settings: {', '.join(missing)}. Run setup_login.py first.")
    if len(SESSION_SECRET) < 32: raise RuntimeError("SESSION_SECRET must be at least 32 characters.")
    validate_password_hash(LOGIN_PASSWORD_HASH)
    yield
class AuthenticationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path=request.url.path
        public={"/login","/api/auth/login","/css/style.css","/js/login.js"}
        if path not in public and not request.session.get("authenticated"):
            response=JSONResponse(status_code=401,content={"detail":"Authentication required."}) if path.startswith("/api/") else RedirectResponse("/login",303)
        elif path=="/login" and request.session.get("authenticated"): response=RedirectResponse("/dep/dashboard",303)
        else: response=await call_next(request)
        response.headers.setdefault("Cache-Control","no-store")
        response.headers.setdefault("X-Content-Type-Options","nosniff")
        response.headers.setdefault("X-Frame-Options","DENY")
        response.headers.setdefault("Referrer-Policy","strict-origin-when-cross-origin")
        return response
app=FastAPI(title="Fulcrum Employee Intelligence Dashboard",lifespan=lifespan)
app.add_middleware(AuthenticationMiddleware)
app.add_middleware(SessionMiddleware,secret_key=SESSION_SECRET or "configuration-required-before-startup",session_cookie="employee_dashboard_session",max_age=8*60*60,same_site="lax",https_only=COOKIE_SECURE)
@app.get("/login",include_in_schema=False)
def login_page(): return FileResponse(FRONTEND_DIR/"login.html")
@app.exception_handler(FileNotFoundError)
async def file_missing(request,exc): return JSONResponse(status_code=503,content={"detail":str(exc)})
@app.exception_handler(ValueError)
async def bad_excel(request,exc): return JSONResponse(status_code=500,content={"detail":str(exc)})
@app.exception_handler(RuntimeError)
async def data_error(request,exc): return JSONResponse(status_code=503,content={"detail":str(exc)})
app.include_router(auth.router); app.include_router(dashboard.router); app.include_router(employees.router)
app.mount("/",StaticFiles(directory=FRONTEND_DIR,html=True),name="frontend")