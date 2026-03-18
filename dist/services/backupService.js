import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../prisma/dev.db');
const BACKUP_DIR = path.join(__dirname, '../../prisma/backups');
const BACKUP_INTERVAL = 60 * 60 * 1000; // 1 hour
// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
function getBackupFileName() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `dev.db.backup.${year}${month}${day}-${hours}${minutes}${seconds}`;
}
export function createDatabaseBackup() {
    try {
        if (!fs.existsSync(DB_PATH)) {
            console.log('Database file does not exist yet, skipping backup');
            return null;
        }
        const backupFileName = getBackupFileName();
        const backupPath = path.join(BACKUP_DIR, backupFileName);
        fs.copyFileSync(DB_PATH, backupPath);
        console.log(`✓ Database backup created: ${backupFileName}`);
        // Keep only last 24 backups (1 day of hourly backups)
        const backups = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('dev.db.backup.'))
            .sort()
            .reverse();
        if (backups.length > 24) {
            backups.slice(24).forEach(backup => {
                try {
                    fs.unlinkSync(path.join(BACKUP_DIR, backup));
                    console.log(`🗑️  Deleted old backup: ${backup}`);
                }
                catch (err) {
                    console.error(`Failed to delete backup ${backup}:`, err.message);
                }
            });
        }
        return backupPath;
    }
    catch (err) {
        console.error('✗ Database backup failed:', err.message);
        return null;
    }
}
export function initializeBackupScheduler() {
    console.log('🔄 Initializing database backup scheduler...');
    // Create initial backup
    createDatabaseBackup();
    // Schedule hourly backups
    const intervalId = setInterval(() => {
        createDatabaseBackup();
    }, BACKUP_INTERVAL);
    console.log('✓ Backup scheduler started (hourly)');
    console.log(`📁 Backup directory: ${BACKUP_DIR}`);
    return intervalId;
}
export function listBackups() {
    try {
        const backups = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('dev.db.backup.'))
            .sort()
            .reverse();
        return backups.map(filename => {
            const filePath = path.join(BACKUP_DIR, filename);
            const stats = fs.statSync(filePath);
            return {
                filename,
                size: stats.size,
                created: stats.mtime
            };
        });
    }
    catch (err) {
        console.error('Failed to list backups:', err.message);
        return [];
    }
}
export function restoreFromBackup(backupFilename) {
    try {
        const backupPath = path.join(BACKUP_DIR, backupFilename);
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup not found: ${backupFilename}`);
        }
        // Create backup of current state first
        if (fs.existsSync(DB_PATH)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const currentBackup = path.join(BACKUP_DIR, `dev.db.backup.before-restore.${timestamp}`);
            fs.copyFileSync(DB_PATH, currentBackup);
            console.log(`Current database backed up to: ${currentBackup}`);
        }
        fs.copyFileSync(backupPath, DB_PATH);
        console.log(`✓ Database restored from: ${backupFilename}`);
        return true;
    }
    catch (err) {
        console.error('Restore failed:', err.message);
        return false;
    }
}
