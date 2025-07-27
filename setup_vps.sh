#!/bin/bash

# Enhanced VPS Setup Script for PulseChain Transaction Counter API
# This script sets up the service with persistent state and retry logic

set -e

echo "=== PulseChain API VPS Setup ==="

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
echo "Installing Python and dependencies..."
sudo apt install python3 python3-pip python3-venv curl wget jq nginx -y

# Create application directory
APP_DIR="/opt/pulsechain-api"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Copy API script
echo "Installing PulseChain API..."
cp pulsechain_api.py $APP_DIR/
cd $APP_DIR

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install required packages
pip install requests

# Ensure web directory exists
sudo mkdir -p /var/www/html
sudo chown $USER:$USER /var/www/html

# Create systemd service file
SERVICE_FILE="/etc/systemd/system/pulsechain-api.service"
sudo tee $SERVICE_FILE > /dev/null <<EOF
[Unit]
Description=PulseChain Transaction Counter API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
Environment=PATH=$APP_DIR/venv/bin
ExecStart=$APP_DIR/venv/bin/python3 $APP_DIR/pulsechain_api.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create Nginx configuration for data.pulsex.win
echo "Setting up Nginx configuration..."
sudo tee /etc/nginx/sites-available/pulsechain-data > /dev/null <<EOF
server {
    listen 80;
    server_name data.pulsex.win;

    location / {
        root /var/www/html;
        try_files $uri $uri/ =404;
    }

    location /totaltxns.json {
        root /var/www/html;
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
        add_header Content-Type application/json;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
            add_header Content-Length 0;
            return 204;
        }
    }

    # Optional: HTTPS redirect (uncomment after SSL setup)
    # return 301 https://$server_name$request_uri;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/pulsechain-data /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Start the service
echo "Starting PulseChain API service..."
sudo systemctl daemon-reload
sudo systemctl enable pulsechain-api
sudo systemctl start pulsechain-api

# Create enhanced monitoring script
echo "Creating monitoring script..."
cat > /home/$USER/check_api.sh <<'EOF'
#!/bin/bash
# Enhanced monitoring for PulseChain API

LOG_FILE="/home/$USER/pulsechain_monitor.log"
JSON_FILE="/var/www/html/totaltxns.json"

# Check service status
if ! systemctl is-active --quiet pulsechain-api; then
    echo "$(date): Service not running, restarting..." >> $LOG_FILE
    systemctl restart pulsechain-api
fi

# Check if JSON file exists
if [ ! -f $JSON_FILE ]; then
    echo "$(date): JSON file missing, forcing update..." >> $LOG_FILE
    systemctl restart pulsechain-api
fi

# Check if JSON is valid and recent (within 10 minutes)
if [ -f $JSON_FILE ]; then
    if ! jq . $JSON_FILE >/dev/null 2>&1; then
        echo "$(date): JSON file corrupted, restarting service..." >> $LOG_FILE
        systemctl restart pulsechain-api
    fi
    
    # Check file age (not older than 15 minutes)
    FILE_AGE=$(stat -c %Y $JSON_FILE)
    CURRENT_TIME=$(date +%s)
    AGE_DIFF=$((CURRENT_TIME - FILE_AGE))
    
    if [ $AGE_DIFF -gt 900 ]; then  # 15 minutes
        echo "$(date): JSON file stale (${AGE_DIFF}s), restarting service..." >> $LOG_FILE
        systemctl restart pulsechain-api
    fi
fi
EOF

chmod +x /home/$USER/check_api.sh

# Add enhanced monitoring cron job
echo "Setting up monitoring cron job..."
(crontab -l 2>/dev/null; echo "*/2 * * * * /home/$USER/check_api.sh") | crontab -

# Create log rotation
echo "Setting up log rotation..."
sudo tee /etc/logrotate.d/pulsechain-api > /dev/null <<EOF
/var/log/pulsechain-api/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 $USER $USER
}
EOF

echo ""
echo "=== Setup Complete ==="
echo "Service: pulsechain-api"
echo "Config file: $SERVICE_FILE"
echo "Output file: /var/www/html/totaltxns.json"
echo "State file: /tmp/pulsechain_state.json"
echo ""
echo "Commands:"
echo "  sudo systemctl start pulsechain-api"
echo "  sudo systemctl stop pulsechain-api"
echo "  sudo systemctl restart pulsechain-api"
echo "  sudo systemctl status pulsechain-api"
echo "  sudo journalctl -u pulsechain-api -f"
echo ""
echo "Test the API:"
echo "  curl https://data.pulsex.win/totaltxns.json"
echo ""
echo "Monitoring:"
echo "  tail -f /home/$USER/pulsechain_monitor.log"