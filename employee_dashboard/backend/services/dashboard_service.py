from collections import Counter
from backend.services.excel_service import get_workbook_version, load_employees, to_records

TRUE = {"yes", "y", "true", "1", "completed", "certified", "billable", "active", "working", "allocated"}
FALSE = {"no", "n", "false", "0", "not completed", "not certified", "non-billable", "non billable", "inactive", "not working", "bench", "unallocated"}

def _key(v): return str(v or "").strip().casefold()
def _count_status(series, positive=True):
    values = series.fillna("").astype(str).str.strip().str.casefold()
    return int(values.isin(TRUE if positive else FALSE).sum())

def get_data_version(): return {"version": get_workbook_version()}

def get_dashboard():
    df = load_employees()
    total = len(df)
    def available(col): return bool((df[col].astype(str).str.strip() != "").any() and not df[col].astype(str).eq("Not provided").all())
    def distribution(col):
        s = df[col].fillna("Not provided").replace("", "Not provided")
        c = s.value_counts()
        return [{"label": str(k), "count": int(v)} for k, v in c.items()]
    cert_col = df["certification_status"]
    bill_col = df["billable_status"]
    work_col = df["work_status"]
    alloc_col = df["allocation_status"]
    idle = df["idle_days"].dropna()
    return {
        "summary": {"total_employees": total, "locations": int(df.loc[df.location != "Not provided", "location"].nunique()),
            "certified": _count_status(cert_col), "certification_not_completed": _count_status(cert_col, False),
            "billable": _count_status(bill_col), "non_billable": _count_status(bill_col, False),
            "working": _count_status(work_col), "not_working": _count_status(work_col, False),
            "bench": _count_status(alloc_col, False), "long_idle": int((idle >= 30).sum()),
            "certification_available": available("certification_status"), "billability_available": available("billable_status"),
            "work_status_available": available("work_status"), "allocation_available": available("allocation_status"),
            "idle_date_available": bool(idle.size)},
        "by_location": distribution("location"), "by_client": distribution("client_name"), "by_certification": distribution("certification_status"),
        "by_billability": distribution("billable_status"), "by_work_status": distribution("work_status"),
        "by_allocation": distribution("allocation_status"), "by_manager": distribution("manager"),
        "employees": to_records(df), "source_columns": list(df.columns), "version": get_workbook_version()
    }

def get_employees(filters=None):
    df = load_employees()
    filters = filters or {}
    for col, value in filters.items():
        if value and col in df.columns:
            df = df[df[col].astype(str).str.casefold() == str(value).casefold()]
    return to_records(df)
