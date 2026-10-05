# YARMUK Restaurant - SQLite Database System

Complete restaurant management system with SQLite database backend using Node.js.

## Features

- 🍽️ Restaurant landing page with menu items
- 👤 User authentication (registration/login)
- 📅 Reservation system
- 🌍 Bilingual support (English/Arabic)
- 💾 SQLite database with Node.js backend
- 📊 Data export and import functionality
- 🔐 JWT authentication
- 📱 Responsive design

## Installation

1. **Install Node.js dependencies:**
```bash
npm install
```

2. **Initialize the database:**
```bash
npm run init-db
```

This will create the SQLite database file (`yarmuk.db`) with all necessary tables and sample data.

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

## Database Management

### Export Data

**Export all data to JSON:**
```bash
npm run export-data
```

This creates:
- JSON export file in the `exports/` directory
- CSV files for each table
- Database backup file

**Export via API:**
- `GET /api/export` - Export all data as JSON
- `GET /api/download-database` - Download the SQLite database file

### Import Data

**Import from JSON file:**
```bash
npm run import-data <export-file.json>
```

**Import database file:**
```bash
npm run import-data --db <database-file.db>
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `GET /api/profile` - Get user profile (requires authentication)

### Reservations
- `POST /api/reservations` - Create reservation (requires authentication)

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu?category=breakfast` - Get items by category

### Contact
- `POST /api/contact` - Submit contact message

### Admin
- `GET /api/stats` - Get database statistics
- `GET /api/export` - Export all data
- `GET /api/download-database` - Download database file

## Database Tables

### Users
- User accounts with authentication
- Fields: id, username, email, password, created_at, updated_at

### Reservations
- Restaurant reservations
- Fields: id, user_id, name, email, phone, date, time, guests, status, created_at

### Menu Items
- Restaurant menu with categories
- Fields: id, category, name, description, price, image_url, available, created_at

### Contact Messages
- Contact form submissions
- Fields: id, name, email, subject, message, status, created_at

### Orders
- Customer orders
- Fields: id, user_id, reservation_id, total_amount, status, created_at

### Order Items
- Individual order items
- Fields: id, order_id, menu_item_id, quantity, price

## Frontend Pages

- `index.html` - Main landing page (English)
- `index-arabic.html` - Main landing page (Arabic)
- `login.html` - User login page
- `login-arabic.html` - User login page (Arabic)
- `profile.html` - User profile page
- `signup.html` - User registration page

## Sample Data

The database initialization includes:
- 3 sample users (admin, user1, user2)
- 12 menu items (breakfast, dinner, drinks, sweets)
- 2 sample reservations

Default credentials:
- Username: `admin`
- Password: `password123`

## Security Notes

⚠️ **Important for Production:**
1. Change the JWT_SECRET in `.env` file
2. Use strong password hashing (bcrypt is implemented)
3. Implement rate limiting
4. Add HTTPS/SSL
5. Implement proper input validation
6. Add CORS restrictions
7. Use environment variables for sensitive data

## File Structure

```
RAHAF/
├── database/
│   ├── init.js          # Database initialization
│   ├── export.js        # Data export functionality
│   └── import.js        # Data import functionality
├── exports/             # Exported data files
├── index.html           # English landing page
├── index-arabic.html    # Arabic landing page
├── login.html           # Login page
├── login-arabic.html    # Arabic login page
├── profile.html         # User profile
├── server.js            # Express server
├── database.js          # Client-side database
├── package.json         # Node.js dependencies
├── yarmuk.db           # SQLite database file
└── .env                # Environment variables
```

## Troubleshooting

### Database locked error
```bash
# Make sure no other process is using the database
# On Windows: check for processes accessing yarmuk.db
# On Linux/Mac: lsof yarmuk.db
```

### Port already in use
```bash
# Change port in .env file or kill the process using port 3000
```

### Missing dependencies
```bash
npm install
```

## License

ISC