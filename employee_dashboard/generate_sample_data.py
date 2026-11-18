"""Generate clearly synthetic demo employees. Never use this file as real workforce data."""
from pathlib import Path
import random
import pandas as pd
random.seed(41)
first=['Aarav','Ananya','Ishaan','Diya','Rohan','Meera','Arjun','Kavya','Nikhil','Priya','Vikram','Sneha','Aditya','Aisha','Rahul','Maya']
last=['Sharma','Iyer','Reddy','Nair','Patel','Das','Rao','Khan','Menon','Gupta','Joshi','Pillai']
locations=['Coimbatore','Chennai','Bengaluru','Hyderabad','Pune','Mumbai','Kochi']
managers=['Kumar R','Anita S','Suresh M','Farah K','Senthil R']
projects=['Mastercard','Healthcare Lakehouse','Data Platform','Internal','Retail Analytics']
certs=['Databricks','AWS','Azure','Apache Spark','Snowflake','Power BI']
rows=[]
for i in range(1,101):
    name=f'{random.choice(first)} {random.choice(last)}'
    cert_status=random.choices(['Completed','Not Completed','In Progress'],[.48,.32,.20])[0]
    cert=random.choice(certs) if cert_status!='Not Completed' else ''
    bill=random.choices(['Billable','Non-Billable','Not provided'],[.62,.30,.08])[0]
    work=random.choices(['Working','Not Working'],[.91,.09])[0]
    allocation=random.choices(['Allocated','Bench','Unallocated'],[.78,.14,.08])[0]
    idle=''
    if allocation in ('Bench','Unallocated'):
        idle=(pd.Timestamp.today()-pd.Timedelta(days=random.randint(4,110))).strftime('%Y-%m-%d')
    rows.append({'S.no':i,'Employee ID':f'FD{16000+i:05d}','Employee Name':name,'Managers':random.choice(managers),'Email':f'{name.lower().replace(" ",".")}@example.demo','Department':random.choice(['Data Engineering','Analytics','Platform','Cloud']), 'Mapped to Project':random.choice(projects) if allocation=='Allocated' else '', 'Location':random.choice(locations),'Certification':cert,'Certification Status':cert_status,'Billable Status':bill,'Work Status':work,'Allocation Status':allocation,'Idle Since':idle,'Contact Number':f'90000{i:05d}'})
p=Path(__file__).parent/'data'/'employees.xlsx';p.parent.mkdir(exist_ok=True);pd.DataFrame(rows).to_excel(p,index=False);print(f'Created {len(rows)} synthetic demo records: {p}')
