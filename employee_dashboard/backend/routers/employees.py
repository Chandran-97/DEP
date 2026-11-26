from io import BytesIO
import pandas as pd
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from backend.services.dashboard_service import get_employees

router = APIRouter(prefix="/api/employees", tags=["Employees"])

class ExportRequest(BaseModel):
    rows: list[dict]

@router.get("")
def list_employees(location: str|None=None, certification_status: str|None=None, billable_status: str|None=None, work_status: str|None=None, allocation_status: str|None=None, bgv_status: str|None=None, manager: str|None=None, search: str|None=None):
    filters = {"location": location, "certification_status": certification_status, "billable_status": billable_status, "work_status": work_status, "allocation_status": allocation_status, "bgv_status": bgv_status, "manager": manager}
    rows = get_employees(filters)
    if search:
        q = search.casefold()
        rows = [r for r in rows if any(q in str(v or "").casefold() for v in r.values())]
    return rows

@router.post("/export")
def export_employees(payload: ExportRequest):
    frame = pd.DataFrame(payload.rows)
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        frame.to_excel(writer, index=False, sheet_name="DEP Employees")
        ws = writer.sheets["DEP Employees"]
        ws.freeze_panes = "A2"
        ws.auto_filter.ref = ws.dimensions
        for column in ws.columns:
            letter = column[0].column_letter
            max_len = max((len(str(cell.value or "")) for cell in column[:200]), default=12)
            ws.column_dimensions[letter].width = min(max(max_len + 2, 12), 36)
    output.seek(0)
    return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=Data Practice Resources.xlsx"})
