package handlers

import (
	"log"
	"net/http"

	"github.com/diego4lbarracin/The_Minecraft_Server_Generator/models"
	"github.com/diego4lbarracin/The_Minecraft_Server_Generator/services"
	"github.com/gin-gonic/gin"
)

type MinecraftHandler struct {
	minecraftService *services.MinecraftService
}

// NewMinecraftHandler creates a new Minecraft handler
func NewMinecraftHandler(minecraftService *services.MinecraftService) *MinecraftHandler {
	return &MinecraftHandler{
		minecraftService: minecraftService,
	}
}

// CreateMinecraftServer handles POST /minecraft/create
func (h *MinecraftHandler) CreateMinecraftServer(c *gin.Context) {
	var req models.MinecraftServerRequest

	// Parse request body
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid Request",
			Message: err.Error(),
		})
		return
	}

	// Validate server name
	if req.ServerName == "" {
		req.ServerName = "minecraft-server"
	}

	log.Printf("Received request to create Minecraft server: %s (Type: %s, Version: %s)", 
		req.ServerName, req.MinecraftType, req.Version)

	// Create the Minecraft server
	server, err := h.minecraftService.CreateMinecraftServer(req)
	if err != nil {
		log.Printf("Failed to create Minecraft server: %v", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Minecraft Server Creation Failed",
			Message: err.Error(),
		})
		return
	}

	log.Printf("Successfully created Minecraft server: %s (IP: %s)", server.InstanceID, server.PublicIP)

	// Return success response
	c.JSON(http.StatusCreated, server)
}

// GetServerInfo handles GET /minecraft/info/:instance_id
func (h *MinecraftHandler) GetServerInfo(c *gin.Context) {
	instanceID := c.Param("instance_id")
	
	if instanceID == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid Request",
			Message: "instance_id is required",
		})
		return
	}

	// TODO: Implement fetching server info from EC2
	c.JSON(http.StatusNotImplemented, models.ErrorResponse{
		Error:   "Not Implemented",
		Message: "This endpoint is coming soon",
	})
}

// HealthCheck handles GET /minecraft/health
func (h *MinecraftHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "minecraft-server-manager",
	})
}
