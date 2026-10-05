// Import Data to SQLite Database
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'yarmuk.db');

function importData(importFilePath) {
    try {
        // Check if import file exists
        if (!fs.existsSync(importFilePath)) {
            throw new Error(`Import file not found: ${importFilePath}`);
        }
        
        // Read import file
        const importData = JSON.parse(fs.readFileSync(importFilePath, 'utf8'));
        
        console.log('📥 Starting database import...');
        console.log(`📄 Import file: ${importFilePath}`);
        console.log(`📅 Export date: ${importData.exportDate}`);
        
        // Connect to database
        const db = new Database(dbPath);
        db.pragma('foreign_keys = OFF'); // Disable foreign keys during import
        
        let totalImported = 0;
        let totalErrors = 0;
        
        // Import each table
        Object.keys(importData.tables).forEach(tableName => {
            const tableData = importData.tables[tableName];
            const records = tableData.data;
            
            console.log(`\n📥 Importing ${records.length} records to ${tableName}...`);
            
            if (records.length === 0) {
                console.log(`⏭️  Skipping empty table: ${tableName}`);
                return;
            }
            
            try {
                // Clear existing data
                db.prepare(`DELETE FROM ${tableName}`).run();
                
                // Get column names from first record
                const columns = Object.keys(records[0]);
                const placeholders = columns.map(() => '?').join(',');
                const columnNames = columns.join(',');
                
                // Prepare insert statement
                const stmt = db.prepare(`INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`);
                
                // Begin transaction
                const insertMany = db.transaction((rows) => {
                    rows.forEach(row => {
                        const values = columns.map(col => row[col]);
                        stmt.run(values);
                    });
                });
                
                // Insert all records
                insertMany(records);
                
                console.log(`✅ Successfully imported ${records.length} records to ${tableName}`);
                totalImported += records.length;
            } catch (error) {
                console.error(`❌ Error importing to ${tableName}:`, error.message);
                totalErrors++;
            }
        });
        
        // Re-enable foreign keys
        db.pragma('foreign_keys = ON');
        
        db.close();
        
        console.log('\n🎉 Import completed!');
        console.log(`📊 Total records imported: ${totalImported}`);
        console.log(`❌ Total errors: ${totalErrors}`);
        
        return {
            success: true,
            totalImported,
            totalErrors,
            tablesProcessed: Object.keys(importData.tables).length
        };
    } catch (error) {
        console.error('❌ Import failed:', error);
        return { success: false, error: error.message };
    }
}

function importDatabaseFile(dbFilePath) {
    try {
        // Check if database file exists
        if (!fs.existsSync(dbFilePath)) {
            throw new Error(`Database file not found: ${dbFilePath}`);
        }
        
        console.log('📥 Starting database file import...');
        console.log(`📁 Source file: ${dbFilePath}`);
        
        // Read source database
        const sourceData = fs.readFileSync(dbFilePath);
        
        // Backup current database
        if (fs.existsSync(dbPath)) {
            const backupPath = path.join(__dirname, '..', `yarmuk_backup_before_import_${Date.now()}.db`);
            fs.copyFileSync(dbPath, backupPath);
            console.log(`💾 Created backup: ${backupPath}`);
        }
        
        // Copy new database
        fs.writeFileSync(dbPath, sourceData);
        
        console.log('✅ Database file imported successfully!');
        console.log(`📁 New database location: ${dbPath}`);
        
        return { success: true, message: 'Database file imported successfully' };
    } catch (error) {
        console.error('❌ Database file import failed:', error);
        return { success: false, error: error.message };
    }
}

// Run import if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node import.js <export-file.json>');
        console.log('   or: node import.js --db <database-file.db>');
        process.exit(1);
    }
    
    let result;
    
    if (args[0] === '--db' && args[1]) {
        // Import database file
        result = importDatabaseFile(args[1]);
    } else {
        // Import JSON export
        result = importData(args[0]);
    }
    
    if (result.success) {
        console.log('\n✅ Import completed successfully!');
    } else {
        console.log('\n❌ Import failed!');
        process.exit(1);
    }
}

module.exports = { importData, importDatabaseFile };