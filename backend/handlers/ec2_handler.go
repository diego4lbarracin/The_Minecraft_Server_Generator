/*
ec2_handler.go
In this file, there is the specification of the handlers that control requests related with
creating of EC2 instances on AWS, redirects it to the corresponding service in the file ec2_service.go
and builds the response and sends it back.
*/
package handlers

//Importing the necessary libraries.
import (
	"log"
	"net/http"

	"github.com/diego4lbarracin/The_Minecraft_Server_Generator/models"
	"github.com/diego4lbarracin/The_Minecraft_Server_Generator/services"
	"github.com/gin-gonic/gin"
)

type EC2Handler struct {
	ec2Service *services.EC2Service
}

/*
NewEC2Handler() => Like a constructor in Java, the NewEC2Handler method creates a new EC2 handler and returns it 
to wherever the method was called.
*/
func NewEC2Handler(ec2Service *services.EC2Service) *EC2Handler {
	return &EC2Handler{
		ec2Service: ec2Service,
	}
}

/*
POST - CreateInstance() => It creates an instance based on parameters included in the POST request.
Then parses the information in the request body to the model EC2InstanceRequest whose definition can be found
at /model/ec2 and eventually calls the service CreateAndStartIntance(), whose definition can be found at 
ec2_service.go
*/
func (h *EC2Handler) CreateInstance(c *gin.Context) {
	var req models.EC2InstanceRequest

	// Parse request body
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid Request",
			Message: err.Error(),
		})
		return
	}

	// Sets a default EC2 instance type to t3.small if not specified in the request body.
	if req.InstanceType == "" {
		req.InstanceType = "t3.small"
	}

	// Log to the terminal, so the admin can see that a request to create an EC2 instance has been executed.
	log.Printf("Received request to create EC2 instance: %+v", req)

	/* Create and start the instance using the service method CreateAndStartInstance() [can be found at /services/ec2_service.go]
	using as parameters the values that were obtained from the request body, processed and then stored at the var req in line 40.*/
	instance, err := h.ec2Service.CreateAndStartInstance(req) //The service returns an object of type EC2InstanceResponse, whose definition can be found at /model/ec2.
	
	//if for handling errors when creating the EC2 instance.
	if err != nil {
		log.Printf("Failed to create EC2 instance: %v", err) 
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Instance Creation Failed",
			Message: err.Error(),
		})
		return
	}
	// Log to the terminal, so the admin can see that the EC2 instance was created successfully. Also prints the InstanceID.
	log.Printf("Successfully created instance: %s", instance.InstanceID)

	// Return success response
	c.JSON(http.StatusCreated, instance)
}

/*
GET - HealthCheck() => Checks if the EC2 service is working and can connect to AWS
*/
func (h *EC2Handler) HealthCheck(c *gin.Context) {
	// Try to list instances to verify AWS connection is working
	instances, err := h.ec2Service.ListAllInstances()
	if err != nil {
		log.Printf("EC2 health check failed: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  "unhealthy",
			"service": "ec2-instance-manager",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":         "healthy",
		"service":        "ec2-instance-manager",
		"total_instances": len(instances),
		"aws_connected":  true,
	})
}
