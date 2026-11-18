import hashlib, os
import pandas as pd
import pytest
from fastapi.testclient import TestClient
_SALT=bytes.fromhex('00112233445566778899aabbccddeeff')
_PASSWORD='test-dashboard-password'
_DIGEST=hashlib.pbkdf2_hmac('sha256',_PASSWORD.encode(),_SALT,310000)
os.environ['LOGIN_EMAIL']='dashboard-test@example.com'
os.environ['LOGIN_PASSWORD_HASH']=f'pbkdf2_sha256$310000${_SALT.hex()}${_DIGEST.hex()}'
os.environ['SESSION_SECRET']='test-only-session-secret-that-is-long-enough'
os.environ['COOKIE_SECURE']='false'
from backend.main import app
from backend.services import excel_service
@pytest.fixture
def client():
    with TestClient(app) as c:
        r=c.post('/api/auth/login',json={'email':'dashboard-test@example.com','password':_PASSWORD});assert r.status_code==200
        yield c

def test_auth_required():
    with TestClient(app) as c:
        assert c.get('/api/dashboard/overview').status_code==401
        assert c.get('/',follow_redirects=False).status_code==303

def test_login_and_dashboard(client):
    r=client.get('/api/dashboard/overview');assert r.status_code==200
    d=r.json();assert d['summary']['total_employees']==100
    assert len(d['employees'])==100
    assert d['summary']['certification_available'] is True
    assert d['summary']['billability_available'] is True
    assert d['summary']['work_status_available'] is True

def test_filters_combine(client):
    all_rows=client.get('/api/employees').json();assert all_rows
    loc=all_rows[0]['location'];status=all_rows[0]['certification_status']
    rows=client.get('/api/employees',params={'location':loc,'certification_status':status}).json()
    assert all(r['location']==loc and r['certification_status']==status for r in rows)

def test_missing_fields_not_invented(tmp_path,monkeypatch):
    path=tmp_path/'minimal.xlsx'
    pd.DataFrame([{'Employee ID':'X1','Employee Name':'Example','Location':'Pune'}]).to_excel(path,index=False)
    monkeypatch.setattr(excel_service,'EXCEL_PATH',path);excel_service.clear_cache()
    df=excel_service.load_employees()
    assert df.iloc[0]['certification_status']=='Not provided'
    assert df.iloc[0]['billable_status']=='Not provided'
    assert df.iloc[0]['work_status']=='Not provided'
    assert pd.isna(df.iloc[0]['idle_days'])

def test_version_changes(tmp_path,monkeypatch):
    path=tmp_path/'version.xlsx';monkeypatch.setattr(excel_service,'EXCEL_PATH',path);excel_service.clear_cache()
    pd.DataFrame([{'Employee ID':'X1','Employee Name':'A'}]).to_excel(path,index=False)
    v1=excel_service.get_workbook_version()
    pd.DataFrame([{'Employee ID':'X1','Employee Name':'B'}]).to_excel(path,index=False)
    os.utime(path,None);v2=excel_service.get_workbook_version()
    assert v1!=v2

def test_detects_realistic_data_practice_resources_layout(tmp_path, monkeypatch):
    path = tmp_path / 'Data Practice Resources.xlsx'
    with pd.ExcelWriter(path, engine='openpyxl') as writer:
        pd.DataFrame([['Data Practice Resources'], [], ['#', 'Employee ID', 'Employee Name', '', 'Technical Skills', 'YOE', 'Email', 'DOJ DEP', 'Internal/External', 'Mapped to Project', 'Billable from', 'Client Name', '', 'Certification Name', 'Date of Completion', 'Expected Date of Completion', '', 'Profiles Uploaded', '', 'Contact Number'],
                      [1, 'E001', 'Example Employee', '', 'Python, SQL', '6', 'example@example.com', '2020-01-01', 'Internal', 'Project A', '2024-01-01', 'Client A', '', 'Databricks', '2025-02-01', '', '', 'Yes', '', '9000000000']]).to_excel(writer, sheet_name='Roster', header=False, index=False)
    monkeypatch.setattr(excel_service, 'EXCEL_PATH', path); excel_service.clear_cache()
    df = excel_service.load_employees()
    assert len(df) == 1
    assert df.iloc[0]['employee_id'] == 'E001'
    assert df.iloc[0]['name'] == 'Example Employee'
    assert df.iloc[0]['project'] == 'Project A'
    assert df.iloc[0]['billable_status'] == 'Billable'
    assert df.iloc[0]['certification_status'] == 'Completed'
    assert df.iloc[0]['technical_skills'] == 'Python, SQL'
