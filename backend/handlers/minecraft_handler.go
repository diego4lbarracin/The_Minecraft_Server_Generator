package handlers

import (
	"log"
	"net/http"
	"os/exec"
	"strings"

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

// TestServerCreation handles POST /minecraft/test
// This endpoint executes the test_minecraft_api.ps1 script and returns the server IP
func (h *MinecraftHandler) TestServerCreation(c *gin.Context) {
	log.Println("Executing test_minecraft_api.ps1 script...")

	// Execute PowerShell script
	cmd := exec.Command("powershell", "-ExecutionPolicy", "Bypass", "-File", "./test_minecraft_api.ps1")
	
	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("Script execution failed: %v", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Script Execution Failed",
			Message: err.Error(),
			Details: string(output),
		})
		return
	}

	scriptOutput := string(output)
	log.Printf("Script output:\n%s", scriptOutput)

	// Parse the output to extract the server IP
	// The script outputs "Public IP: <ip_address>" 
	serverIP := extractIPFromOutput(scriptOutput)
	
	if serverIP == "" {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to Extract Server IP",
			Message: "Could not parse server IP from script output",
			Details: scriptOutput,
		})
		return
	}

	log.Printf("Successfully created test server with IP: %s", serverIP)

	c.JSON(http.StatusOK, gin.H{
		"status":        "success",
		"message":       "Test server created successfully",
		"server_ip":     serverIP,
		"script_output": scriptOutput,
	})
}

// extractIPFromOutput parses the PowerShell script output to extract the server IP
func extractIPFromOutput(output string) string {
	// Look for pattern "Public IP: <ip_address>"
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if strings.Contains(line, "Public IP:") {
			parts := strings.Split(line, ":")
			if len(parts) >= 2 {
				ip := strings.TrimSpace(parts[1])
				// Remove ANSI color codes if any
				ip = strings.TrimSpace(strings.Split(ip, "\x1b")[0])
				return ip
			}
		}
		// Also check for "Server Address:" which includes the full IP
		if strings.Contains(line, "Server Address:") {
			parts := strings.Split(line, ":")
			if len(parts) >= 2 {
				address := strings.TrimSpace(parts[1])
				// Remove ANSI color codes if any
				address = strings.TrimSpace(strings.Split(address, "\x1b")[0])
				return address
			}
		}
	}
	return ""
}
