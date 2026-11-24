
let charts = {};
let allEmployees = [];
let displayedEmployees = [];
let version = null;
let busy = false;
let selectedClient = "";
let activeKpi = null;
let activeSkill = "";
let activeLocation = null;
let activeYoeRange = null;

const technicalSkills = ['Python', 'DATABRICKS', 'SQL', 'PySpark', 'AWS', 'Azure', 'GCP', 'Cloud'];
const technicalSkillTerms = {
    Python: ['python'],
    SQL: ['sql'],
    DATABRICKS: ['databricks'],
    PySpark: ['pyspark'],
    AWS: ['aws'],
    Azure: ['azure'],
    GCP: ['gcp'],
    Cloud: ['cloud', 'aws', 'azure', 'gcp']
};

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
    const errorElement = $('error');
    if (!errorElement) return;

    errorElement.textContent = msg;
    errorElement.classList.remove('d-none');
}

function hideError() {
    const errorElement = $('error');
    if (errorElement) {
        errorElement.classList.add('d-none');
    }
}

function metric(id, value, available = true) {
    const el = $(id);
    if (!el) return;

    el.textContent = available
        ? Number(value || 0).toLocaleString()
        : 'N/A';
}

// YOE UTILITIES

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

// CHART RENDERING

function drawChart(id, type, labels, data, colors = palette, onDataClick = null) {
    const canvas = $(id);
    if (!canvas || typeof Chart === 'undefined') return;

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
            onClick: (event, elements, chart) => {
                if (!elements.length) return;

                if (onDataClick) {
                    onDataClick(labels[elements[0].index]);
                    return;
                }

                if (id === 'locationChart') {
                    const clickedLocation = labels[elements[0].index];

                    activeLocation =
                        activeLocation === clickedLocation
                            ? null
                            : clickedLocation;

                    renderEmployees();
                    $('people')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            },
            onHover: (event, elements) => {
                if (event.native) {
                    event.native.target.style.cursor =
                        elements.length ? 'pointer' : 'default';
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
                                font: { size: 9 },
                                color: '#9aa3b3'
                            }
                        },
                        y: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                font: { size: 9 },
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

// TECHNICAL SKILLS

function employeeHasSkill(employee, skill) {
    const value = String(employee.technical_skills ?? '');

    return (technicalSkillTerms[skill] || []).some(term =>
        new RegExp(`(^|[^a-z0-9])${term}(?=$|[^a-z0-9])`, 'i').test(value)
    );
}

function renderTechnicalSkills() {
    const counts = technicalSkills.map(skill => ({
        label: skill,
        count: allEmployees.filter(employee =>
            employeeHasSkill(employee, skill)
        ).length
    }));

    drawChart(
        'billChart',
        'doughnut',
        counts.map(item => item.label),
        counts.map(item => item.count),
        palette,
        toggleSkillFilter
    );

    const legend = $('bill-legend');
    if (!legend) return;

    legend.innerHTML = counts.map((item, index) => `
        <button type="button"
            class="skill-legend-button ${activeSkill === item.label ? 'selected' : ''}"
            data-skill="${item.label}"
            aria-pressed="${activeSkill === item.label}">
            <i class="legend-dot" style="background:${palette[index]}"></i>
            ${item.label} (${item.count.toLocaleString()})
        </button>
    `).join('');

    legend.querySelectorAll('.skill-legend-button').forEach(button => {
        button.addEventListener('click', () =>
            toggleSkillFilter(button.dataset.skill)
        );
    });
}

function toggleSkillFilter(skill) {
    activeSkill = activeSkill === skill ? '' : skill;

    document.querySelectorAll('.skill-legend-button').forEach(button => {
        const selected = button.dataset.skill === activeSkill;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
    });

    renderEmployees();

    if (activeSkill) {
        $('people')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// YOE CHART

function renderYoeChart(employees) {
    const canvas = $('yoeChart');
    if (!canvas || typeof Chart === 'undefined') return;

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
        return index === selectedIndex ? color : color + '66';
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

                renderYoeChart(allEmployees);
                renderEmployees();

                $('people')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
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

// CLIENT DISTRIBUTION

function renderClientDistribution(items) {
    const host = $('client-distribution');
    const totalClients = $('total-clients');

    if (!host || !totalClients) return;

    const clients = (items || [])
        .filter(x => x.label && x.label !== 'Not provided')
        .sort((a, b) => b.count - a.count);

    totalClients.textContent = clients.length.toLocaleString();

    if (!clients.length) {
        host.innerHTML =
            '<div class="empty-state">No client names found in the workbook.</div>';
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
                $('people')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// EMPLOYEE TABLE COLUMNS

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
    if (!host) return;

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
        const column = tableColumns.find(c => c[0] === key);
        const label = column ? column[1] : key;

        const values = [
            ...new Set(
                allEmployees
                    .map(e => String(e[key] ?? '').trim())
                    .filter(v => v && v !== 'Not provided')
            )
        ].sort((a, b) =>
            a.localeCompare(b, undefined, {
                numeric: true,
                sensitivity: 'base'
            })
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

// KPI FILTERS

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

    if (activeKpi === 'total') return true;

    if (activeKpi === 'certified') {
        return ['completed', 'certified', 'yes', 'y'].includes(cert);
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

// MISSING EMPLOYEE DETAILS

const missingDetailFields = [
    { label: 'Manager', keys: ['manager', 'manager_name'] },
    { label: 'Email', keys: ['email'] },
    { label: 'Department', keys: ['department'] },
    { label: 'Project', keys: ['project', 'mapped_to_project'] },
    { label: 'Location', keys: ['location'] },
    { label: 'Contact Number', keys: ['contact_number', 'phone', 'mobile'] },
    { label: 'Technical Skills', keys: ['technical_skills', 'skills'] },
    { label: 'YOE', keys: ['yoe', 'years_of_experience'] },
    { label: 'DOJ DEP', keys: ['doj_dep', 'date_of_joining_dep'] },
    { label: 'Internal/External', keys: ['internal_external', 'employee_type'] },
    { label: 'Client Name', keys: ['client_name', 'client'] },
    { label: 'Certification', keys: ['certification', 'certification_name'] },
    { label: 'Profiles Uploaded', keys: ['profiles_uploaded'] },
    { label: 'Billable Status', keys: ['billable_status'] },
    { label: 'BGV Status', keys: ['bgv_status'] }
];

function isMissingDetailValue(value) {
    const text = String(value ?? '').trim().toLowerCase();

    return !text || [
        'not provided',
        'not available',
        'n/a',
        'na',
        'none',
        'null',
        'nan',
        '-'
    ].includes(text);
}

function getMissingFields(employee) {
    return missingDetailFields
        .filter(field => {
            const key = field.keys.find(k =>
                Object.prototype.hasOwnProperty.call(employee, k)
            );

            return !key || isMissingDetailValue(employee[key]);
        })
        .map(field => field.label);
}

function renderMissingEmployeeDetails() {
    const list = $('missing-details-list');
    const affectedCount = $('missing-employee-count');
    const missingCount = $('missing-field-count');
    const searchBox = $('missing-details-search');

    if (!list || !affectedCount || !missingCount) return;

    const affected = allEmployees
        .map(employee => ({
            employee,
            missing: getMissingFields(employee)
        }))
        .filter(item => item.missing.length > 0);

    affectedCount.textContent = affected.length.toLocaleString();

    missingCount.textContent = affected
        .reduce((total, item) => total + item.missing.length, 0)
        .toLocaleString();

    const query = (searchBox?.value || '').trim().toLowerCase();

    const filtered = affected.filter(({ employee }) => {
        const name = String(employee.name ?? '').toLowerCase();
        const id = String(employee.employee_id ?? '').toLowerCase();

        return !query || name.includes(query) || id.includes(query);
    });

    if (!filtered.length) {
        list.innerHTML = query
            ? '<div class="empty-state">No employees match your search.</div>'
            : '<div class="empty-state">No missing details found.</div>';
        return;
    }

    list.innerHTML = filtered.map(({ employee, missing }) => `
        <div class="missing-details-row">
            <div class="missing-details-employee">
                <strong>${esc(employee.name || 'Name not provided')}</strong>
                <span>${esc(employee.employee_id || 'Employee ID not provided')}</span>
            </div>
            <div class="missing-details-fields">
                ${missing.map(field => `
                    <span class="missing-field-tag">${esc(field)}</span>
                `).join('')}
            </div>
            <div class="missing-details-total">
                ${missing.length} missing ${missing.length === 1 ? 'field' : 'fields'}
            </div>
        </div>
    `).join('');
}

// EMPLOYEE DIRECTORY

function renderEmployees() {
    const searchElement = $('search');
    const rowsElement = $('employee-rows');
    const resultCountElement = $('result-count');
    const tableFootElement = $('table-foot');

    if (!searchElement || !rowsElement) return;

    const q = searchElement.value.trim().toLowerCase();

    const active = [
        ...document.querySelectorAll('.column-filter')
    ]
        .filter(x => x.value)
        .map(x => [x.dataset.key, x.value]);

    const rows = allEmployees.filter(e =>
        (!selectedClient ||
            String(e.client_name ?? '').trim() === selectedClient) &&
        (!activeSkill || employeeHasSkill(e, activeSkill)) &&
        (!activeLocation ||
            String(e.location ?? '').trim() === activeLocation) &&
        (!activeYoeRange || matchesYoeRange(e, activeYoeRange)) &&
        matchesKpi(e) &&
        active.every(([k, v]) => String(e[k] ?? '') === v) &&
        (!q || tableColumns.some(([k]) =>
            String(e[k] ?? '').toLowerCase().includes(q)
        ))
    );

    displayedEmployees = rows;
    window.filteredEmployeeRows = rows;

    if (resultCountElement) {
        resultCountElement.textContent = `${rows.length} employees`;
    }

    if (tableFootElement) {
        tableFootElement.textContent =
            `Showing ${rows.length} of ${allEmployees.length} employee records` +
            `${activeKpi ? ` · KPI: ${activeKpi.replaceAll('_', ' ')}` : ''}` +
            `${activeSkill ? ` · Skill: ${activeSkill}` : ''}` +
            `${selectedClient ? ` · Client: ${selectedClient}` : ''}` +
            `${activeLocation ? ` · Location: ${activeLocation}` : ''}` +
            `${activeYoeRange ? ` · YOE: ${activeYoeRange}` : ''}` +
            ' · Missing values shown as Not provided';
    }

    rowsElement.innerHTML = rows.length
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

// KPI CARD SETUP

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
                $('people')?.scrollIntoView({
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

// DASHBOARD REFRESH

async function refresh() {
    if (busy) return;

    busy = true;

    try {
        hideError();

        const data = await api('/api/dashboard/overview');
        const s = data.summary || {};

        allEmployees = data.employees || [];

        renderMissingEmployeeDetails();

        metric('total-employees', allEmployees.length);
        metric('total', allEmployees.length);
        metric('locations', s.locations);
        metric('certified', s.certified, s.certification_available);
        metric('billable', s.billable, s.billability_available);
        metric('non-billable', s.non_billable, s.billability_available);
        metric('bgv-pending', s.bgv_pending, s.bgv_status_available);

        const certifiedFoot = $('certified-foot');
        if (certifiedFoot) {
            certifiedFoot.textContent = s.certification_available
                ? `${s.certification_not_completed || 0} not completed`
                : 'Certification status not supplied';
        }

        const billableFoot = $('billable-foot');
        if (billableFoot) {
            billableFoot.textContent = s.billability_available
                ? `${s.non_billable || 0} non-billable`
                : 'Billability not supplied';
        }

        const nonBillableFoot = $('non-billable-foot');
        if (nonBillableFoot) {
            nonBillableFoot.textContent = s.billability_available
                ? `${s.billable || 0} billable`
                : 'Billability not supplied';
        }

        const bgvPendingFoot = $('bgv-pending-foot');
        if (bgvPendingFoot) {
            bgvPendingFoot.textContent = s.bgv_status_available
                ? 'BGV marked Pending'
                : 'BGV Status column not supplied';
        }

        drawChart(
            'locationChart',
            'bar',
            (data.by_location || []).map(x => x.label),
            (data.by_location || []).map(x => x.count)
        );

        renderYoeChart(allEmployees);

        const cert = (data.by_certification || []).filter(
            x => x.label !== 'Not provided'
        );

        drawChart(
            'certChart',
            'doughnut',
            cert.map(x => x.label),
            cert.map(x => x.count)
        );

        const certLegend = $('cert-legend');
        if (certLegend) {
            certLegend.innerHTML = cert.length
                ? cert.slice(0, 4).map((x, i) => `
                    <span>
                        <i class="legend-dot" style="background:${palette[i]}"></i>
                        ${esc(x.label)} (${x.count})
                    </span>
                `).join('')
                : '<span>Certification status not provided in source</span>';
        }

        renderTechnicalSkills();

        window.lastClientDistribution = data.by_client || [];
        renderClientDistribution(window.lastClientDistribution);

        const columnFilters = $('column-filters');
        if (columnFilters && !columnFilters.children.length) {
            buildColumnFilters();
        }

        fillColumnFilters();
        renderEmployees();

        version = data.version;

        const lastUpdated = $('last-updated');
        if (lastUpdated) {
            lastUpdated.textContent =
                `Last read ${new Date().toLocaleTimeString()}`;
        }

    } catch (e) {
        showError(e.message);
    } finally {
        busy = false;
    }
}

// INITIAL SETUP

buildColumnFilters();
setupKpiCards();

const searchElement = $('search');

if (searchElement) {
    searchElement.addEventListener('input', renderEmployees);
}

const missingDetailsSearch = $('missing-details-search');

if (missingDetailsSearch) {
    missingDetailsSearch.addEventListener(
        'input',
        renderMissingEmployeeDetails
    );
}

// CLEAR FILTERS

const clearFiltersButton = $('clear-filters');

if (clearFiltersButton) {
    clearFiltersButton.addEventListener('click', () => {
        if (searchElement) {
            searchElement.value = '';
        }

        selectedClient = '';
        activeKpi = null;
        activeSkill = '';
        activeLocation = null;
        activeYoeRange = null;

        document.querySelectorAll('.column-filter').forEach(x => {
            x.value = '';
        });

        document.querySelectorAll('[data-kpi]').forEach(card => {
            card.classList.remove('selected');
        });

        renderClientDistribution(
            window.lastClientDistribution || []
        );

        renderTechnicalSkills();
        renderYoeChart(allEmployees);
        renderEmployees();
    });
}

// EXCEL DOWNLOAD

function downloadEmployeesExcel() {
    const rows = displayedEmployees;

    if (!rows.length) {
        showError('There are no employee rows to download.');
        return;
    }

    hideError();

    const exportRows = rows.map(employee => {
        const row = {};

        tableColumns.forEach(([key, label]) => {
            row[label] = employee[key] ?? 'Not provided';
        });

        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);

    worksheet['!cols'] = tableColumns.map(([key, label]) => ({
        wch: Math.max(label.length + 2, 16)
    }));

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Employees'
    );

    const timestamp = new Date().toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19);

    XLSX.writeFile(
        workbook,
        `DEP_Employees_Filtered_${timestamp}.xlsx`
    );
}

['download-excel', 'export-excel'].forEach(id => {
    const button = $(id);

    if (button) {
        button.addEventListener('click', () => {
            if (typeof XLSX === 'undefined') {
                showError(
                    'Excel export library did not load. Please refresh the dashboard and try again.'
                );
                return;
            }

            downloadEmployeesExcel();
        });
    }
});

// REFRESH BUTTON

const refreshButton = $('refresh-dashboard');

if (refreshButton) {
    refreshButton.addEventListener('click', refresh);
}

// LOGOUT

const logoutButton = $('logout');

if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST'
            });
        } finally {
            location.href = '/login';
        }
    });
}

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
