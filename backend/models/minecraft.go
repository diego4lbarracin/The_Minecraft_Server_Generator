package models

/*
The definition of models for servies assocciated with Minecraft services.
*/

// MinecraftServerRequest represents the request to create a Minecraft server
type MinecraftServerRequest struct {
	// User Information
	UserEmail     string `json:"user_email"`                // User's email address for server naming
	
	// Server Configuration
	ServerName    string `json:"server_name"`               // Name tag for the EC2 instance
	MinecraftType string `json:"minecraft_type"`            // vanilla, spigot, paper, forge, fabric, etc.
	Version       string `json:"version"`                   // Minecraft version (e.g., "1.20.4", "LATEST")
	
	// Server Properties
	MOTD          string `json:"motd"`                      // Message of the day
	MaxPlayers    int    `json:"max_players"`               // Maximum number of players (default: 20)
	Gamemode      string `json:"gamemode"`                  // survival, creative, adventure, spectator
	Difficulty    string `json:"difficulty"`                // peaceful, easy, normal, hard
	LevelSeed     string `json:"level_seed"`                // World seed (optional)
	LevelName     string `json:"level_name"`                // World name (default: "world")
	
	// Advanced Options
	EULA          bool   `json:"eula"`                      // Accept Minecraft EULA (required)
	EnableCommand bool   `json:"enable_command_block"`     // Enable command blocks
	PVP           bool   `json:"pvp"`                       // Enable PVP
	OnlineMode    bool   `json:"online_mode"`               // Online mode (authentication)
	WelcomeChest  bool   `json:"welcome_chest"`             // Note: Not supported by docker-minecraft-server (kept for future plugin implementation)
	
	// Mods/Plugins (optional)
	ModPackURL    string   `json:"modpack_url"`             // URL to modpack zip file
	PluginURLs    []string `json:"plugin_urls"`             // URLs to plugin JAR files
	
	// NOTE: Memory (3G), InstanceType (t3.medium), and KeyName (from .env) are set internally and cannot be overridden from frontend
	
	// Internal fields (not exposed in JSON, set by backend only)
	Memory        string `json:"-"`                        // JVM memory allocation (fixed at 3G)
	InstanceType  string `json:"-"`                        // EC2 instance type (fixed at t3.medium)
	KeyName       string `json:"-"`                        // SSH key pair name (from .env)
}

// MinecraftServerResponse represents the response after creating a Minecraft server
type MinecraftServerResponse struct {
	// EC2 Information
	InstanceID       string `json:"instance_id"`
	PublicIP         string `json:"public_ip"`
	PrivateIP        string `json:"private_ip"`
	State            string `json:"state"`
	InstanceType     string `json:"instance_type"`
	LaunchTime       string `json:"launch_time"`
	AvailabilityZone string `json:"availability_zone"`
	
	// Minecraft Server Information
	ServerName       string `json:"server_name"`
	MinecraftVersion string `json:"minecraft_version"`
	ServerType       string `json:"server_type"`
	ServerPort       int    `json:"server_port"`        // Minecraft port (default: 25565)
	
	// Connection Information
	ServerAddress    string `json:"server_address"`     // IP:Port for Minecraft client
	
	// Status
	Message          string `json:"message"`
}

// MinecraftServerDefaults provides default values
func (r *MinecraftServerRequest) SetDefaults() {
	if r.MinecraftType == "" {
		r.MinecraftType = "VANILLA"
	}
	if r.Version == "" {
		r.Version = "LATEST"
	}
	if r.MaxPlayers == 0 {
		r.MaxPlayers = 10
	}
	if r.Gamemode == "" {
		r.Gamemode = "survival"
	}
	if r.Difficulty == "" {
		r.Difficulty = "normal"
	}
	if r.LevelName == "" {
		r.LevelName = "world"
	}
	// Always set these values regardless of input (backend-controlled)
	r.Memory = "3G"
	r.InstanceType = "t3.medium"
	// KeyName is set from .env in the service layer
	if r.MOTD == "" {
		r.MOTD = "A server created using The Minecraft Server Generator :D"
	}
	// Note: PVP and OnlineMode are set explicitly from frontend, no defaults needed
	// Leaving them unset here allows frontend to control these boolean values
}
