let charts = {};
let allEmployees = [];
let version = null;
let busy = false;

let activeKpi = null;
let activeLocation = null;
let activeYoeRange = null;

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

/* =========================
   GENERAL UTILITIES
========================= */

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

/* =========================
   YOE UTILITIES
========================= */

function getYoeValue(employee) {
    const raw =
        employee.yoe ??
        employee.YOE ??
        employee.years_of_experience ??
        employee.experience ??
        employee['Years of Experience'];

    if (
        raw === null ||
        raw === undefined ||
        String(raw).trim() === '' ||
        String(raw).trim().toLowerCase() === 'not provided'
    ) {
        return null;
    }

    const parsed = parseFloat(
        String(raw).replace(/[^\d.]/g, '')
    );

    return Number.isFinite(parsed) ? parsed : null;
}

function matchesYoeRange(employee, range) {
    const years = getYoeValue(employee);

    if (years === null) return false;

    switch (range) {
        case '0–2 Years':
            return years >= 0 && years <= 2;

        case '3–5 Years':
            return years > 2 && years <= 5;

        case '6–10 Years':
            return years > 5 && years <= 10;

        case '11–15 Years':
            return years > 10 && years <= 15;

        case '16+ Years':
            return years > 15;

        default:
            return true;
    }
}

/* =========================
   CHART RENDERING
========================= */

function drawChart(id, type, labels, data, colors = palette) {
    const canvas = $(id);

    if (!canvas) return;

    if (charts[id]) {
        charts[id].destroy();
    }

    charts[id] = new Chart(canvas, {
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

            ...(type === 'bar' ? {
                indexAxis: 'y',

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

                    $('people').scrollIntoView({
                        behavior: 'smooth'
                    });
                },

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
            } : {
                cutout: '70%'
            })
        }
    });
}

/* =========================
   YEARS OF EXPERIENCE CHART
========================= */

function renderYoeChart(employees) {
    const canvas = $('yoeChart');

    if (!canvas) return;

    if (charts.yoeChart) {
        charts.yoeChart.destroy();
    }

    const labels = [
        '0–2 Years',
        '3–5 Years',
        '6–10 Years',
        '11–15 Years',
        '16+ Years'
    ];

    const counts = [0, 0, 0, 0, 0];

    let missing = 0;

    employees.forEach(employee => {
        const years = getYoeValue(employee);

        if (years === null) {
            missing++;
        } else if (years >= 0 && years <= 2) {
            counts[0]++;
        } else if (years > 2 && years <= 5) {
            counts[1]++;
        } else if (years > 5 && years <= 10) {
            counts[2]++;
        } else if (years > 10 && years <= 15) {
            counts[3]++;
        } else if (years > 15) {
            counts[4]++;
        }
    });

    const baseColors = [
        '#7769d8',
        '#28a77a',
        '#5794dc',
        '#e9a24c',
        '#d96f83'
    ];

    const selectedIndex = labels.indexOf(activeYoeRange);

    const displayColors = baseColors.map((color, index) => {
        if (selectedIndex === -1) return color;

        return index === selectedIndex
            ? color
            : color + '66';
    });

    charts.yoeChart = new Chart(canvas, {
        type: 'bar',

        data: {
            labels,

            datasets: [{
                label: 'Employees',
                data: counts,
                backgroundColor: displayColors,
                borderWidth: 0,
                borderRadius: 8,
                borderSkipped: false,
                barThickness: 35
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            onClick: function (event, elements, chart) {
                if (!elements.length) return;

                const index = elements[0].index;
                const clickedRange = chart.data.labels[index];

                activeYoeRange =
                    activeYoeRange === clickedRange
                        ? null
                        : clickedRange;

                // Re-render the YOE chart to highlight selection
                renderYoeChart(allEmployees);

                // Apply the YOE filter to the employee table
                renderEmployees();

                $('people').scrollIntoView({
                    behavior: 'smooth'
                });
            },

            plugins: {
                legend: {
                    display: false
                },

                tooltip: {
                    backgroundColor: '#202741',
                    padding: 10,
                    cornerRadius: 8,

                    callbacks: {
                        label: context =>
                            `Employees: ${context.raw}`
                    }
                }
            },

            scales: {
                x: {
                    grid: {
                        display: false
                    },

                    ticks: {
                        color: '#8490AA'
                    }
                },

                y: {
                    beginAtZero: true,

                    ticks: {
                        stepSize: 1,
                        color: '#8490AA'
                    },

                    grid: {
                        color: '#EEF1F7'
                    }
                }
            }
        }
    });

    const missingNote = $('yoe-missing-note');

    if (missingNote) {
        missingNote.textContent = missing
            ? `${missing} employees have no YOE value`
            : '';
    }
}

/* =========================
   STATUS DISTRIBUTIONS
========================= */

function renderDist(id, items) {
    const el = $(id);

    if (!items?.length) {
        el.innerHTML =
            '<div class="empty-state">No source data available</div>';
        return;
    }

    el.innerHTML = items.slice(0, 6).map((x, i) =>
        `<div class="status-row">
            <span class="status-label">
                <i class="status-dot"
                   style="background:${palette[i % palette.length]}">
                </i>
                ${esc(x.label)}
            </span>
            <b class="status-count">${x.count}</b>
        </div>`
    ).join('');
}

/* =========================
   DATA QUALITY
========================= */

function renderQuality(summary) {
    const rows = [
        ['Certification status', summary.certification_available],
        ['Billability status', summary.billability_available],
        ['Work status', summary.work_status_available],
        ['Allocation status', summary.allocation_available],
        ['Idle start date', summary.idle_date_available]
    ];

    $('data-quality').innerHTML = rows.map(([name, available]) =>
        `<div class="quality-row">
            <span>${name}</span>
            <span class="quality-state ${available ? 'available' : 'missing'}">
                ${available ? '● Available' : '● Not in workbook'}
            </span>
        </div>`
    ).join('');
}

/* =========================
   EMPLOYEE TABLE COLUMNS
========================= */

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
    ['contact_number', 'Contact Number'],
    ['bgv_status', 'BGV Status']
];

/* =========================
   COLUMN FILTERS
========================= */

function buildColumnFilters() {
    const host = $('column-filters');

    host.innerHTML = tableColumns.map(([key, label]) =>
        `<select class="filter-control column-filter"
                data-key="${key}"
                aria-label="Filter ${label}">
            <option value="">All ${label}</option>
        </select>`
    ).join('');

    host.querySelectorAll('select').forEach(el =>
        el.addEventListener('change', renderEmployees)
    );
}

function fillColumnFilters() {
    document.querySelectorAll('.column-filter').forEach(select => {
        const key = select.dataset.key;
        const selected = select.value;

        const column = tableColumns.find(c => c[0] === key);
        const label = column ? column[1] : key;

        const values = [
            ...new Set(
                allEmployees
                    .map(e => String(e[key] ?? '').trim())
                    .filter(v => v && v !== 'Not provided')
            )
        ].sort((a, b) =>
            a.localeCompare(
                b,
                undefined,
                {
                    numeric: true,
                    sensitivity: 'base'
                }
            )
        );

        select.innerHTML =
            `<option value="">All ${esc(label)}</option>` +
            values.map(v =>
                `<option value="${esc(v)}">${esc(v)}</option>`
            ).join('');

        if (values.includes(selected)) {
            select.value = selected;
        }
    });
}

/* =========================
   EMPLOYEE DIRECTORY
========================= */

function renderEmployees() {
    const q = $('search').value.trim().toLowerCase();

    const active = [
        ...document.querySelectorAll('.column-filter')
    ]
        .filter(x => x.value)
        .map(x => [x.dataset.key, x.value]);

    let rows = allEmployees
        .filter(e =>
            active.every(([key, value]) =>
                String(e[key] ?? '') === value
            )
        )
        .filter(e =>
            !activeLocation ||
            String(e.location ?? '').trim() === activeLocation
        )
        .filter(e =>
            !activeYoeRange ||
            matchesYoeRange(e, activeYoeRange)
        )
        .filter(e =>
            !q ||
            tableColumns.some(([key]) =>
                String(e[key] ?? '').toLowerCase().includes(q)
            )
        );

    if (activeKpi === 'certified') {
        rows = rows.filter(e =>
            String(e.certification_status || '').toLowerCase() === 'completed'
        );
    }

    if (activeKpi === 'billable') {
        rows = rows.filter(e =>
            ['billable', 'yes', 'y', 'true', '1'].includes(
                String(e.billable_status || '').toLowerCase()
            )
        );
    }

    if (activeKpi === 'non_billable') {
        rows = rows.filter(e =>
            [
                'not yet billable',
                'non-billable',
                'non billable',
                'no',
                'n',
                'false',
                '0',
                'not billable',
                'pending',
                'future'
            ].includes(
                String(e.billable_status || '').toLowerCase()
            )
        );
    }

    if (activeKpi === 'bgv_pending') {
        rows = rows.filter(e =>
            ['pending', 'bgv pending'].includes(
                String(e.bgv_status || '').trim().toLowerCase()
            )
        );
    }

    $('result-count').textContent =
        `${rows.length} employees${activeKpi ? ' · filtered' : ''}`;

    $('table-foot').textContent =
        `Showing ${rows.length} of ${allEmployees.length} employee records` +
        (activeLocation ? ` · Location: ${activeLocation}` : '') +
        (activeYoeRange ? ` · YOE: ${activeYoeRange}` : '') +
        (activeKpi ? ` · KPI filter: ${activeKpi.replaceAll('_', ' ')}` : '') +
        ' · Missing values are shown as Not provided';

    // Make filtered data available for Excel export
    window.filteredEmployeeRows = rows;

    $('employee-rows').innerHTML = rows.length
        ? rows.map(e =>
            `<tr>${tableColumns.map(([key]) =>
                `<td>${esc(e[key] ?? 'Not provided') || 'Not provided'}</td>`
            ).join('')}</tr>`
        ).join('')
        : '<tr><td colspan="17" class="empty-state">No employees match these filters.</td></tr>';
}

/* =========================
   DASHBOARD REFRESH
========================= */

async function refresh() {
    if (busy) return;

    busy = true;

    try {
        hideError();

        const data = await api('/api/dashboard/overview');
        const s = data.summary;

        allEmployees = data.employees;

        metric('total', s.total_employees);
        metric('locations', s.locations);
        metric('certified', s.certified, s.certification_available);
        metric('billable', s.billable, s.billability_available);
        metric('non-billable', s.non_billable, s.billability_available);
        metric('bgv-pending', s.bgv_pending, s.bgv_status_available);

        $('certified-foot').textContent =
            s.certification_available
                ? `${s.certification_not_completed} not completed`
                : 'Certification status not supplied';

        $('billable-foot').textContent =
            s.billability_available
                ? `${s.non_billable} non-billable`
                : 'Billability not supplied';

        $('non-billable-foot').textContent =
            s.billability_available
                ? 'Click to view non-billable employees'
                : 'Billability not supplied';

        $('bgv-pending-foot').textContent =
            s.bgv_status_available
                ? 'Click to view BGV pending employees'
                : 'Add BGV Status column to Excel';

        // Location chart
        drawChart(
            'locationChart',
            'bar',
            data.by_location.map(x => x.label),
            data.by_location.map(x => x.count)
        );

        // YOE chart
        renderYoeChart(allEmployees);

        // Billability chart
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
            ? bill.slice(0, 4).map((x, i) =>
                `<span>
                    <i class="legend-dot" style="background:${palette[i]}"></i>
                    ${esc(x.label)} (${x.count})
                </span>`
            ).join('')
            : '<span>Billability not provided in source</span>';

        renderDist('work-status', data.by_work_status);
        renderDist('allocation-status', data.by_allocation);
        renderQuality(s);

        if (!$('column-filters').children.length) {
            buildColumnFilters();
        }

        fillColumnFilters();
        renderEmployees();

        version = data.version;

        $('last-updated').textContent =
            `Last read ${new Date().toLocaleTimeString()}`;

    } catch (e) {
        showError(e.message);

    } finally {
        busy = false;
    }
}

/* =========================
   INITIALIZATION
========================= */

buildColumnFilters();

$('search').addEventListener('input', renderEmployees);

/* KPI FILTERS */

document.querySelectorAll('[data-kpi]').forEach(btn => {
    btn.addEventListener('click', () => {
        activeKpi =
            activeKpi === btn.dataset.kpi
                ? null
                : btn.dataset.kpi;

        document.querySelectorAll('[data-kpi]').forEach(x =>
            x.classList.toggle(
                'selected',
                x.dataset.kpi === activeKpi
            )
        );

        renderEmployees();

        $('people').scrollIntoView({
            behavior: 'smooth'
        });
    });
});

/* =========================
   EXCEL EXPORT
========================= */

$('export-excel').addEventListener('click', async () => {
    const rows = window.filteredEmployeeRows || [];

    if (!rows.length) {
        showError('No employee rows to export.');
        return;
    }

    try {
        const r = await fetch('/api/employees/export', {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({ rows })
        });

        if (!r.ok) {
            const e = await r.json().catch(() => ({}));
            throw Error(e.detail || 'Excel export failed');
        }

        const blob = await r.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'DEP_filtered_employees.xlsx';
        a.click();

        URL.revokeObjectURL(url);

    } catch (e) {
        showError(e.message);
    }
});

/* =========================
   CLEAR ALL FILTERS
========================= */

$('clear-filters').addEventListener('click', () => {
    activeKpi = null;
    activeLocation = null;
    activeYoeRange = null;

    document.querySelectorAll('[data-kpi]').forEach(x =>
        x.classList.remove('selected')
    );

    $('search').value = '';

    document.querySelectorAll('.column-filter').forEach(x =>
        x.value = ''
    );

    // Reset YOE chart highlighting
    renderYoeChart(allEmployees);

    renderEmployees();
});

/* =========================
   REFRESH & LOGOUT
========================= */

$('refresh-dashboard').addEventListener('click', refresh);

$('logout').addEventListener('click', async () => {
    await fetch('/api/auth/logout', {
        method: 'POST'
    });

    location.href = '/login';
});

/* INITIAL LOAD */

refresh();

/* AUTOMATIC WORKBOOK CHECK */

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