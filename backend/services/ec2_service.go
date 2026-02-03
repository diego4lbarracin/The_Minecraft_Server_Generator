/*
ec2_service.go
In this file you will find the definition of the services associated with EC2 instances.
*/
package services

//Importing all the necessary libraries.
import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/ec2/types"
	"github.com/diego4lbarracin/The_Minecraft_Server_Generator/models"
)

//Defining the EC2Service struct.
type EC2Service struct {
	client     *ec2.Client
	cfg        aws.Config
	defaultAMI string // Cached latest AMI ID
}

// NewEC2Service() => Creates a new EC2 service instance
func NewEC2Service() (*EC2Service, error) {
	ctx := context.TODO()

	// Load AWS configuration from environment variables or AWS credentials file using the AWS SDK.
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(getAWSRegion()),
	)
	//Handled errors if returned.
	if err != nil {
		return nil, fmt.Errorf("unable to load AWS SDK config: %v", err)
	}

	/* Create EC2 client. Usinig the cfg as parameter, whose content was obtained from the config.LoadDefaultConfig(ctx,
		config.WithRegion(getAWSRegion()),
	)*/
	client := ec2.NewFromConfig(cfg)

	//Creating an instance of struct EC2Service and setting the previously obtained info as 
	//values in the struct.
	service := &EC2Service{
		client: client,
		cfg:    cfg,
	}

	// Fetch the latest AMI on startup (unless overridden by environment) (Amazon Linux)
	if err := service.fetchLatestAMI(ctx); err != nil {
		log.Printf("Warning: Failed to fetch latest AMI, using fallback: %v", err)
		service.defaultAMI = "ami-07ff62358b87c7116" // Fallback AMI
	}
	//Printing a log to the terminal confirming that the EC2 instance was initialized with the specified AMI (Amazon Linux).
	log.Printf("EC2 Service initialized with AMI: %s", service.defaultAMI)

	//Return either the service (the initialized struct EC2Service) or an error if the instance could not be created successfully.
	return service, nil
}

// CreateAndStartInstance() =>  creates a new EC2 instance and starts it
func (s *EC2Service) CreateAndStartInstance(req models.EC2InstanceRequest) (*models.EC2InstanceResponse, error) {
	ctx := context.TODO()

	// Get default AMI if not provided (Currently it is being used Amazon Linux as default.)
	imageID := req.ImageID
	if imageID == "" {
		imageID = s.getDefaultAMI()
	}

	// Prepare instance specifications
	runInput := &ec2.RunInstancesInput{
		ImageId:      aws.String(imageID), //Image ID = Amazon Linux
		InstanceType: types.InstanceType(req.InstanceType), //t3.medium as default.
		//Max-Min = 1, because I only want to create a single instance per request.
		MinCount:     aws.Int32(1), 
		MaxCount:     aws.Int32(1),
		
		// Network settings - ensure instance gets a public IP
		NetworkInterfaces: []types.InstanceNetworkInterfaceSpecification{
			{
				AssociatePublicIpAddress: aws.Bool(true),
				DeviceIndex:              aws.Int32(0),
				DeleteOnTermination:      aws.Bool(true),
			},
		},
		
		// Tag the instance
		TagSpecifications: []types.TagSpecification{
			{
				ResourceType: types.ResourceTypeInstance,
				Tags: []types.Tag{
					{
						Key:   aws.String("Name"),
						Value: aws.String(getInstanceName(req.TagName)),
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
	//Log to the terminal, so the admin knows an EC2 instance is currently being created.
	log.Printf("Creating EC2 instance with type: %s, AMI: %s", req.InstanceType, imageID)

	// Launching the instance.
	result, err := s.client.RunInstances(ctx, runInput)
	//Handling errors and printing to the terminal the error if the creation was not successfull.
	if err != nil {
		return nil, fmt.Errorf("failed to create instance: %v", err)
	}
	//If no instances were created (hence, a failed instance creation), a log is printed with that information.
	if len(result.Instances) == 0 {
		return nil, fmt.Errorf("no instances were created")
	}

	//Setting the instance with the information result.
	instance := result.Instances[0]
	//Initializing the value instance ID.
	instanceID := aws.ToString(instance.InstanceId)

	//Log to the terminal if an EC2 instance was created successfully.
	log.Printf("Instance created with ID: %s. Waiting for it to start...", instanceID)

	// Wait for the instance to be running
	waiter := ec2.NewInstanceRunningWaiter(s.client)
	waitInput := &ec2.DescribeInstancesInput{
		InstanceIds: []string{instanceID},
	}

	// Wait up to 5 minutes for instance to be running
	err = waiter.Wait(ctx, waitInput, 5*time.Minute)
	if err != nil {
		return nil, fmt.Errorf("instance failed to start: %v", err)
	}
	//Log to the terminal if the instance is running correctly.
	log.Printf("Instance %s is now running. Fetching details...", instanceID)

	// Fetch the instance details to get the public IP
	describeInput := &ec2.DescribeInstancesInput{
		InstanceIds: []string{instanceID},
	}

	//Fetching values about the previously created EC2 instance.
	describeResult, err := s.client.DescribeInstances(ctx, describeInput)
	if err != nil {
		return nil, fmt.Errorf("failed to describe instance: %v", err)
	}

	if len(describeResult.Reservations) == 0 || len(describeResult.Reservations[0].Instances) == 0 {
		return nil, fmt.Errorf("instance not found after creation")
	}

	runningInstance := describeResult.Reservations[0].Instances[0]

	// Build response using  models.EC2InstanceResponse
	response := &models.EC2InstanceResponse{
		InstanceID:       instanceID,
		PublicIP:         aws.ToString(runningInstance.PublicIpAddress),
		PrivateIP:        aws.ToString(runningInstance.PrivateIpAddress),
		State:            string(runningInstance.State.Name),
		InstanceType:     string(runningInstance.InstanceType),
		LaunchTime:       runningInstance.LaunchTime.Format(time.RFC3339),
		AvailabilityZone: aws.ToString(runningInstance.Placement.AvailabilityZone),
	}

	//Final log if. Notifying the admin the EC2 instance was created successfully.
	log.Printf("Instance successfully created and started: %s (Public IP: %s)", instanceID, response.PublicIP)

	//Returing either the response if everything went according to the plan or an error if not.
	return response, nil
}

// getAWSRegion() => returns the AWS region from environment or defaults to us-east-1
func getAWSRegion() string {
	region := os.Getenv("AWS_REGION")
	return region
}

// fetchLatestAMI fetches the latest Amazon Linux 2023 AMI for the current region
func (s *EC2Service) fetchLatestAMI(ctx context.Context) error {
	// Check if AMI is set via environment variable first
	envAMI := os.Getenv("AWS_DEFAULT_AMI")
	if envAMI != "" {
		log.Printf("Using AMI from environment variable: %s", envAMI)
		s.defaultAMI = envAMI
		return nil
	}

	// Fetch the latest Amazon Linux 2023 AMI from AWS
	log.Println("Fetching latest Amazon Linux 2023 AMI from AWS...")
	
	input := &ec2.DescribeImagesInput{
		Owners: []string{"amazon"},
		Filters: []types.Filter{
			{
				Name:   aws.String("name"),
				Values: []string{"al2023-ami-2023*"},
			},
			{
				Name:   aws.String("architecture"),
				Values: []string{"x86_64"},
			},
			{
				Name:   aws.String("state"),
				Values: []string{"available"},
			},
		},
	}

	result, err := s.client.DescribeImages(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to describe images: %v", err)
	}

	if len(result.Images) == 0 {
		return fmt.Errorf("no Amazon Linux 2023 AMIs found")
	}

	// Find the most recent AMI by creation date
	var latestImage types.Image
	var latestTime time.Time

	for _, img := range result.Images {
		if img.CreationDate != nil {
			creationTime, err := time.Parse(time.RFC3339, *img.CreationDate)
			if err != nil {
				continue
			}
			if latestTime.IsZero() || creationTime.After(latestTime) {
				latestTime = creationTime
				latestImage = img
			}
		}
	}

	if latestImage.ImageId == nil {
		return fmt.Errorf("failed to find valid AMI")
	}

	s.defaultAMI = *latestImage.ImageId
	log.Printf("Latest Amazon Linux 2023 AMI found: %s (%s)", s.defaultAMI, aws.ToString(latestImage.Name))
	
	return nil
}

// getDefaultAMI()  => returns the cached default AMI ID
func (s *EC2Service) getDefaultAMI() string {
	return s.defaultAMI
}

// getInstanceName returns the instance name tag
func getInstanceName(tagName string) string {
	//If the tag name obtained as parameter was empty.
	if tagName != "" {
		return tagName
	}
	return fmt.Sprintf("MC-SERVER@%s", time.Now().Format("20060102-150405"))
}

// GetInstanceInfo fetches detailed information about a specific EC2 instance
func (s *EC2Service) GetInstanceInfo(instanceID string) (*models.EC2InstanceResponse, error) {
	ctx := context.TODO()

	describeInput := &ec2.DescribeInstancesInput{
		InstanceIds: []string{instanceID},
	}

	result, err := s.client.DescribeInstances(ctx, describeInput)
	if err != nil {
		return nil, fmt.Errorf("failed to describe instance: %v", err)
	}

	if len(result.Reservations) == 0 || len(result.Reservations[0].Instances) == 0 {
		return nil, fmt.Errorf("instance %s not found", instanceID)
	}

	instance := result.Reservations[0].Instances[0]

	response := &models.EC2InstanceResponse{
		InstanceID:       instanceID,
		PublicIP:         aws.ToString(instance.PublicIpAddress),
		PrivateIP:        aws.ToString(instance.PrivateIpAddress),
		State:            string(instance.State.Name),
		InstanceType:     string(instance.InstanceType),
		LaunchTime:       instance.LaunchTime.Format(time.RFC3339),
		AvailabilityZone: aws.ToString(instance.Placement.AvailabilityZone),
	}

	return response, nil
}

// ListAllInstances returns information about all EC2 instances
func (s *EC2Service) ListAllInstances() ([]models.EC2InstanceResponse, error) {
	ctx := context.TODO()

	describeInput := &ec2.DescribeInstancesInput{}

	result, err := s.client.DescribeInstances(ctx, describeInput)
	if err != nil {
		return nil, fmt.Errorf("failed to list instances: %v", err)
	}

	var instances []models.EC2InstanceResponse

	for _, reservation := range result.Reservations {
		for _, instance := range reservation.Instances {
			instances = append(instances, models.EC2InstanceResponse{
				InstanceID:       aws.ToString(instance.InstanceId),
				PublicIP:         aws.ToString(instance.PublicIpAddress),
				PrivateIP:        aws.ToString(instance.PrivateIpAddress),
				State:            string(instance.State.Name),
				InstanceType:     string(instance.InstanceType),
				LaunchTime:       instance.LaunchTime.Format(time.RFC3339),
				AvailabilityZone: aws.ToString(instance.Placement.AvailabilityZone),
			})
		}
	}

	return instances, nil
}

// StopInstance stops a running EC2 instance
func (s *EC2Service) StopInstance(instanceID string) error {
	ctx := context.TODO()

	input := &ec2.StopInstancesInput{
		InstanceIds: []string{instanceID},
	}

	_, err := s.client.StopInstances(ctx, input)
	if err != nil {
		return fmt.Errorf("failed to stop instance: %v", err)
	}

	log.Printf("Successfully stopped instance: %s", instanceID)
	return nil
}
