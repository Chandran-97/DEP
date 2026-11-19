// let charts={};let allEmployees=[];let version=null;let busy=false;let activeKpi=null;
let charts = {};
let allEmployees = [];
let version = null;
let busy = false;
let activeKpi = null;
let activeLocation = null;
const $=id=>document.getElementById(id);const palette=['#7769d8','#28a77a','#e9a24c','#5794dc','#d96f83','#7b8ca8','#45b7b1'];
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function api(url){const r=await fetch(url,{cache:'no-store'});if(r.status===401){location.href='/login';throw Error('Session expired. Please sign in again.');}const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.detail||`Request failed (${r.status})`);return d;}
function showError(msg){$('error').textContent=msg;$('error').classList.remove('d-none');}
function hideError(){$('error').classList.add('d-none');}
function metric(id,value,available=true){$(id).textContent=available?Number(value||0).toLocaleString():'N/A';}
// function drawChart(id,type,labels,data,colors=palette){if(charts[id])charts[id].destroy();charts[id]=new Chart($(id),{type,data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:0,borderRadius:type==='bar'?6:0,hoverOffset:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#202741',padding:10,cornerRadius:8}},...(type==='bar'?{indexAxis:'y',scales:{x:{grid:{color:'#f0f2f7'},ticks:{font:{size:9},color:'#9aa3b3'}},y:{grid:{display:false},ticks:{font:{size:9},color:'#657087'}}}}:{cutout:'70%'})}});}
function drawChart(id, type, labels, data, colors = palette) {
    if (charts[id]) charts[id].destroy();

    charts[id] = new Chart($(id), {
        type,
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 0,
                borderRadius: type === 'bar' ? 6 : 0,
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#202741',
                    padding: 10,
                    cornerRadius: 8
                }
            },

            ...(type === 'bar' ? {
                indexAxis: 'y',

                // Make location bars clickable
                onClick: function (event, elements, chart) {
                    if (chart.canvas.id !== 'locationChart') return;

                    if (!elements.length) return;

                    const index = elements[0].index;
                    const clickedLocation = chart.data.labels[index];

                    activeLocation =
                        activeLocation === clickedLocation
                            ? null
                            : clickedLocation;

                    renderEmployees();

                    document.getElementById('people')
                        .scrollIntoView({ behavior: 'smooth' });
                },

                scales: {
                    x: {
                        grid: { color: '#f0f2f7' },
                        ticks: {
                            font: { size: 9 },
                            color: '#9aa3b3'
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            font: { size: 9 },
                            color: '#657087'
                        }
                    }
                }
            } : {
                cutout: '70%'
            })
        }
    });
}
function renderDist(id,items){const el=$(id);if(!items?.length){el.innerHTML='<div class="empty-state">No source data available</div>';return;}el.innerHTML=items.slice(0,6).map((x,i)=>`<div class="status-row"><span class="status-label"><i class="status-dot" style="background:${palette[i%palette.length]}"></i>${esc(x.label)}</span><b class="status-count">${x.count}</b></div>`).join('');}
function renderQuality(summary){const rows=[['Certification status',summary.certification_available],['Billability status',summary.billability_available],['Work status',summary.work_status_available],['Allocation status',summary.allocation_available],['Idle start date',summary.idle_date_available]];$('data-quality').innerHTML=rows.map(([n,ok])=>`<div class="quality-row"><span>${n}</span><span class="quality-state ${ok?'available':'missing'}">${ok?'● Available':'● Not in workbook'}</span></div>`).join('');}
const tableColumns=[
  ['serial_number','#'],['employee_id','Employee ID'],['name','Employee Name'],['technical_skills','Technical Skills'],['yoe','YOE'],['email','Email'],['doj_dep','DOJ DEP'],['internal_external','Internal/External'],['project','Mapped to Project'],['billable_from','Billable from'],['client_name','Client Name'],['certification','Certification Name'],['certification_completion_date','Date of Completion'],['certification_expected_date','Expected Date of Completion'],['profiles_uploaded','Profiles Uploaded'],['contact_number','Contact Number'],['bgv_status','BGV Status']
];
function buildColumnFilters(){
 const host=$('column-filters');
 host.innerHTML=tableColumns.map(([key,label])=>`<select class="filter-control column-filter" data-key="${key}" aria-label="Filter ${label}"><option value="">All ${label}</option></select>`).join('');
 host.querySelectorAll('select').forEach(el=>el.addEventListener('change',renderEmployees));
}
function fillColumnFilters(){
 document.querySelectorAll('.column-filter').forEach(select=>{
   const key=select.dataset.key, selected=select.value;
   const values=[...new Set(allEmployees.map(e=>String(e[key]??'').trim()).filter(v=>v && v!=='Not provided'))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
   select.innerHTML=`<option value="">All ${tableColumns.find(c=>c[0]===key)[1]}</option>`+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
   if(values.includes(selected))select.value=selected;
 });
}
function renderEmployees(){
 const q=$('search').value.trim().toLowerCase();
 const active=[...document.querySelectorAll('.column-filter')].filter(x=>x.value).map(x=>[x.dataset.key,x.value]);
//  let rows=allEmployees.filter(e=>active.every(([k,v])=>String(e[k]??'')===v)).filter(e=>!q||tableColumns.some(([k])=>String(e[k]??'').toLowerCase().includes(q)));
let rows = allEmployees
    .filter(e => active.every(([k, v]) => String(e[k] ?? '') === v))
    .filter(e => !activeLocation || String(e.location ?? '').trim() === activeLocation)
    .filter(e => !q || tableColumns.some(([k]) =>
        String(e[k] ?? '').toLowerCase().includes(q)
    ));
 if(activeKpi==='certified') rows=rows.filter(e=>String(e.certification_status||'').toLowerCase()==='completed');
 if(activeKpi==='billable') rows=rows.filter(e=>['billable','yes','y','true','1'].includes(String(e.billable_status||'').toLowerCase()));
 if(activeKpi==='non_billable') rows=rows.filter(e=>['not yet billable','non-billable','non billable','no','n','false','0','not billable','pending','future'].includes(String(e.billable_status||'').toLowerCase()));
 if(activeKpi==='bgv_pending') rows=rows.filter(e=>['pending','bgv pending'].includes(String(e.bgv_status||'').trim().toLowerCase()));
 $('result-count').textContent=`${rows.length} employees`;
//  $('table-foot').textContent=`Showing ${rows.length} of ${allEmployees.length} employee records · ${activeKpi?`KPI filter: ${activeKpi.replaceAll('_',' ')}`:'All KPI categories'} · Missing values are shown as Not provided`;
$('table-foot').textContent =
    `Showing ${rows.length} of ${allEmployees.length} employee records`
    + (activeLocation ? ` · Location: ${activeLocation}` : '')
    + (activeKpi ? ` · KPI filter: ${activeKpi.replaceAll('_', ' ')}` : '')
    + ' · Missing values are shown as Not provided';
 $('result-count').textContent=`${rows.length} employees${activeKpi?' · filtered':''}`;
 window.filteredEmployeeRows=rows;
 $('employee-rows').innerHTML=rows.length?rows.map(e=>`<tr>${tableColumns.map(([key])=>`<td>${esc(e[key]??'Not provided')||'Not provided'}</td>`).join('')}</tr>`).join(''):'<tr><td colspan="16" class="empty-state">No employees match these filters.</td></tr>';
}
async function refresh(){if(busy)return;busy=true;try{hideError();const data=await api('/api/dashboard/overview');const s=data.summary;allEmployees=data.employees;metric('total',s.total_employees);metric('locations',s.locations);metric('certified',s.certified,s.certification_available);metric('billable',s.billable,s.billability_available);metric('non-billable',s.non_billable,s.billability_available);metric('bgv-pending',s.bgv_pending,s.bgv_status_available);$('certified-foot').textContent=s.certification_available?`${s.certification_not_completed} not completed`:'Certification status not supplied';$('billable-foot').textContent=s.billability_available?`${s.non_billable} non-billable`:'Billability not supplied';$('non-billable-foot').textContent=s.billability_available?'Click to view non-billable employees':'Billability not supplied';$('bgv-pending-foot').textContent=s.bgv_status_available?'Click to view BGV pending employees':'Add BGV Status column to Excel';drawChart('locationChart','bar',data.by_location.map(x=>x.label),data.by_location.map(x=>x.count));const cert=data.by_certification.filter(x=>x.label!=='Not provided');drawChart('certChart','doughnut',cert.map(x=>x.label),cert.map(x=>x.count));$('cert-legend').innerHTML=cert.length?cert.slice(0,4).map((x,i)=>`<span><i class="legend-dot" style="background:${palette[i]}"></i>${esc(x.label)} (${x.count})</span>`).join(''):'<span>Certification status not provided in source</span>';const bill=data.by_billability.filter(x=>x.label!=='Not provided');drawChart('billChart','doughnut',bill.map(x=>x.label),bill.map(x=>x.count));$('bill-legend').innerHTML=bill.length?bill.slice(0,4).map((x,i)=>`<span><i class="legend-dot" style="background:${palette[i]}"></i>${esc(x.label)} (${x.count})</span>`).join(''):'<span>Billability not provided in source</span>';renderDist('work-status',data.by_work_status);renderDist('allocation-status',data.by_allocation);renderQuality(s);if(!$('column-filters').children.length)buildColumnFilters();fillColumnFilters();renderEmployees();version=data.version;$('last-updated').textContent=`Last read ${new Date().toLocaleTimeString()}`;}catch(e){showError(e.message);}finally{busy=false;}}
buildColumnFilters();$('search').addEventListener('input',renderEmployees);document.querySelectorAll('[data-kpi]').forEach(btn=>btn.addEventListener('click',()=>{activeKpi=activeKpi===btn.dataset.kpi?null:btn.dataset.kpi;document.querySelectorAll('[data-kpi]').forEach(x=>x.classList.toggle('selected',x.dataset.kpi===activeKpi));renderEmployees();document.getElementById('people').scrollIntoView({behavior:'smooth'});}));
$('export-excel').addEventListener('click',async()=>{const rows=window.filteredEmployeeRows||[];if(!rows.length){showError('No employee rows to export.');return;}try{const r=await fetch('/api/employees/export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows})});if(!r.ok){const e=await r.json().catch(()=>({}));throw Error(e.detail||'Excel export failed');}const blob=await r.blob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='DEP_filtered_employees.xlsx';a.click();URL.revokeObjectURL(url);}catch(e){showError(e.message);}});
// $('clear-filters').addEventListener('click',()=>{activeKpi=null;document.querySelectorAll('[data-kpi]').forEach(x=>x.classList.remove('selected'));$('search').value='';document.querySelectorAll('.column-filter').forEach(x=>x.value='');renderEmployees();});$('refresh-dashboard').addEventListener('click',refresh);$('logout').addEventListener('click',async()=>{await fetch('/api/auth/logout',{method:'POST'});location.href='/login';});
$('clear-filters').addEventListener('click', () => {
    activeKpi = null;
    activeLocation = null;

    document.querySelectorAll('[data-kpi]')
        .forEach(x => x.classList.remove('selected'));

    $('search').value = '';

    document.querySelectorAll('.column-filter')
        .forEach(x => x.value = '');

    renderEmployees();
});
refresh();setInterval(async()=>{try{const v=await api('/api/dashboard/version');if(version!==null&&v.version!==version)await refresh();}catch(e){showError(e.message);}},10000);
