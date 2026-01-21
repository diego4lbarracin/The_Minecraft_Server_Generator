package handlers

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

// NewEC2Handler creates a new EC2 handler
func NewEC2Handler(ec2Service *services.EC2Service) *EC2Handler {
	return &EC2Handler{
		ec2Service: ec2Service,
	}
}

// CreateInstance handles POST /ec2/create
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

	// Default to t3.small if not specified
	if req.InstanceType == "" {
		req.InstanceType = "t3.small"
	}

	log.Printf("Received request to create EC2 instance: %+v", req)

	// Create and start the instance
	instance, err := h.ec2Service.CreateAndStartInstance(req)
	if err != nil {
		log.Printf("Failed to create EC2 instance: %v", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Instance Creation Failed",
			Message: err.Error(),
		})
		return
	}

	log.Printf("Successfully created instance: %s", instance.InstanceID)

	// Return success response
	c.JSON(http.StatusCreated, instance)
}

// HealthCheck handles GET /ec2/health
func (h *EC2Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "ec2-instance-manager",
	})
}
