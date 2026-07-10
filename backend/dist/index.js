"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const promise_1 = require("mysql2/promise");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
let dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bioflux_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};
if (process.env.DATABASE_URL) {
    const databaseUrlObject = new URL(process.env.DATABASE_URL);
    dbConfig = {
        ...dbConfig,
        host: databaseUrlObject.hostname,
        port: Number(databaseUrlObject.port) || 3306,
        user: databaseUrlObject.username,
        password: databaseUrlObject.password,
        database: databaseUrlObject.pathname?.slice(1) || process.env.DB_NAME || 'bioflux_db',
    };
}
const pool = (0, promise_1.createPool)(dbConfig);
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const frontendPath = path_1.default.resolve(__dirname, '../../frontend/dist');
const frontendIndexPath = path_1.default.join(frontendPath, 'index.html');
const frontendAvailable = fs_1.default.existsSync(frontendIndexPath);
if (frontendAvailable) {
    app.use(express_1.default.static(frontendPath));
}
function hashPassword(password) {
    return crypto_1.default.createHash('sha256').update(password).digest('hex');
}
async function findUserByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
}
async function findUserById(id) {
    const [rows] = await pool.execute('SELECT id, name, email, role, location, phone FROM users WHERE id = ?', [id]);
    return rows[0] || null;
}
function getUserFromHeader(req) {
    const userId = req.header('x-user-id');
    return userId ? findUserById(userId) : Promise.resolve(null);
}
function formatUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location || '',
        phone: user.phone || '',
    };
}
app.get('/api', (req, res) => {
    res.json({
        name: 'BioFlux Backend API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/health',
            test: 'GET /api/test',
            login: 'POST /api/login',
            register: 'POST /api/register',
            reports: 'GET /api/reports',
            requests: 'GET /api/requests',
        },
    });
});
app.get('/', (req, res) => {
    if (frontendAvailable) {
        return res.sendFile(frontendIndexPath);
    }
    res.json({ name: 'BioFlux Backend API', status: 'ok' });
});
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Not found' });
    }
    if (frontendAvailable) {
        return res.sendFile(frontendIndexPath);
    }
    return res.status(404).json({ error: 'Frontend not built' });
});
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});
app.post('/api/register', async (req, res) => {
    const { name, email, password, role, location, phone } = req.body;
    const allowedRoles = ['resident', 'company', 'farmer'];
    if (!name || !email || !password || !role || !allowedRoles.includes(role)) {
        return res.status(400).json({ error: 'Missing required registration fields' });
    }
    try {
        const existing = await findUserByEmail(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        const passwordHash = hashPassword(password);
        const [result] = await pool.execute('INSERT INTO users (name, email, password_hash, role, location, phone) VALUES (?, ?, ?, ?, ?, ?)', [name, email, passwordHash, role, location || '', phone || '']);
        const user = await findUserByEmail(email);
        res.json({ user: formatUser(user), token: user.id });
    }
    catch (error) {
        console.error('Registration failed:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const user = await findUserByEmail(email);
        if (!user || user.password_hash !== hashPassword(password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ user: formatUser(user), token: user.id });
    }
    catch (error) {
        console.error('Login failed:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
app.get('/api/me', async (req, res) => {
    const userId = req.header('x-user-id');
    if (!userId) {
        return res.status(401).json({ error: 'Missing user token' });
    }
    const user = await findUserById(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: formatUser(user) });
});
app.get('/api/reports', async (req, res) => {
    const userId = req.header('x-user-id');
    if (!userId) {
        return res.status(401).json({ error: 'Missing user token' });
    }
    const user = await findUserById(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    try {
        if (user.role === 'company') {
            const [rows] = await pool.execute(`SELECT r.id, r.title, r.description, r.location, r.phone, r.status, r.created_at, u.name AS reporter_name, u.phone AS reporter_phone, u.location AS reporter_location
         FROM overflow_reports r
         JOIN users u ON r.reporter_id = u.id
         ORDER BY r.created_at DESC`, []);
            return res.json(rows);
        }
        const [rows] = await pool.execute('SELECT id, title, description, location, phone, status, created_at FROM overflow_reports WHERE reporter_id = ? ORDER BY created_at DESC', [userId]);
        res.json(rows);
    }
    catch (error) {
        console.error('Failed to load reports:', error);
        res.status(500).json({ error: 'Failed to load reports' });
    }
});
app.post('/api/reports', async (req, res) => {
    const userId = req.header('x-user-id');
    const { title, description, location, phone } = req.body;
    if (!userId) {
        return res.status(401).json({ error: 'Missing user token' });
    }
    if (!title || !location || !phone) {
        return res.status(400).json({ error: 'Title, location, and phone are required' });
    }
    const user = await findUserById(userId);
    if (!user || user.role !== 'resident') {
        return res.status(403).json({ error: 'Only residents can file reports' });
    }
    try {
        const [result] = await pool.execute('INSERT INTO overflow_reports (reporter_id, title, description, location, phone, status) VALUES (?, ?, ?, ?, ?, ?)', [userId, title, description || '', location, phone, 'Pending']);
        res.json({ id: result.insertId || null, message: 'Report submitted' });
    }
    catch (error) {
        console.error('Failed to submit report:', error);
        res.status(500).json({ error: 'Failed to submit report' });
    }
});
app.patch('/api/reports/:id', async (req, res) => {
    const userId = req.header('x-user-id');
    const { status } = req.body;
    const { id } = req.params;
    if (!userId) {
        return res.status(401).json({ error: 'Missing user token' });
    }
    if (!['Pending', 'Dispatched', 'Cleared'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    const user = await findUserById(userId);
    if (!user || user.role !== 'company') {
        return res.status(403).json({ error: 'Only sewage companies can update report status' });
    }
    try {
        await pool.execute('UPDATE overflow_reports SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Report updated' });
    }
    catch (error) {
        console.error('Failed to update report:', error);
        res.status(500).json({ error: 'Failed to update report' });
    }
});
app.get('/api/requests', async (req, res) => {
    const userId = req.header('x-user-id');
    if (!userId) {
        return res.status(401).json({ error: 'Missing user token' });
    }
    const user = await findUserById(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    try {
        if (user.role === 'company') {
            const [rows] = await pool.execute(`SELECT m.id, m.amount_requested, m.location, m.phone, m.status, m.created_at, u.name AS farmer_name, u.phone AS farmer_phone, u.location AS farmer_location
         FROM manure_requests m
         JOIN users u ON m.farmer_id = u.id
         ORDER BY m.created_at DESC`, []);
            return res.json(rows);
        }
        const [rows] = await pool.execute('SELECT id, amount_requested, location, phone, status, created_at FROM manure_requests WHERE farmer_id = ? ORDER BY created_at DESC', [userId]);
        res.json(rows);
    }
    catch (error) {
        console.error('Failed to load requests:', error);
        res.status(500).json({ error: 'Failed to load requests' });
    }
});
app.post('/api/requests', async (req, res) => {
    const userId = req.header('x-user-id');
    const { amount_requested, location, phone } = req.body;
    if (!userId) {
        return res.status(401).json({ error: 'Missing user token' });
    }
    if (!amount_requested || !location || !phone) {
        return res.status(400).json({ error: 'Amount, location, and phone are required' });
    }
    const user = await findUserById(userId);
    if (!user || user.role !== 'farmer') {
        return res.status(403).json({ error: 'Only farmers can make manure requests' });
    }
    try {
        const [result] = await pool.execute('INSERT INTO manure_requests (farmer_id, amount_requested, location, phone, status) VALUES (?, ?, ?, ?, ?)', [userId, amount_requested, location, phone, 'Pending']);
        res.json({ id: result.insertId || null, message: 'Manure request submitted' });
    }
    catch (error) {
        console.error('Failed to submit request:', error);
        res.status(500).json({ error: 'Failed to submit request' });
    }
});
app.patch('/api/requests/:id', async (req, res) => {
    const userId = req.header('x-user-id');
    const { status } = req.body;
    const { id } = req.params;
    if (!userId) {
        return res.status(401).json({ error: 'Missing user token' });
    }
    if (!['Pending', 'Processing', 'Ready', 'Completed'].includes(status)) {
        return res.status(400).json({ error: 'Invalid request status' });
    }
    const user = await findUserById(userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    if (user.role !== 'company' && user.role !== 'farmer') {
        return res.status(403).json({ error: 'Not authorized to update requests' });
    }
    try {
        await pool.execute('UPDATE manure_requests SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Request updated' });
    }
    catch (error) {
        console.error('Failed to update request:', error);
        res.status(500).json({ error: 'Failed to update request' });
    }
});
app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Backend server is running on http://0.0.0.0:${port}`);
});
//# sourceMappingURL=index.js.map