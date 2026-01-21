package services

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/diego4lbarracin/The_Minecraft_Server_Generator/models"
)

type MinecraftService struct {
	ec2Service *EC2Service
}

// NewMinecraftService creates a new Minecraft service instance
func NewMinecraftService(ec2Service *EC2Service) *MinecraftService {
	return &MinecraftService{
		ec2Service: ec2Service,
	}
}

// CreateMinecraftServer creates an EC2 instance with Docker and Minecraft server
func (s *MinecraftService) CreateMinecraftServer(req models.MinecraftServerRequest) (*models.MinecraftServerResponse, error) {
	// Set defaults
	req.SetDefaults()

	// Validate EULA
	if !req.EULA {
		return nil, fmt.Errorf("you must accept the Minecraft EULA by setting 'eula' to true")
	}

	log.Printf("Creating Minecraft server: %s (Type: %s, Version: %s)", req.ServerName, req.MinecraftType, req.Version)

	// Get latest Amazon Linux 2023 AMI
	ctx := context.TODO()
	imageID := s.ec2Service.getDefaultAMI()

	// Generate user data script for EC2 instance
	userData := s.generateUserDataScript(req)

	// Create security group for Minecraft
	securityGroupID, err := s.createMinecraftSecurityGroup(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to create security group: %v", err)
	}

	// Launch EC2 instance with user data
	runInput := &ec2.RunInstancesInput{
		ImageId:      aws.String(imageID),
		InstanceType: types.InstanceType(req.InstanceType),
		MinCount:     aws.Int32(1),
		MaxCount:     aws.Int32(1),
		UserData:     aws.String(base64.StdEncoding.EncodeToString([]byte(userData))),
		
		NetworkInterfaces: []types.InstanceNetworkInterfaceSpecification{
			{
				AssociatePublicIpAddress: aws.Bool(true),
				DeviceIndex:              aws.Int32(0),
				DeleteOnTermination:      aws.Bool(true),
				Groups:                   []string{securityGroupID},
			},
		},
		
		TagSpecifications: []types.TagSpecification{
			{
				ResourceType: types.ResourceTypeInstance,
				Tags: []types.Tag{
					{
						Key:   aws.String("Name"),
						Value: aws.String(req.ServerName),
					},
					{
						Key:   aws.String("Type"),
						Value: aws.String("MinecraftServer"),
					},
					{
						Key:   aws.String("MinecraftType"),
						Value: aws.String(req.MinecraftType),
					},
					{
						Key:   aws.String("MinecraftVersion"),
						Value: aws.String(req.Version),
					},
					{
						Key:   aws.String("CreatedBy"),
						Value: aws.String("MinecraftServerGenerator"),
					},
					{
						Key:   aws.String("CreatedAt"),
						Value: aws.String(time.Now().Format(time.RFC3339)),
					},
				},
			},
		},
	}

	// Add key name if provided
	if req.KeyName != "" {
		runInput.KeyName = aws.String(req.KeyName)
	}

	// Add IAM instance profile for auto-shutdown
	runInput.IamInstanceProfile = &types.IamInstanceProfileSpecification{
		Name: aws.String("MinecraftServerAutoShutdown"),
	}

	// Launch the instance
	result, err := s.ec2Service.client.RunInstances(ctx, runInput)
	if err != nil {
		return nil, fmt.Errorf("failed to create instance: %v", err)
	}

	if len(result.Instances) == 0 {
		return nil, fmt.Errorf("no instances were created")
	}

	instance := result.Instances[0]
	instanceID := aws.ToString(instance.InstanceId)

	log.Printf("Minecraft server instance created: %s. Waiting for it to start...", instanceID)

	// Wait for instance to be running
	waiter := ec2.NewInstanceRunningWaiter(s.ec2Service.client)
	waitInput := &ec2.DescribeInstancesInput{
		InstanceIds: []string{instanceID},
	}

	err = waiter.Wait(ctx, waitInput, 5*time.Minute)
	if err != nil {
		return nil, fmt.Errorf("instance failed to start: %v", err)
	}

	// Fetch instance details
	describeResult, err := s.ec2Service.client.DescribeInstances(ctx, waitInput)
	if err != nil {
		return nil, fmt.Errorf("failed to describe instance: %v", err)
	}

	if len(describeResult.Reservations) == 0 || len(describeResult.Reservations[0].Instances) == 0 {
		return nil, fmt.Errorf("instance not found after creation")
	}

	runningInstance := describeResult.Reservations[0].Instances[0]
	publicIP := aws.ToString(runningInstance.PublicIpAddress)

	// Build response
	response := &models.MinecraftServerResponse{
		InstanceID:       instanceID,
		PublicIP:         publicIP,
		PrivateIP:        aws.ToString(runningInstance.PrivateIpAddress),
		State:            string(runningInstance.State.Name),
		InstanceType:     string(runningInstance.InstanceType),
		LaunchTime:       runningInstance.LaunchTime.Format(time.RFC3339),
		AvailabilityZone: aws.ToString(runningInstance.Placement.AvailabilityZone),
		ServerName:       req.ServerName,
		MinecraftVersion: req.Version,
		ServerType:       req.MinecraftType,
		ServerPort:       25565,
		ServerAddress:    fmt.Sprintf("%s:25565", publicIP),
		Message:          "Minecraft server is being set up. It may take 2-3 minutes for Docker to install and the server to start. Connect using: " + publicIP,
	}

	log.Printf("Minecraft server successfully created: %s (IP: %s)", instanceID, publicIP)

	return response, nil
}

// generateUserDataScript creates a cloud-init script to install Docker and run Minecraft
func (s *MinecraftService) generateUserDataScript(req models.MinecraftServerRequest) string {
	// Build environment variables for the Docker container
	envVars := []string{
		fmt.Sprintf("EULA=%t", req.EULA),
		fmt.Sprintf("TYPE=%s", req.MinecraftType),
		fmt.Sprintf("VERSION=%s", req.Version),
		fmt.Sprintf("MEMORY=%s", req.Memory),
		fmt.Sprintf("MAX_PLAYERS=%d", req.MaxPlayers),
		fmt.Sprintf("MOTD=%s", req.MOTD),
		fmt.Sprintf("DIFFICULTY=%s", req.Difficulty),
		fmt.Sprintf("MODE=%s", req.Gamemode),
		fmt.Sprintf("PVP=%t", req.PVP),
		fmt.Sprintf("ONLINE_MODE=%t", req.OnlineMode),
		fmt.Sprintf("ENABLE_COMMAND_BLOCK=%t", req.EnableCommand),
	}

	if req.LevelSeed != "" {
		envVars = append(envVars, fmt.Sprintf("SEED=%s", req.LevelSeed))
	}
	if req.LevelName != "" {
		envVars = append(envVars, fmt.Sprintf("LEVEL=%s", req.LevelName))
	}

	// Add modpack URL if provided
	if req.ModPackURL != "" {
		envVars = append(envVars, fmt.Sprintf("MODPACK=%s", req.ModPackURL))
	}

	// Add plugin URLs if provided
	if len(req.PluginURLs) > 0 {
		envVars = append(envVars, fmt.Sprintf("PLUGINS=%s", strings.Join(req.PluginURLs, ",")))
	}

	// Build Docker run command
	dockerEnvFlags := ""
	for _, env := range envVars {
		dockerEnvFlags += fmt.Sprintf(" -e \"%s\"", env)
	}

	// Cloud-init user data script
	userData := fmt.Sprintf(`#!/bin/bash
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
            server_empty_time=$(date +%%s)
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
            current_time=$(date +%%s)
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
`, dockerEnvFlags)

	return userData
}

// createMinecraftSecurityGroup creates a security group with Minecraft port open
func (s *MinecraftService) createMinecraftSecurityGroup(ctx context.Context) (string, error) {
	// Check if security group already exists
	describeInput := &ec2.DescribeSecurityGroupsInput{
		Filters: []types.Filter{
			{
				Name:   aws.String("group-name"),
				Values: []string{"minecraft-server-sg"},
			},
		},
	}

	describeResult, err := s.ec2Service.client.DescribeSecurityGroups(ctx, describeInput)
	if err == nil && len(describeResult.SecurityGroups) > 0 {
		// Security group already exists
		return aws.ToString(describeResult.SecurityGroups[0].GroupId), nil
	}

	// Create new security group
	createInput := &ec2.CreateSecurityGroupInput{
		GroupName:   aws.String("minecraft-server-sg"),
		Description: aws.String("Security group for Minecraft servers - allows port 25565"),
	}

	createResult, err := s.ec2Service.client.CreateSecurityGroup(ctx, createInput)
	if err != nil {
		return "", fmt.Errorf("failed to create security group: %v", err)
	}

	groupID := aws.ToString(createResult.GroupId)

	// Add ingress rules for Minecraft port (25565) and SSH (22)
	authorizeInput := &ec2.AuthorizeSecurityGroupIngressInput{
		GroupId: aws.String(groupID),
		IpPermissions: []types.IpPermission{
			{
				// Minecraft port
				IpProtocol: aws.String("tcp"),
				FromPort:   aws.Int32(25565),
				ToPort:     aws.Int32(25565),
				IpRanges: []types.IpRange{
					{
						CidrIp:      aws.String("0.0.0.0/0"),
						Description: aws.String("Minecraft server port"),
					},
				},
			},
			{
				// SSH port (for administration)
				IpProtocol: aws.String("tcp"),
				FromPort:   aws.Int32(22),
				ToPort:     aws.Int32(22),
				IpRanges: []types.IpRange{
					{
						CidrIp:      aws.String("0.0.0.0/0"),
						Description: aws.String("SSH access"),
					},
				},
			},
		},
	}

	_, err = s.ec2Service.client.AuthorizeSecurityGroupIngress(ctx, authorizeInput)
	if err != nil {
		log.Printf("Warning: Failed to add ingress rules (may already exist): %v", err)
	}

	log.Printf("Security group created: %s", groupID)
	return groupID, nil
}
