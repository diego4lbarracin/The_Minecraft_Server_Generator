package models

// EC2InstanceRequest represents the request body for creating an EC2 instance
type EC2InstanceRequest struct {
	InstanceType string `json:"instance_type" binding:"required"`
	KeyName      string `json:"key_name"`      // SSH key pair name (optional)
	ImageID      string `json:"image_id"`      // AMI ID (optional, will use default if not provided)
	TagName      string `json:"tag_name"`      // Name tag for the instance (optional)
}

// EC2InstanceResponse represents the response after creating an EC2 instance
type EC2InstanceResponse struct {
	InstanceID       string `json:"instance_id"`
	PublicIP         string `json:"public_ip"`
	PrivateIP        string `json:"private_ip"`
	State            string `json:"state"`
	InstanceType     string `json:"instance_type"`
	LaunchTime       string `json:"launch_time"`
	AvailabilityZone string `json:"availability_zone"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}
