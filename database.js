// SQLite Database Management for YARMUK Restaurant
// Using sql.js for client-side SQLite functionality

class DatabaseManager {
    constructor() {
        this.db = null;
        this.initDatabase();
    }

    async initDatabase() {
        try {
            // Initialize SQL.js
            const SQL = await initSqlJs({
                locateFile: file => `https://sql.js.org/dist/${file}`
            });

            // Create database
            this.db = new SQL.Database();

            // Create tables
            this.createTables();

            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Error initializing database:', error);
        }
    }

    createTables() {
        // Users table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Reservations table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS reservations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                guests INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        // Contact messages table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT,
                message TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Database tables created successfully');
    }

    // User operations
    registerUser(username, email, password) {
        try {
            // Hash password (simple implementation - in production use proper hashing)
            const hashedPassword = this.hashPassword(password);
            
            const stmt = this.db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
            stmt.run([username, email, hashedPassword]);
            stmt.free();
            
            return { success: true, message: 'User registered successfully' };
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                return { success: false, message: 'Username or email already exists' };
            }
            return { success: false, message: 'Registration failed: ' + error.message };
        }
    }

    loginUser(username, password) {
        try {
            const hashedPassword = this.hashPassword(password);
            
            const stmt = this.db.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
            const user = stmt.get([username, hashedPassword]);
            stmt.free();
            
            if (user) {
                return { success: true, user: { id: user.id, username: user.username, email: user.email } };
            } else {
                return { success: false, message: 'Invalid username or password' };
            }
        } catch (error) {
            return { success: false, message: 'Login failed: ' + error.message };
        }
    }

    getUserByEmail(email) {
        try {
            const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
            const user = stmt.get([email]);
            stmt.free();
            return user;
        } catch (error) {
            console.error('Error getting user by email:', error);
            return null;
        }
    }

    // Reservation operations
    addReservation(userId, name, email, phone, date, time, guests) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO reservations (user_id, name, email, phone, date, time, guests)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            stmt.run([userId, name, email, phone, date, time, guests]);
            stmt.free();
            
            return { success: true, message: 'Reservation added successfully' };
        } catch (error) {
            return { success: false, message: 'Reservation failed: ' + error.message };
        }
    }

    getUserReservations(userId) {
        try {
            const stmt = this.db.prepare('SELECT * FROM reservations WHERE user_id = ? ORDER BY date DESC, time DESC');
            const reservations = stmt.all([userId]);
            stmt.free();
            return reservations;
        } catch (error) {
            console.error('Error getting user reservations:', error);
            return [];
        }
    }

    // Contact message operations
    addContactMessage(name, email, subject, message) {
        try {
            const stmt = this.db.prepare(`
                INSERT INTO contact_messages (name, email, subject, message)
                VALUES (?, ?, ?, ?)
            `);
            stmt.run([name, email, subject, message]);
            stmt.free();
            
            return { success: true, message: 'Message sent successfully' };
        } catch (error) {
            return { success: false, message: 'Message failed: ' + error.message };
        }
    }

    // Utility functions
    hashPassword(password) {
        // Simple hash function - in production use bcrypt or similar
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    }

    // Export database to file (for persistence)
    exportDatabase() {
        try {
            const data = this.db.export();
            const buffer = new Buffer.from(data);
            return buffer;
        } catch (error) {
            console.error('Error exporting database:', error);
            return null;
        }
    }

    // Import database from file
    importDatabase(buffer) {
        try {
            this.db = new SQL.Database(buffer);
            return { success: true, message: 'Database imported successfully' };
        } catch (error) {
            return { success: false, message: 'Import failed: ' + error.message };
        }
    }

    // Get database statistics
    getStatistics() {
        try {
            const userCount = this.db.exec('SELECT COUNT(*) as count FROM users')[0].values[0][0];
            const reservationCount = this.db.exec('SELECT COUNT(*) as count FROM reservations')[0].values[0][0];
            const messageCount = this.db.exec('SELECT COUNT(*) as count FROM contact_messages')[0].values[0][0];
            
            return {
                users: userCount,
                reservations: reservationCount,
                messages: messageCount
            };
        } catch (error) {
            console.error('Error getting statistics:', error);
            return { users: 0, reservations: 0, messages: 0 };
        }
    }

    // Close database
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}

// Initialize database manager
let dbManager = null;

// Load sql.js library dynamically
function loadSqlJs() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://sql.js.org/dist/sql-wasm.js';
        script.onload = () => {
            resolve(window.initSqlJs);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Initialize database when page loads
async function initializeDatabase() {
    try {
        await loadSqlJs();
        dbManager = new DatabaseManager();
        return dbManager;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        return null;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DatabaseManager, initializeDatabase };
}