import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
// Default path relative to dist/config/database.js after build
const defaultDbPath = path.resolve(__dirname, '../../../database.sqlite');
const dbFilePath = process.env.DB_FILE || defaultDbPath;

const createUserTableSQL = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    createdAt DATETIME DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
    updatedAt DATETIME DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
);`;
const createUpdateTriggerSQL = `
CREATE TRIGGER IF NOT EXISTS update_users_updatedAt
AFTER UPDATE ON users FOR EACH ROW
BEGIN
    UPDATE users SET updatedAt = strftime('%Y-%m-%d %H:%M:%f', 'now') WHERE id = OLD.id;
END;`;

let dbInstance: Database | null = null;

export const initializeDatabase = async (): Promise<Database> => {
    if (dbInstance) return dbInstance;
    try {
        const vSqlite3 = sqlite3.verbose();
        console.log(`Initializing SQLite DB: ${dbFilePath}`);
        const db = await open({ filename: dbFilePath, driver: vSqlite3.Database });
        console.log('SQLite connected.');
        await db.exec('PRAGMA foreign_keys = ON;');
        await db.exec(createUserTableSQL);
        console.log(`Table 'users' ensured.`);
        await db.exec(createUpdateTriggerSQL);
        console.log(`Trigger 'update_users_updatedAt' ensured.`);
        dbInstance = db;
        return db;
    } catch (err) {
        console.error('FATAL: DB Init Failed:', err);
        process.exit(1);
    }
};
export const getDb = (): Database => {
    if (!dbInstance) throw new Error('DB not initialized.');
    return dbInstance;
};
export const closeDb = async (): Promise<void> => {
    if (dbInstance) try {
        await dbInstance.close();
        console.log('SQLite closed.');
        dbInstance = null;
    } catch (err) { console.error('Error closing SQLite:', err); }
};
