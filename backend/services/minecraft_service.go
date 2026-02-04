/*
minecraft_service.go
In this file you will find the definition of the logic of the different methods that are needed to
create a Minecraft Server Successfully.
*/
package services

//Libraries that are currently needed for this service.
import (
	"context"
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/diego4lbarracin/The_Minecraft_Server_Generator/models"
)

//Structure that defines that a MinecraftService, which is in fact a instance of an object of type ec2_sercice as well.
//Basically, it includes the definition of the different methods that are currently in ec2_service.go
type MinecraftService struct {
	ec2Service *EC2Service
}

// NewMinecraftService() creates a new Minecraft service instance
func NewMinecraftService(ec2Service *EC2Service) *MinecraftService {
	return &MinecraftService{
		ec2Service: ec2Service,
	}
}

// CreateMinecraftServer() => creates an EC2 instance with Docker and Minecraft server
func (s *MinecraftService) CreateMinecraftServer(req models.MinecraftServerRequest) (*models.MinecraftServerResponse, error) {
	// Set defaults
	req.SetDefaults()

	// Set server name based on user email if not provided
	if req.ServerName == "" && req.UserEmail != "" {
		req.ServerName = fmt.Sprintf("MC-SERVER@%s", req.UserEmail)
	} else if req.ServerName == "" {
		req.ServerName = fmt.Sprintf("MC-SERVER@%s", time.Now().Format("20060102-150405"))
	}

	// Set default key name from environment if not provided
	if req.KeyName == "" {
		req.KeyName = os.Getenv("DEFAULT_KEY_NAME")
	}

	// Validate EULA
	if !req.EULA {
		return nil, fmt.Errorf("you must accept the Minecraft EULA by setting 'eula' to true")
	}
	//Log to the terminal.
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
	// Log the OnlineMode value for debugging
	log.Printf("DEBUG: OnlineMode value received: %t", req.OnlineMode)
	
	// Build environment variables for the Docker container
	envVars := []string{
		fmt.Sprintf("EULA=%t", req.EULA),
		fmt.Sprintf("TYPE=%s", req.MinecraftType),
		fmt.Sprintf("VERSION=%s", req.Version),
		fmt.Sprintf("MEMORY=%s", req.Memory),
		fmt.Sprintf("MAX_PLAYERS=%d", req.MaxPlayers),
		fmt.Sprintf("MOTD=\"%s\"", req.MOTD),  // Quote MOTD to handle spaces
		fmt.Sprintf("DIFFICULTY=%s", req.Difficulty),
		fmt.Sprintf("MODE=%s", req.Gamemode),
		fmt.Sprintf("PVP=%t", req.PVP),
		fmt.Sprintf("ONLINE_MODE=%t", req.OnlineMode),
		fmt.Sprintf("ENABLE_COMMAND_BLOCK=%t", req.EnableCommand),
		"OP_PERMISSION_LEVEL=2",  // Set default OP permission level to 2
	}
	
	log.Printf("DEBUG: Environment variables being set: %v", envVars)

	// Note: WelcomeChest feature is not supported by docker-minecraft-server
	// The INITIAL_ENABLED_PACKS environment variable is for datapacks with feature flags,
	// not for welcome chests. This feature would require a custom plugin/datapack.
	// Removing the incorrect implementation.

	if req.LevelSeed != "" {
		envVars = append(envVars, fmt.Sprintf("SEED=\"%s\"", req.LevelSeed))  // Quote SEED for negative values
	}
	if req.LevelName != "" {
		envVars = append(envVars, fmt.Sprintf("LEVEL=%s", req.LevelName))
	}

	// Add modpack URL if provided
	if req.ModPackURL != "" {
		envVars = append(envVars, fmt.Sprintf("MODPACK=\"%s\"", req.ModPackURL))  // Quote URL
	}

	// Add plugin URLs if provided
	if len(req.PluginURLs) > 0 {
		envVars = append(envVars, fmt.Sprintf("PLUGINS=\"%s\"", strings.Join(req.PluginURLs, ",")))  // Quote plugin URLs
	}

	// Build Docker run command environment flags
	dockerEnvFlags := ""
	for _, env := range envVars {
		// Don't add extra quotes around the environment variable
		// Docker -e flag handles: -e KEY=VALUE
		dockerEnvFlags += fmt.Sprintf(" -e %s", env)
	}
	
	log.Printf("DEBUG: Docker environment flags: %s", dockerEnvFlags)

	// Read the EC2 initialization script from file
	scriptPath := filepath.Join("scripts", "ec2-init.sh")
	scriptContent, err := os.ReadFile(scriptPath)
	if err != nil {
		log.Printf("Error reading EC2 init script: %v. Using fallback script.", err)
		// Fallback to a minimal script if file read fails
		return `#!/bin/bash
echo "Error: Could not load EC2 initialization script" >> /var/log/minecraft-setup.log
exit 1`
	}

	// Inject the Docker environment flags into the script template
	userData := fmt.Sprintf(string(scriptContent), dockerEnvFlags)

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

// GetInstanceInfo fetches information about a specific EC2 instance
func (s *MinecraftService) GetInstanceInfo(instanceID string) (*models.EC2InstanceResponse, error) {
	return s.ec2Service.GetInstanceInfo(instanceID)
}

// ListAllInstances returns information about all EC2 instances
func (s *MinecraftService) ListAllInstances() ([]models.EC2InstanceResponse, error) {
	return s.ec2Service.ListAllInstances()
}

// StopInstance stops a running EC2 instance
func (s *MinecraftService) StopInstance(instanceID string) error {
	return s.ec2Service.StopInstance(instanceID)
}
