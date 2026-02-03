#!/bin/bash
set -e

# Update system
yum update -y

# Install Docker
yum install -y docker

# Start Docker service
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Pull the Minecraft server Docker image
docker pull itzg/minecraft-server:latest

# Create directory for Minecraft data
mkdir -p /opt/minecraft-data
chown 1000:1000 /opt/minecraft-data

# Run Minecraft server container
docker run -d \
  --name minecraft-server \
  --restart unless-stopped \
  -p 25565:25565 \
  -v /opt/minecraft-data:/data \
%s \
  itzg/minecraft-server

# Log the container status
echo "Minecraft server container started" >> /var/log/minecraft-setup.log
docker logs minecraft-server >> /var/log/minecraft-setup.log 2>&1

# Install AWS CLI v2 for auto-shutdown
yum install -y unzip
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install
rm -rf /tmp/aws /tmp/awscliv2.zip

# Create auto-shutdown monitor script
cat > /usr/local/bin/minecraft-auto-shutdown.sh << 'EOF'
#!/bin/bash
SHUTDOWN_DELAY=300
CHECK_INTERVAL=10
LOG_FILE="/var/log/minecraft-auto-shutdown.log"
REGION="us-east-1"

echo "$(date): Auto-shutdown monitor started (300 second delay after server empty)" >> "$LOG_FILE"

# Get IMDSv2 token
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" -s)

# Retry metadata fetch up to 30 times (30 seconds)
for i in {1..30}; do
    INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" -s http://169.254.169.254/latest/meta-data/instance-id)
    if [ -n "$INSTANCE_ID" ]; then
        break
    fi
    sleep 1
done

if [ -z "$INSTANCE_ID" ]; then
    echo "$(date): ERROR - Could not retrieve instance ID from metadata service!" >> "$LOG_FILE"
    exit 1
fi

echo "$(date): Instance $INSTANCE_ID in region $REGION" >> "$LOG_FILE"

# Wait for Minecraft server to fully start (reduced from 180 to 60 seconds)
sleep 60

echo "$(date): Monitoring for 'Server empty for 60 seconds, pausing' message..." >> "$LOG_FILE"

server_empty_time=0

while true; do
    if ! docker ps | grep -q minecraft-server; then
        echo "$(date): Container stopped, terminating..." >> "$LOG_FILE"
        aws ec2 terminate-instances --instance-ids "$INSTANCE_ID" --region "$REGION" >> "$LOG_FILE" 2>&1
        exit 0
    fi
    
    # Get recent logs (last 30 seconds to catch the message)
    recent_logs=$(docker logs --since 30s minecraft-server 2>&1)
    
    # Check if server empty message appeared
    if echo "$recent_logs" | grep -q "Server empty for 60 seconds, pausing"; then
        if [ $server_empty_time -eq 0 ]; then
            # First time seeing this message - start countdown
            server_empty_time=$(date +%s)
            echo "$(date): Server empty detected! Will terminate in $SHUTDOWN_DELAY seconds..." >> "$LOG_FILE"
        fi
    fi
    
    # If countdown is active, check if we should terminate or reset
    if [ $server_empty_time -ne 0 ]; then
        # Check if someone joined (only way to reset the countdown)
        if echo "$recent_logs" | grep -q "joined the game"; then
            echo "$(date): Player joined! Timer reset" >> "$LOG_FILE"
            server_empty_time=0
        else
            # No one joined - continue countdown
            current_time=$(date +%s)
            elapsed=$((current_time - server_empty_time))
            
            if [ $elapsed -ge $SHUTDOWN_DELAY ]; then
                echo "$(date): Shutdown delay reached ($elapsed seconds)! Terminating instance..." >> "$LOG_FILE"
                aws ec2 terminate-instances --instance-ids "$INSTANCE_ID" --region "$REGION" >> "$LOG_FILE" 2>&1
                echo "$(date): Terminate command sent" >> "$LOG_FILE"
                exit 0
            else
                echo "$(date): Server still empty... $elapsed/$SHUTDOWN_DELAY seconds" >> "$LOG_FILE"
            fi
        fi
    fi
    
    sleep $CHECK_INTERVAL
done
EOF

chmod +x /usr/local/bin/minecraft-auto-shutdown.sh

# Create systemd service
cat > /etc/systemd/system/minecraft-auto-shutdown.service << 'EOF'
[Unit]
Description=Minecraft Auto-Shutdown Monitor
After=docker.service
Requires=docker.service

[Service]
Type=simple
ExecStart=/usr/local/bin/minecraft-auto-shutdown.sh
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable minecraft-auto-shutdown.service
systemctl start minecraft-auto-shutdown.service

echo "$(date): Auto-shutdown monitor enabled" >> /var/log/minecraft-setup.log
echo "Minecraft server setup complete. Server is starting..." >> /var/log/minecraft-setup.log
