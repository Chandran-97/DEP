# PeoplePulse — Employee Intelligence Dashboard

A local FastAPI + Pandas + Chart.js dashboard for authorized Excel workbooks. This package includes **synthetic demo data only**. It does not contain or access Fulcrum's private SharePoint workbook.

## Features
- KPI cards: headcount, locations, certified, billable, working, long-idle (where source columns exist).
- Location, certification, billability, work-status and allocation distributions.
- Searchable employee directory with combined filters.
- Automatic source-version check every 10 seconds; dashboard reloads only when the workbook changes.
- Missing source fields remain `Not provided`; no billable/certification/working status is guessed.
- Local login with password hash and signed session.
- Excel file change detection and retry if OneDrive is still syncing.

## Run on Windows
1. Install Python 3.10+.
2. Open this folder in VS Code.
3. In terminal:
   ```powershell
   py -m venv .venv
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   py setup_login.py
   py -m uvicorn backend.main:app --reload
   ```
4. Open http://127.0.0.1:8000/login and sign in with the account created by `setup_login.py`.

## Use a locally synchronized SharePoint workbook
1. Use OneDrive's **Sync** command for the approved SharePoint document library. Do not bypass company policy.
2. In File Explorer, find the synchronized Excel workbook. Ensure it is downloaded and available offline (green check mark).
3. Copy its full path using Shift + right-click → **Copy as path**.
4. Create `.env` in this folder if it does not exist and add:
   ```env
   EXCEL_PATH="C:/Users/your-user/OneDrive - Fulcrum Digital/path/Employee_data.xlsx"
   REFRESH_SECONDS=10
   ```
   Keep your existing `LOGIN_EMAIL`, `LOGIN_PASSWORD_HASH`, `SESSION_SECRET`, and `COOKIE_SECURE=false` lines. Use forward slashes or escape backslashes in Windows paths.
5. Restart FastAPI. The backend reads the local synchronized file; the browser checks for changes every 10 seconds. OneDrive sync itself may take longer than 10 seconds, so this is not a guaranteed end-to-end 10-second SLA.

## Workbook headers
Required: `Employee ID`, `Employee Name` (or recognized equivalents).

Optional fields recognized: `Location`, `Managers`/`Manager`, `Mapped to Project`/`Project`, `Certification`, `Certification Status`, `Billable Status`/`Billability`, `Work Status`/`Status`, `Allocation Status`, `Idle Since`/`Bench Start Date`, `Last Working Date`, `Email`, `Department`, `Contact Number`.

If an optional field is absent, the corresponding KPI is shown as **N/A** or `Not provided`. Do not infer that no project mapping means non-billable, or that a missing certification means not certified. `Long idle` is counted only from a parseable `Idle Since`/equivalent date, using a 30-day threshold.

## Security and limitations
- `.env` and real employee workbooks must never be committed to Git or shared publicly.
- This local app is intended for a laptop demo. Keep the server bound to localhost for private demo use; do not expose the development server to the internet.
- Laptop must remain awake, connected and signed into OneDrive. OneDrive synchronization latency is outside the dashboard's control.
- Do not use synthetic demo numbers as Fulcrum workforce facts.
- The included demo workbook contains fictional employees and example statuses solely to demonstrate UI and calculations.


## Data Practice Resources workbook support

The Excel reader now searches all worksheets and the first 30 rows for a header row containing `Employee ID` and `Employee Name`. It recognizes the Data Practice Resources columns including `Technical Skills`, `YOE`, `Mapped to Project`, `Billable from`, `Client Name`, `Certification Name`, `Date of Completion`, `Expected Date of Completion`, `Profiles Uploaded`, and `Contact Number`. Blank separator columns and title rows are supported.

When no explicit billability status column exists, `Billable from` is interpreted as a start date: dates on or before today are classified as `Billable`; future dates as `Not yet billable`; blank or unparseable dates as `Not provided`. When no explicit certification status exists, a valid `Date of Completion` means `Completed`; otherwise a valid expected completion date means `Not completed`. The workbook is not modified.

The supplied column list does not include employee location, work status, allocation status, or idle start date. Those dashboard metrics remain unavailable until the source workbook supplies those fields; the app does not infer them.
