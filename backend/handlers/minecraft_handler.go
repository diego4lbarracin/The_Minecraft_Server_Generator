/*
minecraft_handler.go
In this file, you'll find the defintion of handlers built to control request to endpoints
associated with creating a new Minecraft Server.
*/

package handlers

//Importing the necessary libraries.
import (
	"fmt"
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

// NewMinecraftHandler() => creates a new Minecraft handler and returns an object (struct) of type MinecraftHandler (defined in line 22).
func NewMinecraftHandler(minecraftService *services.MinecraftService) *MinecraftHandler {
	return &MinecraftHandler{
		minecraftService: minecraftService,
	}
}

/* 
POST - CreateMinecraftServer() => This method handles POST requests to the endpoint /minecraft/create, whose request body includes
the parameters that are necessary to create a new mineraft server (basically information that can be changed in the server.properties file).
*/
func (h *MinecraftHandler) CreateMinecraftServer(c *gin.Context) {
	var req models.MinecraftServerRequest //Initializing a variable of type MinecraftServerRequest, whose definition can be found at /models/minecraft.go

	// Binding the information in the request body to match the structure in the var req.
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Invalid request body: %v", err)
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid Request",
			Message: err.Error(),
		})
		return
	}

	// DEBUG: Log the raw request body and parsed OnlineMode value
	log.Printf("DEBUG Handler: OnlineMode value after JSON binding: %t", req.OnlineMode)
	log.Printf("DEBUG Handler: PVP value: %t, EnableCommand value: %t", req.PVP, req.EnableCommand)

	// Setting the req.ServerName to "minecraft-server" as default if it is not specified in the request body.
	if req.ServerName == "" {
		req.ServerName = "minecraft-server"
	}

	// Log to terminal, so the admin knows that a request to create a Minecraft Server.
	log.Printf("Received request to create Minecraft server: %s (Type: %s, Version: %s)", 
		req.ServerName, req.MinecraftType, req.Version)

	/* Executing the method CreateMinecraftServer() defined at /services/minecraftService.go using as parameter the information obtained 
	from the request body and stored in the var req. The method returns an object (struct) of type MinecraftServerResponse (whose 
	definition can be found at /models/minecraft) and is currently stored in server. If not successful, the service method returns an error.
	*/
	server, err := h.minecraftService.CreateMinecraftServer(req)
	//If an error is returned from the CreateMinecraftServer() service, then it is displayed as log on the terminal.
	if err != nil {
		log.Printf("Failed to create Minecraft server: %v", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Minecraft Server Creation Failed",
			Message: err.Error(),
		})
		return
	}
	//Log to the terminal if the server was created successfully.
	log.Printf("Successfully created Minecraft server: %s (IP: %s)", server.InstanceID, server.PublicIP)

	// Return success response.
	c.JSON(http.StatusCreated, server)
}

// GET - GetServerInfo() => Handles GET /minecraft/info/:instance_id
func (h *MinecraftHandler) GetServerInfo(c *gin.Context) {
	//Binds the parameter obtained from the request body and stores it in instanceID.
	instanceID := c.Param("instance_id")
	
	//Error handling if the parameter in the request body is missing.
	if instanceID == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid Request",
			Message: "instance_id is required",
		})
		return
	}

	// Fetch instance information from EC2
	log.Printf("Fetching information for instance: %s", instanceID)
	
	instanceInfo, err := h.minecraftService.GetInstanceInfo(instanceID)
	if err != nil {
		log.Printf("Failed to get instance info: %v", err)
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Error:   "Instance Not Found",
			Message: err.Error(),
		})
		return
	}

	// Build Minecraft server response
	response := models.MinecraftServerResponse{
		InstanceID:       instanceInfo.InstanceID,
		PublicIP:         instanceInfo.PublicIP,
		PrivateIP:        instanceInfo.PrivateIP,
		State:            instanceInfo.State,
		InstanceType:     instanceInfo.InstanceType,
		LaunchTime:       instanceInfo.LaunchTime,
		AvailabilityZone: instanceInfo.AvailabilityZone,
		ServerPort:       25565,
		ServerAddress:    fmt.Sprintf("%s:25565", instanceInfo.PublicIP),
		Message:          fmt.Sprintf("Instance is %s", instanceInfo.State),
	}

	c.JSON(http.StatusOK, response)
}

// GET HealthCheck() => Handles request GET /minecraft/health
func (h *MinecraftHandler) HealthCheck(c *gin.Context) {
	// Try to list all instances to verify service is working
	instances, err := h.minecraftService.ListAllInstances()
	if err != nil {
		log.Printf("Minecraft service health check failed: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  "unhealthy",
			"service": "minecraft-server-manager",
			"error":   err.Error(),
		})
		return
	}

	// Count Minecraft servers (instances with Type=MinecraftServer tag)
	minecraftServers := 0
	for range instances {
		// In a full implementation, you'd check the tags here
		minecraftServers++
	}

	c.JSON(http.StatusOK, gin.H{
		"status":            "healthy",
		"service":           "minecraft-server-manager",
		"total_instances":   len(instances),
		"minecraft_servers": minecraftServers,
		"aws_connected":     true,
	})
}

// TestServerCreation handles POST /minecraft/test
// This endpoint executes the test_minecraft_api.ps1 script and returns the server IP
func (h *MinecraftHandler) TestServerCreation(c *gin.Context) {
	log.Println("Executing test_minecraft_api.ps1 script...")

	// Execute PowerShell script
	cmd := exec.Command("powershell", "-ExecutionPolicy", "Bypass", "-File", "./scripts/test_minecraft_api.ps1")
	
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

// DELETE - StopServer() => Handles DELETE /minecraft/stop/:instance_id
func (h *MinecraftHandler) StopServer(c *gin.Context) {
	instanceID := c.Param("instance_id")
	
	if instanceID == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid Request",
			Message: "instance_id is required",
		})
		return
	}

	log.Printf("Stopping Minecraft server instance: %s", instanceID)

	err := h.minecraftService.StopInstance(instanceID)
	if err != nil {
		log.Printf("Failed to stop instance: %v", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to Stop Server",
			Message: err.Error(),
		})
		return
	}

	log.Printf("Successfully stopped instance: %s", instanceID)
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Server stopped successfully",
		"instance_id": instanceID,
	})
}
