import { restoreFromBackup, listBackups } from './src/services/backupService.js'

console.log('📋 Available backups:')
const backups = listBackups()
backups.forEach((backup, idx) => {
  const sizeMB = (backup.size / (1024 * 1024)).toFixed(2)
  console.log(`  ${idx + 1}. ${backup.filename} (${sizeMB} MB) - ${backup.created.toLocaleString()}`)
})

if (backups.length === 0) {
  console.log('No backups found!')
  process.exit(1)
}

// Restore the most recent backup
const mostRecent = backups[0]
console.log(`\n🔄 Restoring from: ${mostRecent.filename}`)
const success = restoreFromBackup(mostRecent.filename)

if (success) {
  console.log('✓ Restore complete! Your data has been recovered.')
  console.log('Please restart the backend server.')
} else {
  console.log('✗ Restore failed!')
}

process.exit(success ? 0 : 1)
