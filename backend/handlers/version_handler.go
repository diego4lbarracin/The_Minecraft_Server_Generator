package handlers

import (
	"net/http"

	"github.com/diego4lbarracin/The_Minecraft_Server_Generator/services"
	"github.com/gin-gonic/gin"
)

// GetMinecraftVersions returns the list of available Minecraft versions
func GetMinecraftVersions(c *gin.Context) {
	versionService := services.GetVersionService()
	
	versions, err := versionService.GetVersions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch Minecraft versions",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"versions": versions,
		"count":    len(versions),
	})
}
