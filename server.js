// Express Server for YARMUK Restaurant
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('./database/in-memory-db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initializeDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Ensure database schema and seed data are initialized
initializeDatabase();

// Database connection
const dbPath = path.join(__dirname, 'yarmuk.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// API Routes

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user
        const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
        const result = stmt.run(username, email, hashedPassword);
        
        res.status(201).json({ 
            success: true, 
            message: 'User registered successfully',
            userId: result.lastInsertRowid 
        });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find user
        const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
        const user = stmt.get(username);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({ 
            success: true, 
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get User Profile
app.get('/api/profile', authenticateToken, (req, res) => {
    try {
        const stmt = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?');
        const user = stmt.get(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Get user reservations
        const reservationStmt = db.prepare('SELECT * FROM reservations WHERE user_id = ? ORDER BY date DESC');
        const reservations = reservationStmt.all(req.user.userId);
        
        res.json({ user, reservations });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Create Reservation
app.post('/api/reservations', authenticateToken, (req, res) => {
    try {
        const { name, email, phone, date, time, guests } = req.body;
        
        const stmt = db.prepare(`
            INSERT INTO reservations (user_id, name, email, phone, date, time, guests)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(req.user.userId, name, email, phone, date, time, guests);
        
        res.status(201).json({ 
            success: true, 
            message: 'Reservation created successfully',
            reservationId: result.lastInsertRowid 
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create reservation' });
    }
});

// Get All Menu Items
app.get('/api/menu', (req, res) => {
    try {
        const category = req.query.category;
        let stmt;
        
        if (category) {
            stmt = db.prepare('SELECT * FROM menu_items WHERE category = ? AND available = 1');
            const items = stmt.all(category);
            res.json({ items });
        } else {
            stmt = db.prepare('SELECT * FROM menu_items WHERE available = 1');
            const items = stmt.all();
            res.json({ items });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch menu' });
    }
});

// Submit Contact Message
app.post('/api/contact', (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        const stmt = db.prepare(`
            INSERT INTO contact_messages (name, email, subject, message)
            VALUES (?, ?, ?, ?)
        `);
        stmt.run(name, email, subject, message);
        
        res.status(201).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// Database Statistics
app.get('/api/stats', (req, res) => {
    try {
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        const reservationCount = db.prepare('SELECT COUNT(*) as count FROM reservations').get().count;
        const messageCount = db.prepare('SELECT COUNT(*) as count FROM contact_messages').get().count;
        const menuItemCount = db.prepare('SELECT COUNT(*) as count FROM menu_items').get().count;
        
        res.json({
            users: userCount,
            reservations: reservationCount,
            messages: messageCount,
            menuItems: menuItemCount
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Export All Data
app.get('/api/export', (req, res) => {
    try {
        const exportData = {
            users: db.prepare('SELECT * FROM users').all(),
            reservations: db.prepare('SELECT * FROM reservations').all(),
            contactMessages: db.prepare('SELECT * FROM contact_messages').all(),
            menuItems: db.prepare('SELECT * FROM menu_items').all(),
            orders: db.prepare('SELECT * FROM orders').all(),
            orderItems: db.prepare('SELECT * FROM order_items').all(),
            exportDate: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: exportData
        });
    } catch (error) {
        res.status(500).json({ error: 'Export failed' });
    }
});

// Download SQLite Database
app.get('/api/download-database', (req, res) => {
    try {
        const data = db.export();
        const buffer = Buffer.from(data);
        
        res.setHeader('Content-Type', 'application/x-sqlite3');
        res.setHeader('Content-Disposition', 'attachment; filename=yarmuk.db');
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ error: 'Download failed' });
    }
});

// Middleware: Authenticate JWT Token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📁 Database: ${dbPath}`);
    console.log(`🔑 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down server...');
    db.close();
    process.exit(0);
});