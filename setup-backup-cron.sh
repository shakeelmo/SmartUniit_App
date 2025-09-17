#!/bin/bash
# Setup Cron Jobs for OneDrive Backups

echo "🔄 Setting up automated OneDrive backup cron jobs..."

# Create backup script
cat > /var/backups/smartuniit_onedrive/backup-to-onedrive.sh << 'EOF'
#!/bin/bash
# Automated backup to OneDrive

BACKUP_DIR="/var/backups/smartuniit_onedrive"
LOG_FILE="/var/logs/backups/onedrive-backup.log"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo "[$TIMESTAMP] Starting OneDrive backup..." >> "$LOG_FILE"

# Create database backup
DB_PATH="/var/www/smartuniit-taskflow/data/smartuniit_taskflow.db"
DB_BACKUP="$BACKUP_DIR/smartuniit_db_$(date +%Y%m%d_%H%M%S).sqlite.gz"

if [ -f "$DB_PATH" ]; then
    sqlite3 "$DB_PATH" ".backup '$BACKUP_DIR/temp_backup.sqlite'" && \
    gzip -c "$BACKUP_DIR/temp_backup.sqlite" > "$DB_BACKUP" && \
    rm "$BACKUP_DIR/temp_backup.sqlite"
    
    if [ $? -eq 0 ]; then
        echo "[$TIMESTAMP] Database backup created: $DB_BACKUP" >> "$LOG_FILE"
    else
        echo "[$TIMESTAMP] Database backup failed!" >> "$LOG_FILE"
    fi
fi

# Create application files backup
APP_BACKUP="$BACKUP_DIR/app_files_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$APP_BACKUP" -C /var/www/smartuniit-taskflow \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=.git \
    . 2>/dev/null

if [ $? -eq 0 ]; then
    echo "[$TIMESTAMP] Application files backup created: $APP_BACKUP" >> "$LOG_FILE"
else
    echo "[$TIMESTAMP] Application files backup failed!" >> "$LOG_FILE"
fi

# Sync to OneDrive
echo "[$TIMESTAMP] Syncing to OneDrive..." >> "$LOG_FILE"
rclone sync "$BACKUP_DIR" onedrive:SmartUniit_Backups/$(date +%Y-%m) \
    --progress \
    --log-file="$LOG_FILE" \
    --log-level=INFO

if [ $? -eq 0 ]; then
    echo "[$TIMESTAMP] OneDrive sync completed successfully" >> "$LOG_FILE"
    
    # Clean up old local backups (keep last 7 days)
    find "$BACKUP_DIR" -name "*.sqlite.gz" -mtime +7 -delete 2>/dev/null
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete 2>/dev/null
    
    echo "[$TIMESTAMP] Cleanup completed" >> "$LOG_FILE"
else
    echo "[$TIMESTAMP] OneDrive sync failed!" >> "$LOG_FILE"
fi

echo "[$TIMESTAMP] Backup process completed" >> "$LOG_FILE"
EOF

# Make backup script executable
chmod +x /var/backups/smartuniit_onedrive/backup-to-onedrive.sh

# Create cron job for daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /var/backups/smartuniit_onedrive/backup-to-onedrive.sh") | crontab -

# Create cron job for weekly full backup on Sundays at 3 AM
(crontab -l 2>/dev/null; echo "0 3 * * 0 /var/backups/smartuniit_onedrive/backup-to-onedrive.sh") | crontab -

echo "✅ Cron jobs configured:"
echo "   - Daily backup at 2:00 AM"
echo "   - Weekly backup at 3:00 AM (Sunday)"
echo ""
echo "📋 To test the backup manually:"
echo "   /var/backups/smartuniit_onedrive/backup-to-onedrive.sh"
echo ""
echo "📊 To view backup logs:"
echo "   tail -f /var/logs/backups/onedrive-backup.log"
echo ""
echo "🔍 To check cron jobs:"
echo "   crontab -l"

