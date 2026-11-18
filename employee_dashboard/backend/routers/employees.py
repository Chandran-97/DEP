from fastapi import APIRouter
from backend.services.dashboard_service import get_employees
router = APIRouter(prefix="/api/employees", tags=["Employees"])
@router.get("")
def list_employees(location: str|None=None, certification_status: str|None=None, billable_status: str|None=None, work_status: str|None=None, allocation_status: str|None=None, manager: str|None=None, search: str|None=None):
    filters = {"location": location, "certification_status": certification_status, "billable_status": billable_status, "work_status": work_status, "allocation_status": allocation_status, "manager": manager}
    rows = get_employees(filters)
    if search:
        q = search.casefold()
        rows = [r for r in rows if any(q in str(v or "").casefold() for v in [r.get("employee_id"),r.get("name"),r.get("email"),r.get("project"),r.get("location")])]
    return rows
