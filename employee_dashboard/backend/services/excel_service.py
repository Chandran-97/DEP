
"""Load Excel workbooks, detect employee headers across sheets, and normalize source fields."""

from pathlib import Path
import re
import time
from datetime import date

import pandas as pd

from backend.config import EXCEL_PATH


ALIASES = {
    "serial_number": ["#", "S.no", "S No", "Serial Number", "S.No."],
    "employee_id": ["Employee ID", "Employee Id", "EmployeeID", "Employee Number", "Emp ID", "ID"],
    "name": ["Employee Name", "Name", "Employee"],
    "manager": ["Managers", "Manager", "Reporting Manager"],
    "email": ["Email", "E-mail", "Email Address", "Work Email"],
    "department": ["Department", "Business Unit", "Practice"],
    "project": ["Mapped to Project", "Project", "Project Name", "Project Mapping"],
    "location": ["Location", "Office Location", "City"],
    "contact_number": ["Contact Number", "Contact", "Phone", "Phone Number"],
    "technical_skills": ["Technical Skills", "Technical Skill", "Skills"],
    "yoe": ["YOE", "Years of Experience", "Experience"],
    "doj_dep": ["DOJ DEP", "DOJ", "Date of Joining"],
    "internal_external": ["Internal/External", "Internal External", "Employee Type"],
    "client_name": ["Client Name", "Client"],
    "certification": ["Certification", "Certifications", "Certification Name", "Certification Names", "Certifications/Skills", "Technical Certification"],
    "certification_completion_date": ["Date of Completion", "Certification Completion Date", "Completion Date"],
    "certification_expected_date": ["Expected Date of Completion", "Expected Completion Date", "Certification Expected Date"],
    "profiles_uploaded": ["Profiles Uploaded", "Profile Uploaded", "Profile Status"],
    "billable_from": ["Billable from", "Billable From", "Billable Start Date"],
    "certification_status": ["Certification Status", "Cert Status", "Certification Completed", "Certification Completion Status"],
    "billable_status": ["Billable Status", "Billability", "Billable", "Billing Status"],
    "bgv_status": ["BGV Status", "Background Verification Status", "Background Check Status", "BGV"],
    "work_status": ["Work Status", "Employment Status", "Employee Status", "Status"],
    "allocation_status": ["Allocation Status", "Project Allocation Status", "Resource Status"],
    "idle_since": ["Idle Since", "Bench Start Date", "Unallocated Since", "Last Project End Date"],
    "last_working_date": ["Last Working Date", "Last Active Date", "Last Project Date"],
}

_cache = {"signature": None, "df": None}


def _norm(value) -> str:
    raw = str(value or "").strip().casefold()
    if raw == "#":
        return "#"
    return re.sub(r"[^a-z0-9]+", "", raw)


_ALIAS_LOOKUP = {
    _norm(alias): target
    for target, aliases in ALIASES.items()
    for alias in aliases
}


def _signature(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(
            f"Excel file not found: {path}. "
            "Set EXCEL_PATH in .env or place the workbook at data/employees.xlsx."
        )

    s = path.stat()
    return f"{path.resolve()}|{s.st_size}|{s.st_mtime_ns}"


def get_workbook_version() -> str:
    return _signature(EXCEL_PATH)


def _read_employee_sheet(path: Path):
    """Find a worksheet/header row containing Employee ID and Employee Name."""

    try:
        book = pd.ExcelFile(path, engine="openpyxl")

        for sheet in book.sheet_names:
            preview = pd.read_excel(
                book,
                sheet_name=sheet,
                header=None,
                dtype=str,
                nrows=30,
            ).fillna("")

            for row_idx in range(len(preview)):
                cells = [_norm(v) for v in preview.iloc[row_idx].tolist()]
                mapped = {_ALIAS_LOOKUP.get(cell) for cell in cells if cell}

                if "employee_id" in mapped and "name" in mapped:
                    df = pd.read_excel(
                        book,
                        sheet_name=sheet,
                        header=row_idx,
                        dtype=str,
                        engine="openpyxl",
                    )
                    df.columns = [str(c).strip() for c in df.columns]
                    return df, sheet, row_idx + 1

        raise ValueError(
            "Could not find a worksheet header row containing both "
            "Employee ID and Employee Name. Check the workbook tabs and header row."
        )

    except ValueError:
        raise
    except Exception as exc:
        raise RuntimeError(
            f"Could not inspect Excel workbook: {exc}"
        ) from exc


def _parse_date(value):
    raw = str(value or "").strip()

    if not raw or raw.casefold() in {"nan", "nat", "none"}:
        return None

    try:
        return pd.to_datetime(
            raw,
            errors="raise",
            dayfirst=True,
        ).date()
    except Exception:
        return None


def _normalize_billable_value(value):
    """Normalize YES/NO values and date-based billability."""

    raw = str(value or "").strip().casefold()

    if raw in {"yes", "y", "billable"}:
        return "Billable"

    if raw in {"no", "n", "non-billable", "nonbillable"}:
        return "Non-Billable"

    dt = _parse_date(value)

    if dt is None:
        return "Not provided"

    return "Billable" if dt <= date.today() else "Non-Billable"


def load_employees(force: bool = False) -> pd.DataFrame:
    sig = _signature(EXCEL_PATH)

    if (
        not force
        and _cache["signature"] == sig
        and _cache["df"] is not None
    ):
        return _cache["df"].copy()

    last_error = None

    for attempt in range(3):
        try:
            raw, sheet_name, header_row = _read_employee_sheet(EXCEL_PATH)
            break

        except Exception as exc:
            last_error = exc

            if attempt == 2:
                raise last_error

            time.sleep(0.6)

    raw = raw.loc[
        :,
        ~raw.columns.astype(str).str.match(r"^Unnamed")
    ]

    raw.columns = [str(c).strip() for c in raw.columns]
    raw = raw.dropna(how="all").fillna("")

    for col in raw.columns:
        raw[col] = raw[col].astype(str).str.strip()

    normalized = pd.DataFrame(index=raw.index)
    source_by_target = {}

    normalized_header_map = {
        _norm(c): c for c in raw.columns
    }

    for target, candidates in ALIASES.items():
        source = next(
            (
                normalized_header_map.get(_norm(candidate))
                for candidate in candidates
                if normalized_header_map.get(_norm(candidate)) is not None
            ),
            None,
        )

        source_by_target[target] = source
        normalized[target] = raw[source] if source else ""

    if (
        not normalized["employee_id"].astype(str).str.strip().any()
        or not normalized["name"].astype(str).str.strip().any()
    ):
        raise ValueError(
            f"Found worksheet '{sheet_name}' with header row {header_row}, "
            "but Employee ID or Employee Name values are empty."
        )

    if not normalized["serial_number"].astype(str).str.strip().any():
        normalized["serial_number"] = [
            str(i) for i in range(1, len(normalized) + 1)
        ]

    # Normalize billability.
    # If Billable Status is unavailable, use the Billable from column.
    if source_by_target["billable_status"] is None:
        normalized["billable_status"] = (
            normalized["billable_from"].map(_normalize_billable_value)
        )
    else:
        normalized["billable_status"] = (
            normalized["billable_status"].map(_normalize_billable_value)
        )

    # Derive certification status from completion and expected dates.
    if source_by_target["certification_status"] is None:
        if source_by_target["certification_completion_date"] is not None:

            def cert_status(row):
                if _parse_date(row.get("certification_completion_date")):
                    return "Completed"

                if _parse_date(row.get("certification_expected_date")):
                    return "Not completed"

                return "Not provided"

            normalized["certification_status"] = normalized.apply(
                cert_status,
                axis=1,
            )
        else:
            normalized["certification_status"] = "Not provided"

    else:
        normalized["certification_status"] = (
            normalized["certification_status"]
            .replace("", "Not provided")
        )

    # Normalize optional fields.
    for col in [
        "work_status",
        "allocation_status",
        "certification",
        "location",
        "project",
        "manager",
    ]:
        normalized[col] = normalized[col].replace(
            "",
            "Not provided",
        )

    # Calculate idle days where a valid idle date exists.
    normalized["idle_days"] = normalized.apply(
        _idle_days,
        axis=1,
    )

    normalized["source_sheet"] = sheet_name
    normalized["source_header_row"] = header_row
    normalized["source_fields"] = [
        ", ".join(raw.columns)
    ] * len(normalized)

    _cache.update(
        signature=sig,
        df=normalized.copy(),
    )

    return normalized


def _idle_days(row):
    raw = str(row.get("idle_since", "")).strip()
    dt = _parse_date(raw)

    return max(0, (date.today() - dt).days) if dt else None


def clear_cache():
    _cache.update(
        signature=None,
        df=None,
    )


def to_records(df):
    records = df.to_dict(orient="records")
    cleaned = []

    for row in records:
        item = {}

        for key, value in row.items():
            try:
                item[key] = None if pd.isna(value) else value
            except (TypeError, ValueError):
                item[key] = value

        cleaned.append(item)

    return cleaned
