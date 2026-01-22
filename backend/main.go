package main

import (
	"log"

	"github.com/diego4lbarracin/The_Minecraft_Server_Generator/handlers"
	"github.com/diego4lbarracin/The_Minecraft_Server_Generator/services"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	//Loading the .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	//Defining router
	router := gin.Default()

	//Configuring CORS.
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Initialize EC2 Service
	ec2Service, err := services.NewEC2Service()
	if err != nil {
		log.Fatalf("Failed to initialize EC2 service: %v", err)
	}

	// Initialize Minecraft Service
	minecraftService := services.NewMinecraftService(ec2Service)

	// Initialize Handlers
	ec2Handler := handlers.NewEC2Handler(ec2Service)
	minecraftHandler := handlers.NewMinecraftHandler(minecraftService)

	// Register EC2 routes
	ec2Routes := router.Group("/ec2")
	{
		ec2Routes.GET("/health", ec2Handler.HealthCheck)
		ec2Routes.POST("/create", ec2Handler.CreateInstance)
	}

	// Register Minecraft routes
	minecraftRoutes := router.Group("/minecraft")
	{
		minecraftRoutes.GET("/health", minecraftHandler.HealthCheck)
		minecraftRoutes.POST("/create", minecraftHandler.CreateMinecraftServer)
		minecraftRoutes.GET("/info/:instance_id", minecraftHandler.GetServerInfo)
		minecraftRoutes.POST("/test", minecraftHandler.TestServerCreation)
	}

	// Start server
	port := ":8080"
	log.Printf("Server starting on port %s", port)
	if err := router.Run(port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}