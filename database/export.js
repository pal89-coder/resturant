// Export SQLite Database Data
const Database = require('./in-memory-db');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'yarmuk.db');
const exportPath = path.join(__dirname, '..', 'exports');

function exportDatabase() {
    try {
        // Create exports directory if it doesn't exist
        if (!fs.existsSync(exportPath)) {
            fs.mkdirSync(exportPath);
        }
        
        // Connect to database
        const { initializeDatabase } = require('./init');
        initializeDatabase();
        const db = new Database(dbPath);
        
        console.log('📊 Starting database export...');
        
        // Export all tables
        const exportData = {
            exportDate: new Date().toISOString(),
            databaseName: 'yarmuk.db',
            tables: {}
        };
        
        // Get all table names
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        
        tables.forEach(table => {
            const tableName = table.name;
            const stmt = db.prepare(`SELECT * FROM ${tableName}`);
            const rows = stmt.all();
            
            exportData.tables[tableName] = {
                count: rows.length,
                data: rows
            };
            
            console.log(`✅ Exported ${rows.length} records from ${tableName}`);
        });
        
        // Create JSON export
        const jsonFileName = `yarmuk_export_${Date.now()}.json`;
        const jsonFilePath = path.join(exportPath, jsonFileName);
        fs.writeFileSync(jsonFilePath, JSON.stringify(exportData, null, 2));
        
        // Create CSV exports for each table
        tables.forEach(table => {
            const tableName = table.name;
            const csvFileName = `${tableName}_export_${Date.now()}.csv`;
            const csvFilePath = path.join(exportPath, csvFileName);
            
            const stmt = db.prepare(`SELECT * FROM ${tableName}`);
            const rows = stmt.all();
            
            if (rows.length > 0) {
                const headers = Object.keys(rows[0]);
                const csvContent = [
                    headers.join(','),
                    ...rows.map(row => headers.map(header => {
                        const value = row[header];
                        // Handle null values and escape commas
                        if (value === null) return '';
                        const stringValue = String(value);
                        if (stringValue.includes(',') || stringValue.includes('"')) {
                            return `"${stringValue.replace(/"/g, '""')}"`;
                        }
                        return stringValue;
                    }).join(','))
                ].join('\n');
                
                fs.writeFileSync(csvFilePath, csvContent);
                console.log(`✅ Created CSV: ${csvFileName}`);
            }
        });
        
        // Copy the database file
        const dbCopyPath = path.join(exportPath, `yarmuk_backup_${Date.now()}.db`);
        const dbData = typeof db.export === 'function' ? db.export() : (fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : Buffer.from(''));
        fs.writeFileSync(dbCopyPath, dbData);
        console.log(`✅ Created database backup: yarmuk_backup_${Date.now()}.db`);
        
        db.close();
        
        console.log('🎉 Export completed successfully!');
        console.log(`📁 Export location: ${exportPath}`);
        console.log(`📄 JSON export: ${jsonFileName}`);
        
        return {
            success: true,
            exportPath,
            jsonFileName,
            totalTables: tables.length,
            totalRecords: Object.values(exportData.tables).reduce((sum, table) => sum + table.count, 0)
        };
    } catch (error) {
        console.error('❌ Export failed:', error);
        return { success: false, error: error.message };
    }
}

// Run export if called directly
if (require.main === module) {
    const result = exportDatabase();
    if (result.success) {
        console.log('\n📊 Export Summary:');
        console.log(`- Total tables: ${result.totalTables}`);
        console.log(`- Total records: ${result.totalRecords}`);
        console.log(`- Export location: ${result.exportPath}`);
    } else {
        process.exit(1);
    }
}

module.exports = { exportDatabase };