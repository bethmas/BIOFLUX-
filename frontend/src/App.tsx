import { FormEvent, useEffect, useMemo, useState } from 'react';

type Role = 'resident' | 'company' | 'farmer';

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  location?: string;
  phone?: string;
};

const roles = [
  { id: 'resident' as Role, title: 'Resident', description: 'Report sanitation issues in your area', icon: 'house' },
  { id: 'company' as Role, title: 'Sewage Company', description: 'Manage and respond to reports', icon: 'truck' },
  { id: 'farmer' as Role, title: 'Farmer', description: 'Access organic manure for your farm', icon: 'leaf' },
];

const iconPaths: Record<string, string> = {
  house: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
  truck: '<path d="M3 13h2v-3H3v3zm0 3h2v-2H3v2zm12 2H7V9h8v9zm6-8h-2V8h-4V5h-4v3H7v10h2v-2h6v2h4v-3h2v-2z"/>',
  leaf: '<path d="M12 2c-1.927 0-3.747.777-5.09 2.13a7.007 7.007 0 0 0-1.824 3.197c-.42 1.429-.15 2.975.808 4.14l-.001.001 7.107 8.741c.43.528 1.147.72 1.78.52a1.95 1.95 0 0 0 1.171-1.13l2.053-6.964a7.008 7.008 0 0 0-1.72-6.999A7.072 7.072 0 0 0 12 2zm-.38 2.5a5.01 5.01 0 0 1 4.045 1.445 5.013 5.013 0 0 1 1.211 5.01l-1.82 6.17-6.393-7.861a5.026 5.026 0 0 1-.657-3.213A5.013 5.013 0 0 1 11.62 4.5z"/>',
};

function Icon({ name }: { name: string }) {
  return <span className="role-card-icon" dangerouslySetInnerHTML={{ __html: `<svg viewBox=\"0 0 24 24\" fill=\"currentColor\">${iconPaths[name] || ''}</svg>` }} />;
}

function StatusChip({ label, className }: { label: string; className: string }) {
  return <span className={`status-tag ${className}`}>{label}</span>;
}

function SummaryBar({ items }: { items: Array<{ label: string; value: number }> }) {
  return (
    <div className="top-summary">
      {items.map((item) => (
        <div key={item.label} className="summary-pill">
          <strong>{item.value}</strong>
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  );
}

function StatusStrip({ steps, activeStep }: { steps: string[]; activeStep: number }) {
  return (
    <div className="status-strip">
      {steps.map((step, index) => (
        <div key={step} className={`status-step${index < activeStep ? ' active' : ''}`}>
          <span>{index + 1}</span>
          <small>{step}</small>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [page, setPage] = useState<'home' | 'login' | 'register'>('home');
  const [selectedRole, setSelectedRole] = useState<Role>('resident');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bioflux-token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', role: selectedRole, location: '', phone: '' });
  const [newReport, setNewReport] = useState({ location: '', description: '', phone: '' });
  const [newRequest, setNewRequest] = useState({ amount_requested: '', location: '', phone: '' });

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    fetch('/api/me', { headers: { 'x-user-id': token } })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        setUser(data.user);
        setPage('home');
      })
      .catch(() => {
        setToken(null);
        localStorage.removeItem('bioflux-token');
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!user || !token) return;

    const headers = { 'x-user-id': token };
    const fetchData = async () => {
      try {
        if (user.role === 'resident' || user.role === 'company') {
          const res = await fetch('/api/reports', { headers });
          const data = await res.json();
          setReports(data);
        }

        if (user.role === 'farmer' || user.role === 'company') {
          const res = await fetch('/api/requests', { headers });
          const data = await res.json();
          setRequests(data);
        }
      } catch {
        setError('Failed to load dashboard data');
      }
    };

    fetchData();
  }, [user, token]);

  const apiHeaders = useMemo(
    () => ({ 'Content-Type': 'application/json', ...(token ? { 'x-user-id': token } : {}) }),
    [token]
  );

  const appTheme = useMemo(() => {
    if (!user) {
      return 'theme-role-select';
    }

    if (user.role === 'resident') {
      return 'theme-resident';
    }

    if (user.role === 'company') {
      return 'theme-company';
    }

    return 'theme-farmer';
  }, [user]);

  useEffect(() => {
    setRegisterForm((current) => ({ ...current, role: selectedRole }));
  }, [selectedRole]);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(registerForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');
      setToken(data.token);
      localStorage.setItem('bioflux-token', data.token);
      setUser(data.user);
      setPage('home');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      setToken(data.token);
      localStorage.setItem('bioflux-token', data.token);
      setUser(data.user);
      setPage('home');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bioflux-token');
    setReports([]);
    setRequests([]);
    setPage('home');
    setStatusMessage(null);
    setError(null);
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || user.role !== 'resident') return;
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ title: 'Overflowing Latrine', ...newReport, phone: newReport.phone || user.phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not submit report');
      setStatusMessage('Report submitted successfully');
      setNewReport({ location: '', description: '', phone: user.phone || '' });
      const refreshed = await fetch('/api/reports', { headers: token ? { 'x-user-id': token } : undefined }).then((res) => res.json());
      setReports(refreshed);
    } catch (err: any) {
      setError(err.message || 'Could not submit report');
    } finally {
      setLoading(false);
    }
  }

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || user.role !== 'farmer') return;
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ ...newRequest, phone: newRequest.phone || user.phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not submit request');
      setStatusMessage('Manure request submitted successfully');
      setNewRequest({ amount_requested: '', location: '', phone: user.phone || '' });
      const refreshed = await fetch('/api/requests', { headers: token ? { 'x-user-id': token } : undefined }).then((res) => res.json());
      setRequests(refreshed);
    } catch (err: any) {
      setError(err.message || 'Could not submit request');
    } finally {
      setLoading(false);
    }
  }

  async function updateReportStatus(id: string, status: string) {
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: 'PATCH',
        headers: apiHeaders,
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update report');
      const refreshed = await fetch('/api/reports', { headers: { 'x-user-id': token! } }).then((res) => res.json());
      setReports(refreshed);
      setStatusMessage('Report status updated');
    } catch (err: any) {
      setError(err.message || 'Could not update report');
    } finally {
      setLoading(false);
    }
  }

  async function updateRequestStatus(id: string, status: string) {
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: apiHeaders,
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update request');
      const refreshed = await fetch('/api/requests', { headers: { 'x-user-id': token! } }).then((res) => res.json());
      setRequests(refreshed);
      setStatusMessage('Request status updated');
    } catch (err: any) {
      setError(err.message || 'Could not update request');
    } finally {
      setLoading(false);
    }
  }

  function renderHome() {
    return (
      <section className="page-card hero-panel">
        <div className="hero-copy">
          <div className="logo-label">
            <span className="logo-mark">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="24" fill="white" fillOpacity="0.12" />
                <path d="M24 14C18.48 14 14 18.48 14 24s4.48 10 10 10 10-4.48 10-10S29.52 14 24 14zm0 4a6 6 0 100 12 6 6 0 000-12z" fill="white" />
              </svg>
            </span>
            <span className="brand">
              <strong>BioFlux Waste Solutions Ltd</strong>
              <span className="subtle-note">Connecting communities to cleaner sanitation and sustainable farming.</span>
            </span>
          </div>
          <h1>Delivering cleaner sanitation and organic waste value across Uganda.</h1>
          <p>Choose your role to register, login, and manage reports or manure requests.</p>
          <div className="role-grid">
            {roles.map((item) => (
              <button
                key={item.id}
                className="role-card"
                type="button"
                onClick={() => {
                  setSelectedRole(item.id);
                  setPage('register');
                  setError(null);
                  setStatusMessage(null);
                }}
              >
                <Icon name={item.icon} />
                <span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </span>
              </button>
            ))}
          </div>
          <p className="subtle-note">
            Already registered?{' '}
            <button type="button" className="link-button" onClick={() => { setPage('login'); setSelectedRole('resident'); setError(null); setStatusMessage(null); }}>
              Log in here
            </button>
          </p>
        </div>
      </section>
    );
  }

  function renderAuthCard() {
    const isRegister = page === 'register';

    return (
      <section className="page-card hero-panel">
        <div className="hero-copy">
          <div className="panel-header">
            <div>
              <h2>{isRegister ? `Register as ${selectedRole}` : 'Login to BioFlux'}</h2>
              <p className="subtitle">
                {isRegister ? 'Create an account for your role and start managing sanitation workflows.' : 'Enter your email and password to continue.'}
              </p>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {statusMessage && <div className="alert alert-success">{statusMessage}</div>}

          {isRegister ? (
            <form className="form-card" onSubmit={handleRegister}>
              <div className="form-grid">
                <label className="form-field">
                  <span>Name</span>
                  <input className="input-field" type="text" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} required />
                </label>
                <label className="form-field">
                  <span>Email</span>
                  <input className="input-field" type="email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} required />
                </label>
                <label className="form-field">
                  <span>Password</span>
                  <input className="input-field" type="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} required />
                </label>
                <label className="form-field">
                  <span>Role</span>
                  <select className="input-field" value={registerForm.role} onChange={(e) => { setSelectedRole(e.target.value as Role); setRegisterForm({ ...registerForm, role: e.target.value as Role }); }}>
                    {roles.map((roleOption) => (
                      <option key={roleOption.id} value={roleOption.id}>{roleOption.title}</option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>Location</span>
                  <input className="input-field" type="text" value={registerForm.location} onChange={(e) => setRegisterForm({ ...registerForm, location: e.target.value })} placeholder="e.g. Nakawa Village" />
                </label>
                <label className="form-field">
                  <span>Phone</span>
                  <input className="input-field" type="tel" value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} placeholder="e.g. +256 700 123 456" />
                </label>
              </div>
              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Registering…' : 'Register'}</button>
                <button className="link-button" type="button" onClick={() => { setPage('login'); setError(null); setStatusMessage(null); }}>
                  Already have an account?
                </button>
              </div>
            </form>
          ) : (
            <form className="form-card" onSubmit={handleLogin}>
              <div className="form-grid">
                <label className="form-field">
                  <span>Email</span>
                  <input className="input-field" type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} required />
                </label>
                <label className="form-field">
                  <span>Password</span>
                  <input className="input-field" type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
                </label>
              </div>
              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</button>
                <button className="link-button" type="button" onClick={() => { setPage('register'); setError(null); setStatusMessage(null); }}>
                  Create account
                </button>
              </div>
            </form>
          )}

          <div className="subtle-note">Use the sample accounts in the backend seed or register your own.</div>
        </div>
      </section>
    );
  }

  function renderDashboardHeader() {
    return (
      <div className="page-card dashboard-shell">
        <div className="panel-header">
          <div>
            <h2>{user?.role === 'resident' ? 'Resident Dashboard' : user?.role === 'company' ? 'Company Dashboard' : 'Farmer Dashboard'}</h2>
            <p className="subtitle">
              {user?.role === 'resident'
                ? 'Report overflowing latrines and track response progress'
                : user?.role === 'company'
                ? 'Review resident reports and update status'
                : 'Request organic manure and track progress'}
            </p>
          </div>
          <div className="action-bar">
            <div className="small-pill">{user?.role.toUpperCase()}</div>
            <button className="primary-button" type="button" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
    );
  }

  function renderResidentDashboard() {
    const summary = [
      { label: 'Reports', value: reports.length },
      { label: 'Pending', value: reports.filter((r) => r.status === 'Pending').length },
      { label: 'Dispatched', value: reports.filter((r) => r.status === 'Dispatched').length },
    ];

    return (
      <>
        {renderDashboardHeader()}
        <div className="dashboard-shell">
          <SummaryBar items={summary} />
          <div className="page-card">
            <div className="panel-header">
              <div>
                <h3>Report Overflowing Latrine</h3>
                <p className="subtitle">Submit a new request for sanitation support.</p>
              </div>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            {statusMessage && <div className="alert alert-success">{statusMessage}</div>}
            <form className="form-card" onSubmit={submitReport}>
              <div className="form-grid">
                <label className="form-field">
                  <span>Location</span>
                  <input className="input-field" value={newReport.location} onChange={(e) => setNewReport({ ...newReport, location: e.target.value })} placeholder="e.g. Nakawa Village, near school" required />
                </label>
                <label className="form-field">
                  <span>Phone</span>
                  <input className="input-field" value={newReport.phone} onChange={(e) => setNewReport({ ...newReport, phone: e.target.value })} placeholder="e.g. +256 700 123 456" required />
                </label>
                <label className="form-field form-field-full">
                  <span>Description</span>
                  <textarea className="input-field" rows={4} value={newReport.description} onChange={(e) => setNewReport({ ...newReport, description: e.target.value })} placeholder="Describe the issue in detail" />
                </label>
              </div>
              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Submitting…' : 'Submit Report'}</button>
              </div>
            </form>
          </div>

          <div className="card-list">
            {reports.map((report) => (
              <section key={report.id} className="dashboard-card">
                <div className="report-header"><h3>{report.title}</h3></div>
                <div className="report-meta">
                  <StatusChip label={report.status} className={report.status === 'Cleared' ? 'tag-cleared' : report.status === 'Dispatched' ? 'tag-dispatched' : 'tag-pending'} />
                  <span>{report.location}</span>
                  <span>{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
                <p>{report.description}</p>
              </section>
            ))}
          </div>
        </div>
      </>
    );
  }

  function renderCompanyDashboard() {
    const summary = [
      { label: 'Reports', value: reports.length },
      { label: 'Requests', value: requests.length },
      { label: 'Open', value: reports.filter((r) => r.status === 'Pending').length },
    ];

    return (
      <>
        {renderDashboardHeader()}
        <div className="dashboard-shell">
          <SummaryBar items={summary} />
          {error && <div className="alert alert-error">{error}</div>}
          {statusMessage && <div className="alert alert-success">{statusMessage}</div>}
          <div className="card-list">
            {reports.map((report) => (
              <section key={report.id} className="dashboard-card">
                <div className="report-header"><h3>{report.title}</h3></div>
                <div className="report-meta">
                  <StatusChip label={report.status} className={report.status === 'Cleared' ? 'tag-cleared' : report.status === 'Dispatched' ? 'tag-dispatched' : 'tag-pending'} />
                  <span>{report.reporter_name}</span>
                  <span>{report.reporter_phone}</span>
                  <span>{report.location}</span>
                  <span>{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
                <p>{report.description}</p>
                <div className="report-footer">
                  <select className="select-status" aria-label="Update report status" value={report.status} onChange={(e) => updateReportStatus(report.id, e.target.value)}>
                    {['Pending', 'Dispatched', 'Cleared'].map((statusOption) => (
                      <option key={statusOption} value={statusOption}>{statusOption}</option>
                    ))}
                  </select>
                </div>
              </section>
            ))}
          </div>

          <div className="card-list">
            {requests.map((request) => (
              <section key={request.id} className="dashboard-card">
                <div className="report-header"><h3>Manure request from {request.farmer_name}</h3></div>
                <div className="report-meta">
                  <StatusChip label={request.status} className={request.status === 'Ready' ? 'tag-ready' : request.status === 'Processing' ? 'tag-processing' : 'tag-pending'} />
                  <span>{request.farmer_phone}</span>
                  <span>{request.location}</span>
                  <span>{request.amount_requested}</span>
                </div>
                <div className="report-footer">
                  <select className="select-status" aria-label="Update request status" value={request.status} onChange={(e) => updateRequestStatus(request.id, e.target.value)}>
                    {['Pending', 'Processing', 'Ready', 'Completed'].map((statusOption) => (
                      <option key={statusOption} value={statusOption}>{statusOption}</option>
                    ))}
                  </select>
                </div>
              </section>
            ))}
          </div>
        </div>
      </>
    );
  }

  function renderFarmerDashboard() {
    const summary = [
      { label: 'Requests', value: requests.length },
      { label: 'Pending', value: requests.filter((r) => r.status === 'Pending').length },
      { label: 'Ready', value: requests.filter((r) => r.status === 'Ready').length },
    ];

    return (
      <>
        {renderDashboardHeader()}
        <div className="dashboard-shell">
          <SummaryBar items={summary} />
          {error && <div className="alert alert-error">{error}</div>}
          {statusMessage && <div className="alert alert-success">{statusMessage}</div>}
          <div className="page-card">
            <div className="panel-header">
              <div>
                <h3>Request Organic Manure</h3>
                <p className="subtitle">Submit a new manure request and view progress here.</p>
              </div>
            </div>
            <form className="form-card" onSubmit={submitRequest}>
              <div className="form-grid">
                <label className="form-field">
                  <span>Amount</span>
                  <input className="input-field" value={newRequest.amount_requested} onChange={(e) => setNewRequest({ ...newRequest, amount_requested: e.target.value })} placeholder="e.g. 500 kg" required />
                </label>
                <label className="form-field">
                  <span>Location</span>
                  <input className="input-field" value={newRequest.location} onChange={(e) => setNewRequest({ ...newRequest, location: e.target.value })} placeholder="e.g. Kayunga Village" required />
                </label>
                <label className="form-field">
                  <span>Phone</span>
                  <input className="input-field" value={newRequest.phone} onChange={(e) => setNewRequest({ ...newRequest, phone: e.target.value })} placeholder="e.g. +256 700 567 890" required />
                </label>
              </div>
              <div className="form-actions">
                <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Submitting…' : 'Submit Request'}</button>
              </div>
            </form>
          </div>

          <div className="card-list">
            {requests.map((request) => (
              <section key={request.id} className="dashboard-card">
                <div className="report-header"><h3>{request.amount_requested}</h3></div>
                <div className="report-meta">
                  <StatusChip label={request.status} className={request.status === 'Ready' ? 'tag-ready' : request.status === 'Processing' ? 'tag-processing' : 'tag-pending'} />
                  <span>{request.location}</span>
                  <span>{request.phone}</span>
                  <span>{new Date(request.created_at).toLocaleDateString()}</span>
                </div>
              </section>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (loading && !user && page !== 'home') {
    return <div className={`loader ${appTheme}`}>Loading…</div>;
  }

  if (page === 'login' || page === 'register') {
    return <div className={`app-shell ${appTheme}`}>{renderAuthCard()}</div>;
  }

  if (!user) {
    return <div className={`app-shell ${appTheme}`}>{renderHome()}</div>;
  }

  return (
    <div className={`app-shell ${appTheme}`}>
      {user.role === 'resident' && renderResidentDashboard()}
      {user.role === 'company' && renderCompanyDashboard()}
      {user.role === 'farmer' && renderFarmerDashboard()}
    </div>
  );
}

export default App;
