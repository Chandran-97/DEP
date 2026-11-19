let charts={};let allEmployees=[];let version=null;let busy=false;let selectedClient="";
const $=id=>document.getElementById(id);const palette=['#7769d8','#28a77a','#e9a24c','#5794dc','#d96f83','#7b8ca8','#45b7b1'];
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function api(url){const r=await fetch(url,{cache:'no-store'});if(r.status===401){location.href='/login';throw Error('Session expired. Please sign in again.');}const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.detail||`Request failed (${r.status})`);return d;}
function showError(msg){$('error').textContent=msg;$('error').classList.remove('d-none');}
function hideError(){$('error').classList.add('d-none');}
function metric(id,value,available=true){$(id).textContent=available?Number(value||0).toLocaleString():'N/A';}
function drawChart(id,type,labels,data,colors=palette){if(charts[id])charts[id].destroy();charts[id]=new Chart($(id),{type,data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:0,borderRadius:type==='bar'?6:0,hoverOffset:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#202741',padding:10,cornerRadius:8}},...(type==='bar'?{indexAxis:'y',scales:{x:{grid:{color:'#f0f2f7'},ticks:{font:{size:9},color:'#9aa3b3'}},y:{grid:{display:false},ticks:{font:{size:9},color:'#657087'}}}}:{cutout:'70%'})}});}
function renderDist(id,items){const el=$(id);if(!items?.length){el.innerHTML='<div class="empty-state">No source data available</div>';return;}el.innerHTML=items.slice(0,6).map((x,i)=>`<div class="status-row"><span class="status-label"><i class="status-dot" style="background:${palette[i%palette.length]}"></i>${esc(x.label)}</span><b class="status-count">${x.count}</b></div>`).join('');}
function renderClientDistribution(items){
 const host=$('client-distribution');
 const clients=(items||[]).filter(x=>x.label&&x.label!=='Not provided').sort((a,b)=>b.count-a.count);
 $('total-clients').textContent=clients.length.toLocaleString();
 if(!clients.length){host.innerHTML='<div class="empty-state">No client names found in the workbook.</div>';return;}
 const max=Math.max(...clients.map(x=>x.count),1);
 host.innerHTML=clients.map((x,i)=>`<button type="button" class="client-row ${selectedClient===x.label?'selected':''}" data-client="${esc(x.label)}"><span class="client-row-top"><span class="client-name"><i class="status-dot" style="background:${palette[i%palette.length]}"></i>${esc(x.label)}</span><b>${x.count.toLocaleString()} employees</b></span><span class="client-bar-track"><span class="client-bar-fill" style="width:${Math.max(3,(x.count/max)*100)}%;background:${palette[i%palette.length]}"></span></span></button>`).join('');
 host.querySelectorAll('.client-row').forEach(btn=>btn.addEventListener('click',()=>{selectedClient=selectedClient===btn.dataset.client?'':btn.dataset.client;renderClientDistribution(items);renderEmployees();if(selectedClient){document.querySelector('#people').scrollIntoView({behavior:'smooth',block:'start'});}}));
}
function renderQuality(summary){const rows=[['Certification status',summary.certification_available],['Billability status',summary.billability_available],['Work status',summary.work_status_available],['Allocation status',summary.allocation_available],['Idle start date',summary.idle_date_available]];$('data-quality').innerHTML=rows.map(([n,ok])=>`<div class="quality-row"><span>${n}</span><span class="quality-state ${ok?'available':'missing'}">${ok?'● Available':'● Not in workbook'}</span></div>`).join('');}
const tableColumns=[
  ['serial_number','#'],['employee_id','Employee ID'],['name','Employee Name'],['technical_skills','Technical Skills'],['yoe','YOE'],['email','Email'],['doj_dep','DOJ DEP'],['internal_external','Internal/External'],['project','Mapped to Project'],['billable_from','Billable from'],['client_name','Client Name'],['certification','Certification Name'],['certification_completion_date','Date of Completion'],['certification_expected_date','Expected Date of Completion'],['profiles_uploaded','Profiles Uploaded'],['contact_number','Contact Number']
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
 const rows=allEmployees.filter(e=>(!selectedClient||String(e.client_name??'').trim()===selectedClient)&&active.every(([k,v])=>String(e[k]??'')===v)).filter(e=>!q||tableColumns.some(([k])=>String(e[k]??'').toLowerCase().includes(q)));
 $('result-count').textContent=`${rows.length} employees`;
 $('table-foot').textContent=`Showing ${rows.length} of ${allEmployees.length} employee records · Filter any of the ${tableColumns.length} source columns · Missing values are shown as Not provided`;
 $('employee-rows').innerHTML=rows.length?rows.map(e=>`<tr>${tableColumns.map(([key])=>`<td>${esc(e[key]??'Not provided')||'Not provided'}</td>`).join('')}</tr>`).join(''):'<tr><td colspan="16" class="empty-state">No employees match these filters.</td></tr>';
}
async function refresh(){if(busy)return;busy=true;try{hideError();const data=await api('/api/dashboard/overview');const s=data.summary;allEmployees=data.employees;metric('total',s.total_employees);metric('locations',s.locations);metric('certified',s.certified,s.certification_available);metric('billable',s.billable,s.billability_available);metric('working',s.working,s.work_status_available);metric('idle',s.long_idle,s.idle_date_available);$('certified-foot').textContent=s.certification_available?`${s.certification_not_completed} not completed`:'Certification status not supplied';$('billable-foot').textContent=s.billability_available?`${s.non_billable} non-billable`:'Billability not supplied';$('working-foot').textContent=s.work_status_available?`${s.not_working} not working`:'Work status not supplied';$('idle-foot').textContent=s.idle_date_available?'Idle for 30 days or more':'Idle start date not supplied';drawChart('locationChart','bar',data.by_location.map(x=>x.label),data.by_location.map(x=>x.count));const cert=data.by_certification.filter(x=>x.label!=='Not provided');drawChart('certChart','doughnut',cert.map(x=>x.label),cert.map(x=>x.count));$('cert-legend').innerHTML=cert.length?cert.slice(0,4).map((x,i)=>`<span><i class="legend-dot" style="background:${palette[i]}"></i>${esc(x.label)} (${x.count})</span>`).join(''):'<span>Certification status not provided in source</span>';const bill=data.by_billability.filter(x=>x.label!=='Not provided');drawChart('billChart','doughnut',bill.map(x=>x.label),bill.map(x=>x.count));$('bill-legend').innerHTML=bill.length?bill.slice(0,4).map((x,i)=>`<span><i class="legend-dot" style="background:${palette[i]}"></i>${esc(x.label)} (${x.count})</span>`).join(''):'<span>Billability not provided in source</span>';window.lastClientDistribution=data.by_client;renderClientDistribution(data.by_client);renderDist('allocation-status',data.by_allocation);renderQuality(s);if(!$('column-filters').children.length)buildColumnFilters();fillColumnFilters();renderEmployees();version=data.version;$('last-updated').textContent=`Last read ${new Date().toLocaleTimeString()}`;}catch(e){showError(e.message);}finally{busy=false;}}
buildColumnFilters();$('search').addEventListener('input',renderEmployees);$('clear-filters').addEventListener('click',()=>{$('search').value='';selectedClient='';document.querySelectorAll('.column-filter').forEach(x=>x.value='');renderClientDistribution(window.lastClientDistribution||[]);renderEmployees();});$('refresh-dashboard').addEventListener('click',refresh);$('logout').addEventListener('click',async()=>{await fetch('/api/auth/logout',{method:'POST'});location.href='/login';});
refresh();setInterval(async()=>{try{const v=await api('/api/dashboard/version');if(version!==null&&v.version!==version)await refresh();}catch(e){showError(e.message);}},10000);
