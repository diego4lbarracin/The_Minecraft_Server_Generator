# Minecraft Server Creation Test Script
# Run this after starting your Go server (go run main.go)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Minecraft Server Creator - Test Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "[Test 1] Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/minecraft/health" -Method GET
    Write-Host "[OK] Health check passed!" -ForegroundColor Green
    Write-Host "Status: $($health.status)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[FAILED] Health check failed! Is the server running?" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nMake sure to run: go run main.go" -ForegroundColor Yellow
    exit 1
}

# Test 2: Create Vanilla Minecraft Server
Write-Host "[Test 2] Creating Vanilla Minecraft Server..." -ForegroundColor Yellow
Write-Host "This will:" -ForegroundColor Gray
Write-Host "  * Create a new EC2 t3.small instance" -ForegroundColor Gray
Write-Host "  * Install Docker automatically" -ForegroundColor Gray
Write-Host "  * Pull itzg/minecraft-server from Docker Hub" -ForegroundColor Gray
Write-Host "  * Start Minecraft server" -ForegroundColor Gray
Write-Host "  * Takes about 2-3 minutes total`n" -ForegroundColor Gray

$timestamp = Get-Date -Format "HHmmss"
$requestBody = @{
    eula = $true
    server_name = "test-vanilla-$timestamp"
    minecraft_type = "VANILLA"
    version = "LATEST"
    max_players = 20
    gamemode = "survival"
    difficulty = "normal"
    motd = "Test Minecraft Server - Created via API"
    memory = "1G"
} | ConvertTo-Json

Write-Host "Request:" -ForegroundColor Cyan
Write-Host $requestBody -ForegroundColor Gray
Write-Host ""

try {
    Write-Host "Creating server... (please wait 1-2 minutes)" -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:8080/minecraft/create" `
        -Method POST `
        -ContentType "application/json" `
        -Body $requestBody
    
    Write-Host "`n[SUCCESS] Minecraft Server Created Successfully!" -ForegroundColor Green
    Write-Host "`n=========================================" -ForegroundColor Cyan
    Write-Host "         MINECRAFT SERVER DETAILS         " -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    
    Write-Host "`nServer Information:" -ForegroundColor Yellow
    Write-Host "  Server Name:       $($response.server_name)" -ForegroundColor White
    Write-Host "  Server Type:       $($response.server_type)" -ForegroundColor White
    Write-Host "  Minecraft Version: $($response.minecraft_version)" -ForegroundColor White
    
    Write-Host "`nConnection Details:" -ForegroundColor Yellow
    Write-Host "  Server Address:    $($response.server_address)" -ForegroundColor Green -BackgroundColor Black
    Write-Host "  Public IP:         $($response.public_ip)" -ForegroundColor White
    Write-Host "  Server Port:       $($response.server_port)" -ForegroundColor White
    
    Write-Host "`nEC2 Instance Details:" -ForegroundColor Yellow
    Write-Host "  Instance ID:       $($response.instance_id)" -ForegroundColor White
    Write-Host "  Instance Type:     $($response.instance_type)" -ForegroundColor White
    Write-Host "  Private IP:        $($response.private_ip)" -ForegroundColor White
    Write-Host "  State:             $($response.state)" -ForegroundColor White
    Write-Host "  Availability Zone: $($response.availability_zone)" -ForegroundColor White
    Write-Host "  Launch Time:       $($response.launch_time)" -ForegroundColor White
    
    Write-Host "`nImportant Notes:" -ForegroundColor Yellow
    Write-Host "  * Server is being set up (2-3 minutes)" -ForegroundColor Gray
    Write-Host "  * Docker is installing and pulling the image" -ForegroundColor Gray
    Write-Host "  * Connect to: $($response.public_ip)" -ForegroundColor Gray
    
    Write-Host "`nCOST WARNING:" -ForegroundColor Red
    Write-Host "  Hourly Cost: ~`$0.02 (t3.small)" -ForegroundColor Yellow
    Write-Host "  Daily Cost:  ~`$0.50 if running 24/7" -ForegroundColor Yellow
    
    Write-Host "`nUseful Commands:" -ForegroundColor Yellow
    Write-Host "  # Check server logs via SSH:" -ForegroundColor Gray
    Write-Host "  ssh ec2-user@$($response.public_ip) -i your-key.pem" -ForegroundColor Cyan
    Write-Host "  sudo docker logs -f minecraft-server`n" -ForegroundColor Cyan
    
    Write-Host "  # List all Minecraft servers:" -ForegroundColor Gray
    Write-Host "  aws ec2 describe-instances --filters 'Name=tag:Type,Values=MinecraftServer' 'Name=instance-state-name,Values=running' --query 'Reservations[*].Instances[*].[InstanceId,PublicIpAddress,Tags[?Key==``Name``].Value|[0]]' --output table`n" -ForegroundColor Cyan
    
    Write-Host "  # Stop server (stops billing):" -ForegroundColor Gray
    Write-Host "  aws ec2 stop-instances --instance-ids $($response.instance_id)`n" -ForegroundColor Cyan
    
    Write-Host "  # TERMINATE server (DELETES ALL DATA):" -ForegroundColor Gray
    Write-Host "  aws ec2 terminate-instances --instance-ids $($response.instance_id)`n" -ForegroundColor Cyan
    
    Write-Host "=========================================`n" -ForegroundColor Cyan
    
    Write-Host "Server Startup Timeline:" -ForegroundColor Yellow
    Write-Host "  [Now]     EC2 instance launching" -ForegroundColor Gray
    Write-Host "  [+30s]    Instance running" -ForegroundColor Gray
    Write-Host "  [+60s]    Docker installing" -ForegroundColor Gray
    Write-Host "  [+120s]   Minecraft server starting" -ForegroundColor Gray
    Write-Host "  [+180s]   SERVER READY!" -ForegroundColor Green
    
    Write-Host "`nConnect from Minecraft Client:" -ForegroundColor Yellow
    Write-Host "  1. Open Minecraft Java Edition" -ForegroundColor Gray
    Write-Host "  2. Go to Multiplayer -> Add Server" -ForegroundColor Gray
    Write-Host "  3. Server Address: $($response.public_ip)" -ForegroundColor Green
    Write-Host "  4. Click Done -> Join Server" -ForegroundColor Gray
    Write-Host "  5. Wait 2-3 minutes if connection fails initially" -ForegroundColor Gray
    
} catch {
    Write-Host "`n[FAILED] Server creation failed!" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "`nError: $($errorObj.error)" -ForegroundColor Red
        Write-Host "Message: $($errorObj.message)" -ForegroundColor Red
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "`nPossible issues:" -ForegroundColor Yellow
    Write-Host "  1. AWS credentials not configured" -ForegroundColor Gray
    Write-Host "  2. Invalid AMI ID for your region" -ForegroundColor Gray
    Write-Host "  3. Insufficient IAM permissions" -ForegroundColor Gray
    Write-Host "  4. AWS service quota exceeded" -ForegroundColor Gray
    Write-Host "  5. EULA not accepted (must set 'eula': true)" -ForegroundColor Gray
    Write-Host "`nCheck MINECRAFT_API.md for troubleshooting." -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan