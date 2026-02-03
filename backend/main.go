/*
Backend for The Minecraft Server Generator
This is the main.go file, which works as the entry point for this part of the application.
It sets up the Gin web server, configures routes, enables CORS, and starts listening for incoming requests.
*/
package main

//Importing necessary packages.
import (
	"log"
	"os"

	"github.com/diego4lbarracin/The_Minecraft_Server_Generator/handlers"
	"github.com/diego4lbarracin/The_Minecraft_Server_Generator/middleware"
	"github.com/diego4lbarracin/The_Minecraft_Server_Generator/services"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	//Loading environment variables from .env file.
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}


	//Obtaining the only allowed origin from the .env file.
	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	// Initializing a Gin router.
	router := gin.Default()
	

	// CORS configuration.
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{allowedOrigin}, // Assigning allowed origin obtained from .env
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Initialize EC2 Service
	ec2Service, err := services.NewEC2Service()
	if err != nil { // Handling error if EC2 service fails to initialize
 		log.Fatalf("Failed to initialize EC2 service: %v", err)
	}

	// Initialize Minecraft Service
	minecraftService := services.NewMinecraftService(ec2Service)

	// Initialize Handlers: Handles the requests and responses from HTTP requests and call the appropriate service methods.
	ec2Handler := handlers.NewEC2Handler(ec2Service)
	minecraftHandler := handlers.NewMinecraftHandler(minecraftService)

	// Register EC2 routes. API Endpoints related to EC2 instance management.
	ec2Routes := router.Group("/ec2")
	
	/*
	Protected endpoint: The following endpoint requires authentication. The AuthMiddleware checks for valid authentication tokens from the frontend 
	before allowing access. It is important to protect this endpoint to prevent unauthorized access to EC2 instances (basically create a Minecraft Server),
	otherwise everyone could create as many servers as they want and generate an UNEXPECTED increase in computing costs.
	*/
	ec2Routes.Use(middleware.AuthMiddleware()) // Protected routes
	{
		ec2Routes.POST("/create", ec2Handler.CreateInstance)
	}

	// Register Minecraft routes. API Endpoints related to Minecraft server management.
	minecraftRoutes := router.Group("/minecraft")
	{
		// Public routes (no auth required)
		minecraftRoutes.GET("/health", minecraftHandler.HealthCheck)
		
		// Protected routes (auth required): As explained in line 60, only auth users are allowed to access the following endpoints.
		minecraftRoutes.POST("/create", middleware.AuthMiddleware(), minecraftHandler.CreateMinecraftServer)
		minecraftRoutes.GET("/info/:instance_id", middleware.AuthMiddleware(), minecraftHandler.GetServerInfo)
		minecraftRoutes.POST("/test", middleware.AuthMiddleware(), minecraftHandler.TestServerCreation)
	}

	// Obtain the PORT from the .ENV file and store it inside the port variable.
	port := os.Getenv("PORT")

	//Information logs for the server. Error handling when the server fails.
	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}