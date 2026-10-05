# Quick Setup Guide for YARMUK Restaurant Database System

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database
```bash
npm run init-db
```

### 3. Start the Server
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📊 Data Export Options

### Option 1: Web Interface
1. Start the server: `npm start`
2. Open browser: `http://localhost:3000/admin.html`
3. Click "Export JSON" or "Download Database"

### Option 2: Command Line
```bash
# Export all data
npm run export-data

# Import data from JSON
npm run import-data exports/yarmuk_export_1234567890.json
```

### Option 3: API Endpoints
```bash
# Export JSON
curl http://localhost:3000/api/export

# Download database
curl http://localhost:3000/api/download-database --output yarmuk.db
```

## 🔑 Default Credentials

- **Username:** admin
- **Password:** password123

## 📁 File Locations

- **Database:** `yarmuk.db` (created after initialization)
- **Exports:** `exports/` directory
- **Server:** `server.js`
- **Database scripts:** `database/` directory

## 🛠️ Troubleshooting

### Port Already in Use
Change port in `.env` file:
```
PORT=3001
```

### Database Not Found
Run initialization:
```bash
npm run init-db
```

### Dependencies Missing
```bash
npm install
```

## 📱 Access Points

- **Main Site:** `http://localhost:3000/index.html`
- **Admin Dashboard:** `http://localhost:3000/admin.html`
- **Profile:** `http://localhost:3000/profile.html`
- **Login:** `http://localhost:3000/login.html`

## 🔒 Security Notes

⚠️ **Before Production:**
1. Change JWT_SECRET in `.env`
2. Use strong passwords
3. Enable HTTPS
4. Implement rate limiting
5. Add input validation