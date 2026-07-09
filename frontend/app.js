const root = document.getElementById('page-wrapper');
const loader = document.getElementById('loader');
const roles = [
  {
    id: 'resident',
    title: 'Resident',
    description: 'Report sanitation issues in your area',
    icon: 'house',
    theme: '#20c0e8'
  },
  {
    id: 'company',
    title: 'Sewage Company',
    description: 'Manage and respond to reports',
    icon: 'truck',
    theme: '#4c8fff'
  },
  {
    id: 'farmer',
    title: 'Farmer',
    description: 'Access organic manure for your farm',
    icon: 'leaf',
    theme: '#52e27f'
  }
];
const sampleData = {
  resident: {
    user: {
      name: 'John Musoke',
      location: 'Nakawa Village',
      phone: '+256 700 123 456',
      active: 3
    },
    summary: [
      { label: 'Pending', value: 1, type: 'warning' },
      { label: 'Dispatched', value: 1, type: 'accent' },
      { label: 'Cleared', value: 1, type: 'success' }
    ],
    reports: [
      {
        id: 'Report #1',
        title: 'Overflowing Latrine Report',
        status: 'Dispatched',
        labelClass: 'tag-dispatched',
        location: 'Nakawa Village, near St. Mary’s School',
        date: '2026-05-12',
        steps: ['Submitted', 'Confirmed', 'Dispatched', 'Cleared'],
        activeStep: 3
      },
      {
        id: 'Report #2',
        title: 'Overflowing Latrine Report',
        status: 'Cleared',
        labelClass: 'tag-cleared',
        location: 'Nakawa Village, behind market',
        date: '2026-05-10',
        steps: ['Submitted', 'Confirmed', 'Dispatched', 'Cleared'],
        activeStep: 4
      }
    ]
  },
  company: {
    user: {
      name: 'BioFlux Dispatch',
      active: 3
    },
    summary: [
      { label: 'Pending', value: 1, type: 'warning' },
      { label: 'Dispatched', value: 1, type: 'accent' },
      { label: 'Cleared', value: 1, type: 'success' }
    ],
    reports: [
      {
        id: 'Report #1',
        title: 'Overflowing Latrine',
        status: 'Dispatched',
        labelClass: 'tag-dispatched',
        contact: 'John Musoke',
        phone: '+256 700 123 456',
        location: 'Nakawa Village, near St. Mary’s School',
        date: '2026-05-12'
      },
      {
        id: 'Report #2',
        title: 'Overflowing Latrine',
        status: 'Cleared',
        labelClass: 'tag-cleared',
        contact: 'Sarah Namata',
        phone: '+256 700 234 567',
        location: 'Nakawa Village, behind market',
        date: '2026-05-10'
      }
    ]
  },
  farmer: {
    user: {
      name: 'Farmer Dashboard',
      active: 2
    },
    summary: [
      { label: 'Ready', value: 2, type: 'success' },
      { label: 'Processing', value: 1, type: 'accent' }, { label: 'Pending', value: 1, type: 'warning' }
    ],
    requests: [
      {
        name: 'David Ssemmanda',
        location: 'Mukono Village, near trading center',
        phone: '+256 700 456 789',
        requested: '500 kg requested',
        status: 'Ready',
        badge: 'tag-ready',
        activeStep: 3
      },
      {
        name: 'Grace Nakaweesi',
        location: 'Kayunga Village, main road junction',
        phone: '+256 700 567 890',
        requested: '300 kg requested',
        status: 'Processing',
        badge: 'tag-processing',
        activeStep: 2
      },
      {
        name: 'Patrick Kintu',
        location: 'Wakiso Village, behind health center',
        phone: '+256 700 678 901',
        requested: '750 kg requested',
        status: 'Pending',
        badge: 'tag-pending',
        activeStep: 1
      }
    ]
  }
};
const icons = {
  house: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
  truck: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-3H3v3zm0 3h2v-2H3v2zm12 2H7V9h8v9zm6-8h-2V8h-4V5h-4v3H7v10h2v-2h6v2h4v-3h2v-2z"/></svg>',
  leaf: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-1.927 0-3.747.777-5.09 2.13a7.007 7.007 0 0 0-1.824 3.197c-.42 1.429-.15 2.975.808 4.14l-.001.001 7.107 8.741c.43.528 1.147.72 1.78.52a1.95 1.95 0 0 0 1.171-1.13l2.053-6.964a7.008 7.008 0 0 0-1.72-6.999A7.072 7.072 0 0 0 12 2zm-.38 2.5a5.01 5.01 0 0 1 4.045 1.445 5.013 5.013 0 0 1 1.211 5.01l-1.82 6.17-6.393-7.861a5.026 5.026 0 0 1-.657-3.213A5.013 5.013 0 0 1 11.62 4.5z"/></svg>'
};
function createElement(tag, attrs = {}, content = '') {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') el.className = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else el.setAttribute(key, value);
  });
  if (content !== undefined) el.innerHTML = content;
  return el;
}
function resolveRole() {
  const hash = window.location.hash || '#home';
  const match = hash.match(/role=([a-z]+)/);
  return match ? match[1] : null;
}
function navigate(target) {
  if (target === 'home') window.location.hash = '#home';
  else window.location.hash = `#role=${target}`;
}
function renderHero() {
  const hero = createElement('section', { className: 'page-card hero-panel' });
  const content = document.createElement('div');
  content.className = 'hero-copy';
  content.innerHTML = `
    <div class="logo-label">
      <span class="logo-mark"> <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="24" fill="white" fill-opacity="0.12"/><path d="M24 14C18.48 14 14 18.48 14 24s4.48 10 10 10 10-4.48 10-10S29.52 14 24 14zm0 4a6 6 0 100 12 6 6 0 000-12z" fill="white"/></svg></span>
      <span class="brand"><strong>BioFlux Waste Solutions Ltd</strong><span class="subtle-note">Connecting communities to clean sanitation and sustainable farming.</span></span>
    </div>
    <h1>Delivering cleaner sanitation and organic waste value across Uganda.</h1>
    <p>Choose your role to enter a custom dashboard with live reports, collection status, and request tracking.</p>
  `;
  hero.appendChild(content);
  const grid = createElement('div', { className: 'role-grid' });
  roles.forEach(role => {
    const card = createElement('button', { className: 'role-card', onClick: () => navigate(role.id), type: 'button' }, `
      <span class="role-card-icon">${icons[role.icon]}</span>
      <span>
        <h3>${role.title}</h3>
        <p>${role.description}</p>
      </span>
    `);
    grid.appendChild(card);
  });
  hero.appendChild(grid);
  const footer = createElement('p', { className: 'subtle-note' }, 'BioFlux Waste Solutions Ltd');
  hero.appendChild(footer);
  root.innerHTML = '';
  root.appendChild(hero);
}
function renderBackButton() {
  const back = createElement('a', { href: '#home', className: 'back-link' }, `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Back to role selection
  `);
  return back;
}
function renderRoleHeader(role) {
  const header = createElement('div', { className: 'page-card dashboard-shell' });
  const top = createElement('div', { className: 'panel-header' });
  const title = createElement('div');
  title.innerHTML = `<h2>Welcome back</h2><p class="subtitle">${role.user.name} ${role.user.location ? `<span class="small-pill">${role.user.location}</span>` : ''}</p>`;
  top.appendChild(title);
  const count = createElement('div', { className: 'small-pill' }, `${role.user.active} Active`);
  top.appendChild(count);
  header.appendChild(top);
  return header;
}
function renderSummaryCards(items) {
  const container = createElement('div', { className: 'top-summary' });
  items.forEach(item => {
    const pill = createElement('div', { className: 'summary-pill' });
    pill.innerHTML = `<strong>${item.value}</strong><small>${item.label}</small>`;
    container.appendChild(pill);
  });
  return container;
}
function renderStatusSteps(steps, activeStep) {
  const strip = createElement('div', { className: 'status-strip' });
  steps.forEach((step, index) => {
    const stepEl = createElement('div', { className: `status-step${index < activeStep ? ' active' : ''}` });
    stepEl.innerHTML = `<span>${index + 1}</span><small>${step}</small>`;
    strip.appendChild(stepEl);
  });
  return strip;
}
function renderResident() {
  const role = sampleData.resident;
  root.innerHTML = '';
  root.appendChild(renderBackButton());
  root.appendChild(renderRoleHeader(role));
  root.appendChild(renderSummaryCards(role.summary));
  const reportGrid = createElement('div', { className: 'card-list' });
  role.reports.forEach(report => {
    const card = createElement('section', { className: 'dashboard-card' });
    card.innerHTML = `
      <div class="report-header"><h3>${report.title}</h3></div>
      <div class="report-meta">
        <span class="status-tag ${report.labelClass}">${report.status}</span>
        <span>${report.location}</span>
        <span>${report.date}</span>
      </div>
    `;
    card.appendChild(renderStatusSteps(report.steps, report.activeStep));
    reportGrid.appendChild(card);
  });
  root.appendChild(reportGrid);
}
function renderCompany() {
  const role = sampleData.company;
  root.innerHTML = '';
  root.appendChild(renderBackButton());
  const header = createElement('div', { className: 'page-card dashboard-shell' });
  header.appendChild(createElement('div', { className: 'panel-header' }, `<div><h2>Company Dashboard</h2><p class="subtitle">Manage overflowing latrine reports and dispatch teams</p></div>`));
  root.appendChild(header);
  root.appendChild(renderSummaryCards(role.summary));
  const reportGrid = createElement('div', { className: 'card-list' });
  role.reports.forEach(report => {
    const card = createElement('section', { className: 'dashboard-card' });
    card.innerHTML = `
      <div class="report-header"><h3>${report.id} - ${report.title}</h3></div>
      <div class="report-meta">
        <span class="status-tag ${report.labelClass}">${report.status}</span>
        <span>${report.contact}</span>
        <span>${report.phone}</span>
        <span>${report.location}</span>
        <span>Reported on ${report.date}</span>
      </div>
    `;
    const controls = createElement('div', { className: 'report-footer' });
    const select = createElement('select', { className: 'select-status' });
    ['Pending', 'Dispatched', 'Cleared'].forEach(status => {
      const option = document.createElement('option');
      option.value = status;
      option.textContent = status;
      option.selected = status === report.status;
      select.appendChild(option);
    });
    const updateButton = createElement('button', { className: 'primary-button', type: 'button', onClick: () => alert('Update sent for ' + report.id) }, 'Update');
    controls.appendChild(select);
    controls.appendChild(updateButton);
    card.appendChild(controls);
    reportGrid.appendChild(card);
  });
  root.appendChild(reportGrid);
}
function renderFarmer() {
  const role = sampleData.farmer;
  root.innerHTML = '';
  root.appendChild(renderBackButton());
  const header = createElement('div', { className: 'page-card dashboard-shell' });
  header.innerHTML = `
    <div class="panel-header">
      <div>
        <h2>Farmer Dashboard</h2>
        <p class="subtitle">Manage your organic manure requests</p>
      </div>
      <button class="primary-button" type="button" onclick="alert('Create new request')">+ New Request</button>
    </div>
  `;
  root.appendChild(header);
  root.appendChild(renderSummaryCards(role.summary));
  const requestGrid = createElement('div', { className: 'card-list' });
  role.requests.forEach(request => {
    const card = createElement('section', { className: 'dashboard-card' });
    card.innerHTML = `
      <div class="report-header"><h3>${request.name}</h3></div>
      <div class="report-meta">
        <span class="status-tag ${request.badge}">${request.status}</span>
        <span>${request.location}</span>
        <span>${request.phone}</span>
        <span>${request.requested}</span>
      </div>
    `;
    card.appendChild(renderStatusSteps(['Submit', 'Process', 'Ready', 'Collect'], request.activeStep));
    requestGrid.appendChild(card);
  });
  root.appendChild(requestGrid);
}
function renderPage() {
  const role = resolveRole();
  if (!role) return renderHero();
  if (role === 'resident') return renderResident();
  if (role === 'company') return renderCompany();
  if (role === 'farmer') return renderFarmer();
  renderHero();
}
window.addEventListener('hashchange', renderPage);
window.addEventListener('DOMContentLoaded', () => {
  loader.style.display = 'none';
  renderPage();
});
