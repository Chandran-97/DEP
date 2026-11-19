let charts = {};
let allEmployees = [];
let version = null;
let busy = false;
let selectedClient = "";
let activeKpi = null;

const $ = id => document.getElementById(id);

const palette = [
    '#7769d8',
    '#28a77a',
    '#e9a24c',
    '#5794dc',
    '#d96f83',
    '#7b8ca8',
    '#45b7b1'
];

function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

async function api(url) {
    const r = await fetch(url, { cache: 'no-store' });

    if (r.status === 401) {
        location.href = '/login';
        throw Error('Session expired. Please sign in again.');
    }

    const d = await r.json().catch(() => ({}));

    if (!r.ok) {
        throw Error(d.detail || `Request failed (${r.status})`);
    }

    return d;
}

function showError(msg) {
    $('error').textContent = msg;
    $('error').classList.remove('d-none');
}

function hideError() {
    $('error').classList.add('d-none');
}

function metric(id, value, available = true) {
    $(id).textContent = available
        ? Number(value || 0).toLocaleString()
        : 'N/A';
}

function drawChart(id, type, labels, data, colors = palette) {
    if (charts[id]) {
        charts[id].destroy();
    }

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
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#202741',
                    padding: 10,
                    cornerRadius: 8
                }
            },
            ...(type === 'bar'
                ? {
                    indexAxis: 'y',
                    scales: {
                        x: {
                            grid: {
                                color: '#f0f2f7'
                            },
                            ticks: {
                                font: {
                                    size: 9
                                },
                                color: '#9aa3b3'
                            }
                        },
                        y: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: {
                                    size: 9
                                },
                                color: '#657087'
                            }
                        }
                    }
                }
                : {
                    cutout: '70%'
                })
        }
    });
}

function renderDist(id, items) {
    const el = $(id);

    if (!items?.length) {
        el.innerHTML = '<div class="empty-state">No source data available</div>';
        return;
    }

    el.innerHTML = items.slice(0, 6).map((x, i) => `
        <div class="status-row">
            <span class="status-label">
                <i class="status-dot" style="background:${palette[i % palette.length]}"></i>
                ${esc(x.label)}
            </span>
            <b class="status-count">${x.count}</b>
        </div>
    `).join('');
}

function renderClientDistribution(items) {
    const host = $('client-distribution');

    const clients = (items || [])
        .filter(x => x.label && x.label !== 'Not provided')
        .sort((a, b) => b.count - a.count);

    $('total-clients').textContent = clients.length.toLocaleString();

    if (!clients.length) {
        host.innerHTML = '<div class="empty-state">No client names found in the workbook.</div>';
        return;
    }

    const max = Math.max(...clients.map(x => x.count), 1);

    host.innerHTML = clients.map((x, i) => `
        <button type="button"
            class="client-row ${selectedClient === x.label ? 'selected' : ''}"
            data-client="${esc(x.label)}">

            <span class="client-row-top">
                <span class="client-name">
                    <i class="status-dot" style="background:${palette[i % palette.length]}"></i>
                    ${esc(x.label)}
                </span>
                <b>${x.count.toLocaleString()} employees</b>
            </span>

            <span class="client-bar-track">
                <span class="client-bar-fill"
                    style="width:${Math.max(3, (x.count / max) * 100)}%;background:${palette[i % palette.length]}">
                </span>
            </span>

        </button>
    `).join('');

    host.querySelectorAll('.client-row').forEach(btn => {
        btn.addEventListener('click', () => {
            selectedClient = selectedClient === btn.dataset.client
                ? ''
                : btn.dataset.client;

            renderClientDistribution(items);
            renderEmployees();

            if (selectedClient) {
                document.querySelector('#people').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function renderQuality(summary) {
    const rows = [
        ['Certification status', summary.certification_available],
        ['Billability status', summary.billability_available],
        ['Work status', summary.work_status_available],
        ['Allocation status', summary.allocation_available],
        ['Idle start date', summary.idle_date_available]
    ];

    $('data-quality').innerHTML = rows.map(([n, ok]) => `
        <div class="quality-row">
            <span>${n}</span>
            <span class="quality-state ${ok ? 'available' : 'missing'}">
                ${ok ? '● Available' : '● Not in workbook'}
            </span>
        </div>
    `).join('');
}

const tableColumns = [
    ['serial_number', '#'],
    ['employee_id', 'Employee ID'],
    ['name', 'Employee Name'],
    ['technical_skills', 'Technical Skills'],
    ['yoe', 'YOE'],
    ['email', 'Email'],
    ['doj_dep', 'DOJ DEP'],
    ['internal_external', 'Internal/External'],
    ['project', 'Mapped to Project'],
    ['billable_from', 'Billable from'],
    ['client_name', 'Client Name'],
    ['certification', 'Certification Name'],
    ['certification_completion_date', 'Date of Completion'],
    ['certification_expected_date', 'Expected Date of Completion'],
    ['profiles_uploaded', 'Profiles Uploaded'],
    ['bgv_status', 'BGV Status'],
    ['contact_number', 'Contact Number']
];

function buildColumnFilters() {
    const host = $('column-filters');

    host.innerHTML = tableColumns.map(([key, label]) => `
        <select class="filter-control column-filter"
            data-key="${key}"
            aria-label="Filter ${label}">
            <option value="">All ${label}</option>
        </select>
    `).join('');

    host.querySelectorAll('select').forEach(el => {
        el.addEventListener('change', renderEmployees);
    });
}

function fillColumnFilters() {
    document.querySelectorAll('.column-filter').forEach(select => {
        const key = select.dataset.key;
        const selected = select.value;

        const values = [
            ...new Set(
                allEmployees
                    .map(e => String(e[key] ?? '').trim())
                    .filter(v => v && v !== 'Not provided')
            )
        ].sort((a, b) => a.localeCompare(
            b,
            undefined,
            {
                numeric: true,
                sensitivity: 'base'
            }
        ));

        select.innerHTML = `
            <option value="">All ${tableColumns.find(c => c[0] === key)[1]}</option>
        ` + values.map(v => `
            <option value="${esc(v)}">${esc(v)}</option>
        `).join('');

        if (values.includes(selected)) {
            select.value = selected;
        }
    });
}

function normStatus(v) {
    return String(v ?? '')
        .trim()
        .toLowerCase()
        .replace(/[_ ]+/g, ' ');
}

function matchesKpi(e) {
    const cert = normStatus(e.certification_status);
    const bill = normStatus(e.billable_status);
    const bgv = normStatus(e.bgv_status);

    // Total Employees: include every employee record
    if (activeKpi === 'total') {
        return true;
    }

    if (activeKpi === 'certified') {
        return cert === 'completed' ||
            cert === 'certified' ||
            cert === 'yes' ||
            cert === 'y';
    }

    if (activeKpi === 'billable') {
        return ['billable', 'yes', 'y', 'true', '1'].includes(bill);
    }

    if (activeKpi === 'non_billable') {
        return [
            'non-billable',
            'non billable',
            'no',
            'n',
            'false',
            '0',
            'not billable',
            'not yet billable',
            'pending',
            'future'
        ].includes(bill);
    }

    if (activeKpi === 'bgv_pending') {
        return ['pending', 'bgv pending'].includes(bgv);
    }

    return true;
}

function renderEmployees() {
    const q = $('search').value.trim().toLowerCase();

    const active = [
        ...document.querySelectorAll('.column-filter')
    ]
        .filter(x => x.value)
        .map(x => [x.dataset.key, x.value]);

    const rows = allEmployees.filter(e =>
        (!selectedClient ||
            String(e.client_name ?? '').trim() === selectedClient) &&
        matchesKpi(e) &&
        active.every(([k, v]) => String(e[k] ?? '') === v) &&
        (!q || tableColumns.some(([k]) =>
            String(e[k] ?? '').toLowerCase().includes(q)
        ))
    );

    $('result-count').textContent = `${rows.length} employees`;

    $('table-foot').textContent =
        `Showing ${rows.length} of ${allEmployees.length} employee records` +
        `${activeKpi ? ` · KPI: ${activeKpi.replaceAll('_', ' ')}` : ''}` +
        `${selectedClient ? ` · Client: ${selectedClient}` : ''}` +
        ` · Filter source columns · Missing values shown as Not provided`;

    $('employee-rows').innerHTML = rows.length
        ? rows.map(e => `
            <tr>
                ${tableColumns.map(([key]) => `
                    <td>${esc(e[key] ?? 'Not provided') || 'Not provided'}</td>
                `).join('')}
            </tr>
        `).join('')
        : `
            <tr>
                <td colspan="17" class="empty-state">
                    No employees match these filters.
                </td>
            </tr>
        `;
}

function setupKpiCards() {
    document.querySelectorAll('[data-kpi]').forEach(card => {
        const activate = () => {
            activeKpi = activeKpi === card.dataset.kpi
                ? null
                : card.dataset.kpi;

            document.querySelectorAll('[data-kpi]').forEach(c => {
                c.classList.toggle(
                    'selected',
                    c.dataset.kpi === activeKpi
                );
            });

            renderEmployees();

            if (activeKpi) {
                document.querySelector('#people').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        };

        card.addEventListener('click', activate);

        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                activate();
            }
        });
    });
}

async function refresh() {
    if (busy) return;

    busy = true;

    try {
        hideError();

        const data = await api('/api/dashboard/overview');
        const s = data.summary;

        allEmployees = data.employees || [];

        // TOTAL EMPLOYEES KPI
        metric('total-employees', allEmployees.length);

        // EXISTING KPI COUNTS
        metric('certified', s.certified, s.certification_available);
        metric('billable', s.billable, s.billability_available);
        metric('non-billable', s.non_billable, s.billability_available);
        metric('bgv-pending', s.bgv_pending, s.bgv_status_available);

        // KPI FOOTERS
        $('certified-foot').textContent = s.certification_available
            ? `${s.certification_not_completed || 0} not completed`
            : 'Certification status not supplied';

        $('billable-foot').textContent = s.billability_available
            ? `${s.non_billable || 0} non-billable`
            : 'Billability not supplied';

        $('non-billable-foot').textContent = s.billability_available
            ? `${s.billable || 0} billable`
            : 'Billability not supplied';

        $('bgv-pending-foot').textContent = s.bgv_status_available
            ? 'BGV marked Pending'
            : 'BGV Status column not supplied';

        // EMPLOYEES BY LOCATION
        drawChart(
            'locationChart',
            'bar',
            data.by_location.map(x => x.label),
            data.by_location.map(x => x.count)
        );

        // CERTIFICATION CHART
        const cert = data.by_certification.filter(
            x => x.label !== 'Not provided'
        );

        drawChart(
            'certChart',
            'doughnut',
            cert.map(x => x.label),
            cert.map(x => x.count)
        );

        $('cert-legend').innerHTML = cert.length
            ? cert.slice(0, 4).map((x, i) => `
                <span>
                    <i class="legend-dot" style="background:${palette[i]}"></i>
                    ${esc(x.label)} (${x.count})
                </span>
            `).join('')
            : '<span>Certification status not provided in source</span>';

        // BILLABILITY CHART
        const bill = data.by_billability.filter(
            x => x.label !== 'Not provided'
        );

        drawChart(
            'billChart',
            'doughnut',
            bill.map(x => x.label),
            bill.map(x => x.count)
        );

        $('bill-legend').innerHTML = bill.length
            ? bill.slice(0, 4).map((x, i) => `
                <span>
                    <i class="legend-dot" style="background:${palette[i]}"></i>
                    ${esc(x.label)} (${x.count})
                </span>
            `).join('')
            : '<span>Billability not provided in source</span>';

        // CLIENT DISTRIBUTION AND OTHER PANELS
        window.lastClientDistribution = data.by_client;

        renderClientDistribution(data.by_client);
        renderDist('allocation-status', data.by_allocation);
        renderQuality(s);

        // FILTERS AND EMPLOYEE DIRECTORY
        if (!$('column-filters').children.length) {
            buildColumnFilters();
        }

        fillColumnFilters();
        renderEmployees();

        // DATA VERSION
        version = data.version;

        $('last-updated').textContent =
            `Last read ${new Date().toLocaleTimeString()}`;

    } catch (e) {
        showError(e.message);
    } finally {
        busy = false;
    }
}


// INITIAL SETUP

buildColumnFilters();

setupKpiCards();

$('search').addEventListener('input', renderEmployees);


// CLEAR FILTERS

$('clear-filters').addEventListener('click', () => {
    $('search').value = '';
    selectedClient = '';
    activeKpi = null;

    document.querySelectorAll('.column-filter').forEach(x => {
        x.value = '';
    });

    document.querySelectorAll('[data-kpi]').forEach(card => {
        card.classList.remove('selected');
    });

    renderClientDistribution(
        window.lastClientDistribution || []
    );

    renderEmployees();
});


// REFRESH BUTTON

$('refresh-dashboard').addEventListener('click', refresh);


// LOGOUT

$('logout').addEventListener('click', async () => {
    await fetch('/api/auth/logout', {
        method: 'POST'
    });

    location.href = '/login';
});


// INITIAL LOAD

refresh();


// AUTOMATIC DATA REFRESH

setInterval(async () => {
    try {
        const v = await api('/api/dashboard/version');

        if (version !== null && v.version !== version) {
            await refresh();
        }

    } catch (e) {
        showError(e.message);
    }

}, 10000);