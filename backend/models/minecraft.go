package models

// MinecraftServerRequest represents the request to create a Minecraft server
type MinecraftServerRequest struct {
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
	
	// Server Resources
	Memory        string `json:"memory"`                    // JVM memory allocation (e.g., "2G", "4G")
	
	// Advanced Options
	EULA          bool   `json:"eula"`                      // Accept Minecraft EULA (required)
	EnableCommand bool   `json:"enable_command_block"`     // Enable command blocks
	PVP           bool   `json:"pvp"`                       // Enable PVP
	OnlineMode    bool   `json:"online_mode"`               // Online mode (authentication)
	
	// Mods/Plugins (optional)
	ModPackURL    string   `json:"modpack_url"`             // URL to modpack zip file
	PluginURLs    []string `json:"plugin_urls"`             // URLs to plugin JAR files
	
	// EC2 Configuration (optional - uses defaults if not specified)
	InstanceType  string `json:"instance_type"`             // EC2 instance type (default: t3.small)
	KeyName       string `json:"key_name"`                  // SSH key pair name (optional)
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
		r.MaxPlayers = 20
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
	if r.Memory == "" {
		r.Memory = "1G"
	}
	if r.InstanceType == "" {
		r.InstanceType = "t3.small"
	}
	if r.MOTD == "" {
		r.MOTD = "A Minecraft Server"
	}
	// PVP and OnlineMode default to true
	if !r.PVP {
		r.PVP = true
	}
	if !r.OnlineMode {
		r.OnlineMode = true
	}
}
