package middleware

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// JWK represents a JSON Web Key
type JWK struct {
	X      string   `json:"x"`
	Y      string   `json:"y"`
	Alg    string   `json:"alg"`
	Crv    string   `json:"crv"`
	Ext    bool     `json:"ext"`
	Kid    string   `json:"kid"`
	Kty    string   `json:"kty"`
	KeyOps []string `json:"key_ops"`
}

// parseJWKToPublicKey converts a JWK to an ECDSA public key
func parseJWKToPublicKey(jwkJSON string) (*ecdsa.PublicKey, error) {
	var jwk JWK
	if err := json.Unmarshal([]byte(jwkJSON), &jwk); err != nil {
		return nil, fmt.Errorf("failed to parse JWK: %w", err)
	}

	// Decode base64url encoded x and y coordinates
	xBytes, err := base64.RawURLEncoding.DecodeString(jwk.X)
	if err != nil {
		return nil, fmt.Errorf("failed to decode x coordinate: %w", err)
	}

	yBytes, err := base64.RawURLEncoding.DecodeString(jwk.Y)
	if err != nil {
		return nil, fmt.Errorf("failed to decode y coordinate: %w", err)
	}

	// Create the public key
	publicKey := &ecdsa.PublicKey{
		Curve: elliptic.P256(),
		X:     new(big.Int).SetBytes(xBytes),
		Y:     new(big.Int).SetBytes(yBytes),
	}

	return publicKey, nil
}

// AuthMiddleware validates requests using Supabase JWT tokens or API keys (IP whitelist disabled)
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get configuration from environment
		supabaseJWK := os.Getenv("SUPABASE_JWT_PUBLIC_KEY")
		apiKey := os.Getenv("API_KEY")
		
		clientIP := c.ClientIP()
		
		// Strategy 1: Check for API key in header
		if apiKey != "" {
			requestAPIKey := c.GetHeader("X-API-Key")
			if requestAPIKey == apiKey {
				log.Printf("Request authorized via API key from IP: %s", clientIP)
				c.Next()
				return
			}
		}
		
		// Strategy 2: Verify Supabase JWT token with ES256
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			log.Printf("Unauthorized request from IP: %s - No authorization provided", clientIP)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"message": "No authorization token provided",
			})
			c.Abort()
			return
		}
		
		// Extract Bearer token
		tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
		
		// Parse JWK to public key
		publicKey, err := parseJWKToPublicKey(supabaseJWK)
		if err != nil {
			log.Printf("Failed to parse JWK: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Configuration Error",
				"message": "Invalid JWT signing key configuration",
			})
			c.Abort()
			return
		}
		
		// Parse and validate JWT token with ES256
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Validate signing method is ES256
			if _, ok := token.Method.(*jwt.SigningMethodECDSA); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			if token.Method.Alg() != "ES256" {
				return nil, fmt.Errorf("expected ES256 signing method, got %s", token.Method.Alg())
			}
			return publicKey, nil
		})
		
		if err != nil {
			log.Printf("Invalid token from IP: %s - Error: %v", clientIP, err)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"message": "Invalid authorization token",
			})
			c.Abort()
			return
		}
		
		if !token.Valid {
			log.Printf("Invalid token from IP: %s", clientIP)
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "Unauthorized",
				"message": "Invalid or expired token",
			})
			c.Abort()
			return
		}
		
		// Extract claims
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			// Add user info to context
			c.Set("user_id", claims["sub"])
			c.Set("user_email", claims["email"])
			log.Printf("Request authorized via JWT token (ES256) for user: %v from IP: %s", claims["email"], clientIP)
		}
		
		c.Next()
	}
}

// OptionalAuthMiddleware allows requests but adds user info if authenticated
func OptionalAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		supabaseJWK := os.Getenv("SUPABASE_JWT_PUBLIC_KEY")
		authHeader := c.GetHeader("Authorization")
		
		if authHeader != "" && supabaseJWK != "" {
			tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
			
			publicKey, err := parseJWKToPublicKey(supabaseJWK)
			if err == nil {
				token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
					if _, ok := token.Method.(*jwt.SigningMethodECDSA); !ok {
						return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
					}
					return publicKey, nil
				})
				
				if err == nil && token.Valid {
					if claims, ok := token.Claims.(jwt.MapClaims); ok {
						c.Set("user_id", claims["sub"])
						c.Set("user_email", claims["email"])
						c.Set("authenticated", true)
					}
				}
			}
		}
		
		c.Next()
	}
}
