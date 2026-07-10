import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import { createPool } from 'mysql2/promise';
import { randomUUID } from 'crypto';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

type Role = 'resident' | 'company' | 'farmer';

type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  location?: string | null;
  phone?: string | null;
};

type Report = {
  id: string;
  title: string;
  description: string;
  location: string;
  phone: string;
  status: string;
  created_at: string;
  userId: string;
};

type RequestItem = {
  id: string;
  amount_requested: string;
  location: string;
  phone: string;
  status: string;
  created_at: string;
  userId: string;
};

const dbName = process.env.DB_NAME || 'bioflux_db';
const dbConfig: any = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

if (process.env.DATABASE_URL) {
  try {
    const databaseUrlObject = new URL(process.env.DATABASE_URL);
    dbConfig.host = databaseUrlObject.hostname;
    dbConfig.port = Number(databaseUrlObject.port) || 3306;
    dbConfig.user = decodeURIComponent(databaseUrlObject.username);
    dbConfig.password = decodeURIComponent(databaseUrlObject.password);
    dbConfig.database = databaseUrlObject.pathname?.slice(1) || dbName;
    const sslQuery = databaseUrlObject.searchParams.get('sslmode') || databaseUrlObject.searchParams.get('ssl');
    if (sslQuery && /require|true|verify_full/i.test(sslQuery)) {
      dbConfig.ssl = { rejectUnauthorized: true };
    }
  } catch (error) {
    console.error('Invalid DATABASE_URL:', error);
  }
} else if (process.env.DB_SSL === 'true') {
  dbConfig.ssl = { rejectUnauthorized: true };
}

const pool = createPool(dbConfig);

const reports: Report[] = [];

const requests: RequestItem[] = [];

function toSafeUser(user: User) {
  const { password, ...safeUser } = user;
  return safeUser;
}

function isRole(value: string): value is Role {
  return ['resident', 'company', 'farmer'].includes(value);
}

async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'researcher',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function ensureResidentReportsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS resident_reports (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id CHAR(36) NOT NULL,
      sample_id CHAR(36) NULL,
      title VARCHAR(255) NOT NULL DEFAULT 'Resident Report',
      description TEXT NOT NULL,
      location VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      CONSTRAINT fk_resident_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_resident_reports_sample FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE SET NULL
    )
  `);
}

async function ensureRequestsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS requests (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      user_id CHAR(36) NOT NULL,
      amount_requested VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_requests_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
}

async function seedSampleUsers() {
  const sampleUsers: Array<{ username: string; email: string; password: string; role: string }> = [
    {
      username: 'resident1',
      email: 'resident@bioflux.com',
      password: 'password123',
      role: 'resident',
    },
    {
      username: 'company1',
      email: 'company@bioflux.com',
      password: 'password123',
      role: 'company',
    },
    {
      username: 'farmer1',
      email: 'farmer@bioflux.com',
      password: 'password123',
      role: 'farmer',
    },
  ];

  for (const user of sampleUsers) {
    await pool.query(
      `INSERT IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`,
      [user.username, user.email, user.password, user.role]
    );
  }
}

async function getAuthenticatedUser(req: Request): Promise<User | null> {
  const token = req.get('x-user-id');
  if (!token) return null;

  const [rows] = await pool.query('SELECT id, username AS name, email, password, role FROM users WHERE id = ?', [token]);
  const userRows = rows as Array<any>;
  if (!userRows[0]) return null;

  const candidate = userRows[0];
  return {
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    password: candidate.password,
    role: candidate.role,
    location: null,
    phone: null,
  };
}

async function getUserByEmail(email: string): Promise<User | null> {
  const [rows] = await pool.query('SELECT id, username AS name, email, password, role FROM users WHERE email = ?', [email]);
  const userRows = rows as Array<any>;
  if (!userRows[0]) return null;

  const candidate = userRows[0];
  return {
    id: candidate.id,
    name: candidate.name,
    email: candidate.email,
    password: candidate.password,
    role: candidate.role,
    location: null,
    phone: null,
  };
}

app.use(cors());
app.use(express.json());

const frontendPath = path.resolve(__dirname, '../../frontend/dist');
const frontendIndexPath = path.join(frontendPath, 'index.html');
const frontendAvailable = fs.existsSync(frontendIndexPath);

if (frontendAvailable) {
  app.use(express.static(frontendPath));
}

app.get('/api', (_req: Request, res: Response) => {
  res.json({
    name: 'BioFlux Backend API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      test: 'GET /api/test',
      login: 'POST /api/login',
      register: 'POST /api/register',
      me: 'GET /api/me',
      reports: 'GET/POST /api/reports',
      reportStatus: 'PATCH /api/reports/:id',
      requests: 'GET/POST /api/requests',
      requestStatus: 'PATCH /api/requests/:id',
    },
  });
});

app.get('/', (req: Request, res: Response) => {
  if (frontendAvailable) {
    return res.sendFile(frontendIndexPath);
  }
  res.json({ name: 'BioFlux Backend API', status: 'ok' });
});

app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (frontendAvailable) {
    return res.sendFile(frontendIndexPath);
  }
  return res.status(404).json({ error: 'Frontend not built' });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/test', (_req: Request, res: Response) => {
  res.json({ message: 'BioFlux Backend API is running' });
});

app.get('/api/description', (_req: Request, res: Response) => {
  res.json({
    title: 'BioFlux',
    description: 'BioFlux connects a React frontend with an Express backend API to display research project data and descriptions.',
  });
});

app.post('/api/register', async (req: Request, res: Response) => {
  const { name, email, password, role, location, phone } = req.body || {};

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password and role are required' });
  }

  if (!isRole(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const existingUser = await getUserByEmail(String(email).toLowerCase());
  if (existingUser) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const newUser: User = {
    id: randomUUID(),
    name: String(name),
    email: String(email).toLowerCase(),
    password: String(password),
    role,
    location: location ? String(location) : null,
    phone: phone ? String(phone) : null,
  };

  await pool.query(
    'INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
    [newUser.id, newUser.name, newUser.email, newUser.password, newUser.role]
  );

  return res.status(201).json({
    token: newUser.id,
    user: toSafeUser(newUser),
  });
});

app.post('/api/login', async (req: Request, res: Response) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await getUserByEmail(String(email).toLowerCase());
  if (!user || user.password !== String(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  return res.json({
    token: user.id,
    user: toSafeUser(user),
  });
});

app.get('/api/me', async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  return res.json({ user: toSafeUser(user) });
});

app.get('/api/reports', async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const [rows] = await pool.query(
    `SELECT id, title, description, location, phone, status, created_at, user_id AS userId
     FROM resident_reports
     WHERE (? = 'company' OR user_id = ?) 
     ORDER BY created_at DESC`,
    [user.role, user.id]
  );

  const reportRows = rows as Array<any>;
  const reportsFromDb = reportRows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    phone: row.phone,
    status: row.status,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    userId: row.userId,
  }));

  return res.json(reportsFromDb);
});

app.post('/api/reports', async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  if (user.role !== 'resident') return res.status(403).json({ error: 'Only residents can submit reports' });

  const { title, description, location, phone } = req.body || {};
  if (!description || !location || !phone) {
    return res.status(400).json({ error: 'Location, phone and description are required' });
  }

  const newReportId = randomUUID();
  await pool.query(
    `INSERT INTO resident_reports (id, user_id, title, description, location, phone, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'Pending', NOW())`,
    [newReportId, user.id, title || 'Resident Report', String(description), String(location), String(phone)]
  );

  const [rows] = await pool.query(
    `SELECT id, title, description, location, phone, status, created_at, user_id AS userId
     FROM resident_reports WHERE id = ?`,
    [newReportId]
  );

  const insertedReport = (rows as Array<any>)[0];
  return res.status(201).json({
    id: insertedReport.id,
    title: insertedReport.title,
    description: insertedReport.description,
    location: insertedReport.location,
    phone: insertedReport.phone,
    status: insertedReport.status,
    created_at: insertedReport.created_at ? new Date(insertedReport.created_at).toISOString() : new Date().toISOString(),
    userId: insertedReport.userId,
  });
});

app.patch('/api/reports/:id', async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const [rows] = await pool.query(
    `SELECT id, title, description, location, phone, status, created_at, user_id AS userId
     FROM resident_reports WHERE id = ?`,
    [req.params.id]
  );

  const report = (rows as Array<any>)[0];
  if (!report) return res.status(404).json({ error: 'Report not found' });

  if (user.role !== 'company' && report.userId !== user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'Status is required' });

  await pool.query('UPDATE resident_reports SET status = ? WHERE id = ?', [String(status), req.params.id]);

  return res.json({
    id: report.id,
    title: report.title,
    description: report.description,
    location: report.location,
    phone: report.phone,
    status: String(status),
    created_at: report.created_at ? new Date(report.created_at).toISOString() : new Date().toISOString(),
    userId: report.userId,
  });
});

app.get('/api/requests', async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const [rows] = await pool.query(
    `SELECT id, amount_requested, location, phone, status, created_at, user_id AS userId
     FROM requests
     WHERE (? = 'company' OR user_id = ?)
     ORDER BY created_at DESC`,
    [user.role, user.id]
  );

  const requestRows = rows as Array<any>;
  const requestsFromDb = requestRows.map((row) => ({
    id: row.id,
    amount_requested: row.amount_requested,
    location: row.location,
    phone: row.phone,
    status: row.status,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    userId: row.userId,
  }));

  return res.json(requestsFromDb);
});

app.post('/api/requests', async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });
  if (user.role !== 'farmer') return res.status(403).json({ error: 'Only farmers can submit requests' });

  const { amount_requested, location, phone } = req.body || {};
  if (!amount_requested || !location || !phone) {
    return res.status(400).json({ error: 'Amount requested, location and phone are required' });
  }

  const newRequestId = randomUUID();
  await pool.query(
    `INSERT INTO requests (id, user_id, amount_requested, location, phone, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'Pending', NOW())`,
    [newRequestId, user.id, String(amount_requested), String(location), String(phone)]
  );

  const [rows] = await pool.query(
    `SELECT id, amount_requested, location, phone, status, created_at, user_id AS userId
     FROM requests WHERE id = ?`,
    [newRequestId]
  );

  const insertedRequest = (rows as Array<any>)[0];
  return res.status(201).json({
    id: insertedRequest.id,
    amount_requested: insertedRequest.amount_requested,
    location: insertedRequest.location,
    phone: insertedRequest.phone,
    status: insertedRequest.status,
    created_at: insertedRequest.created_at ? new Date(insertedRequest.created_at).toISOString() : new Date().toISOString(),
    userId: insertedRequest.userId,
  });
});

app.patch('/api/requests/:id', async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const [rows] = await pool.query(
    `SELECT id, amount_requested, location, phone, status, created_at, user_id AS userId
     FROM requests WHERE id = ?`,
    [req.params.id]
  );

  const requestItem = (rows as Array<any>)[0];
  if (!requestItem) return res.status(404).json({ error: 'Request not found' });

  if (user.role !== 'company' && requestItem.userId !== user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'Status is required' });

  await pool.query('UPDATE requests SET status = ? WHERE id = ?', [String(status), req.params.id]);

  return res.json({
    id: requestItem.id,
    amount_requested: requestItem.amount_requested,
    location: requestItem.location,
    phone: requestItem.phone,
    status: String(status),
    created_at: requestItem.created_at ? new Date(requestItem.created_at).toISOString() : new Date().toISOString(),
    userId: requestItem.userId,
  });
});

async function startServer() {
  try {
    await ensureUsersTable();
    await ensureResidentReportsTable();
    await ensureRequestsTable();
    await seedSampleUsers();
    app.listen(Number(port), '0.0.0.0', () => {
      console.log(`Backend server is running on http://0.0.0.0:${port}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}

startServer();
