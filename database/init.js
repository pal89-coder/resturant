// SQLite Database Initialization for YARMUK Restaurant
const Database = require('./in-memory-db');
const path = require('path');
const bcrypt = require('bcryptjs');

// Database file path
const dbPath = path.join(__dirname, '..', 'yarmuk.db');

// Initialize database
function initializeDatabase() {
    try {
        // Create database connection
        const db = new Database(dbPath);
        
        console.log('✅ Database connection established');
        
        // Enable foreign keys
        db.pragma('foreign_keys = ON');
        
        // Create tables
        createTables(db);
        
        // Insert sample data
        insertSampleData(db);
        
        console.log('✅ Database initialized successfully');
        console.log(`📁 Database location: ${dbPath}`);
        
        db.close();
        return true;
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        return false;
    }
}

function createTables(db) {
    // Users table
    db.exec(`
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
    db.exec(`
        CREATE TABLE IF NOT EXISTS reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            guests INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
    `);
    
    // Contact messages table
    db.exec(`
        CREATE TABLE IF NOT EXISTS contact_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT,
            message TEXT NOT NULL,
            status TEXT DEFAULT 'unread',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Menu items table
    db.exec(`
        CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            image_url TEXT,
            available BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Orders table
    db.exec(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            reservation_id INTEGER,
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE SET NULL
        )
    `);
    
    // Order items table
    db.exec(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            menu_item_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
        )
    `);
    
    console.log('✅ Database tables created');
}

function insertSampleData(db) {
    // Check if data already exists
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount > 0) {
        console.log('ℹ️  Sample data already exists, skipping insertion');
        return;
    }
    
    // Insert sample users
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    const insertUser = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    insertUser.run('admin', 'admin@yarmuk.com', hashedPassword);
    insertUser.run('user1', 'user1@example.com', hashedPassword);
    insertUser.run('user2', 'user2@example.com', hashedPassword);
    
    // Insert sample menu items
    const insertMenuItem = db.prepare('INSERT INTO menu_items (category, name, description, price, image_url) VALUES (?, ?, ?, ?, ?)');
    
    // Breakfast items
    insertMenuItem.run('breakfast', 'Avocado Toast', 'Sourdough with smashed avocado, poached egg, and microgreens', 16.00, 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=300&fit=crop');
    insertMenuItem.run('breakfast', 'Classic Pancakes', 'Fluffy pancakes with maple syrup and fresh berries', 14.00, 'https://images.unsplash.com/photo-1494390248081-4e521a5940db?w=400&h=300&fit=crop');
    insertMenuItem.run('breakfast', 'Eggs Benedict', 'English muffin, poached eggs, hollandaise sauce', 18.00, 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop');
    
    // Dinner items
    insertMenuItem.run('dinner', 'Grilled Lamb Chops', 'Tender lamb with rosemary and garlic reduction', 45.00, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop');
    insertMenuItem.run('dinner', 'Pan-Seared Salmon', 'Fresh Atlantic salmon with lemon butter sauce', 38.00, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop');
    insertMenuItem.run('dinner', 'Truffle Risotto', 'Creamy arborio rice with black truffle and parmesan', 32.00, 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop');
    insertMenuItem.run('dinner', 'Wagyu Beef Tenderloin', 'Premium A5 wagyu with red wine jus', 65.00, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop');
    
    // Drinks
    insertMenuItem.run('drinks', 'Rosemary Gin Fizz', 'Gin, fresh lemon, rosemary syrup, egg white', 14.00, 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop');
    insertMenuItem.run('drinks', 'Spicy Margarita', 'Tequila, jalapeño, lime, agave nectar', 12.00, 'https://images.unsplash.com/photo-1536935338788-843bb528bc2e?w=400&h=300&fit=crop');
    insertMenuItem.run('drinks', 'Berry Mojito', 'Rum, mixed berries, mint, lime, soda', 11.00, 'https://images.unsplash.com/photo-1551028919-ac66c5f85b43?w=400&h=300&fit=crop');
    insertMenuItem.run('drinks', 'Espresso Martini', 'Vodka, fresh espresso, coffee liqueur', 13.00, 'https://images.unsplash.com/photo-1560512823-829485b8bf24?w=400&h=300&fit=crop');
    
    // Sweets
    insertMenuItem.run('sweets', 'Chocolate Lava Cake', 'Warm chocolate cake with molten center', 12.00, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop');
    insertMenuItem.run('sweets', 'Crème Brûlée', 'Classic vanilla custard with caramelized sugar', 10.00, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop');
    insertMenuItem.run('sweets', 'Tiramisu', 'Italian coffee-flavored layered dessert', 11.00, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop');
    insertMenuItem.run('sweets', 'Raspberry Tart', 'Fresh raspberries on vanilla pastry cream', 9.00, 'https://images.unsplash.com/photo-1626803775151-61d756612f97?w=400&h=300&fit=crop');
    
    // Insert sample reservations
    const insertReservation = db.prepare('INSERT INTO reservations (user_id, name, email, phone, date, time, guests) VALUES (?, ?, ?, ?, ?, ?, ?)');
    insertReservation.run(1, 'John Doe', 'john@example.com', '+1 555-123-4567', '2024-10-15', '19:00', 4);
    insertReservation.run(2, 'Jane Smith', 'jane@example.com', '+1 555-987-6543', '2024-10-20', '20:00', 2);
    
    console.log('✅ Sample data inserted');
}

// Run initialization if called directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };