# API Security Quick Setup Script
# Run this to configure your API security settings

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Minecraft Server API Security Setup  " -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Get current IP address
Write-Host "[1/3] Detecting your IP address..." -ForegroundColor Yellow
$ipv4 = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown"}).IPAddress | Select-Object -First 1
Write-Host "Your IPv4 address: $ipv4" -ForegroundColor Green

# Generate API Key
Write-Host "`n[2/3] Generating secure API key..." -ForegroundColor Yellow
$apiKey = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
Write-Host "Generated API Key: $apiKey" -ForegroundColor Green

# Instructions for Supabase JWT Public Key
Write-Host "`n[3/3] Supabase JWT Public Key Setup" -ForegroundColor Yellow
Write-Host "To get your JWT Public Key (JWK):" -ForegroundColor White
Write-Host "  1. Go to: https://app.supabase.com" -ForegroundColor Gray
Write-Host "  2. Select your project" -ForegroundColor Gray
Write-Host "  3. Go to Settings → API → JWT Settings" -ForegroundColor Gray
Write-Host "  4. Copy the 'Public Key (JWK)' value" -ForegroundColor Gray
Write-Host "  5. It should look like: {""x"":""..."""",""y"":""..."""",""alg"":""ES256"",...}" -ForegroundColor Gray

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Configuration Summary" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Add these to your backend/.env file:`n" -ForegroundColor Green

$envConfig = @"
# Supabase JWT Public Key (Get from Supabase Dashboard → Settings → API → JWT Settings)
# Copy the entire JWK JSON object on a single line
SUPABASE_JWT_PUBLIC_KEY={"x":"your_x_value","y":"your_y_value","alg":"ES256","crv":"P-256","ext":true,"kid":"your_kid","kty":"EC","key_ops":["verify"]}

# API Security
API_KEY=$apiKey
ALLOWED_IPS=127.0.0.1,::1,$ipv4

# Server Configuration
PORT=8080
"@

Write-Host $envConfig -ForegroundColor White

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Next Steps" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. Copy the configuration above" -ForegroundColor Yellow
Write-Host "2. Add it to: baPublic Key (JWK) from Supabase and replace the placeholder" -ForegroundColor Yellow
Write-Host "4. Make sure the JWK is on a single line (no line breaks)" -ForegroundColor Yellow
Write-Host "5. Save the file" -ForegroundColor Yellow
Write-Host "6. Save the file" -ForegroundColor Yellow
Write-Host "5. Restart your backend server: cd backend; go run main.go" -ForegroundColor Yellow

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Security Methods Available" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Your API will accept requests from:" -ForegroundColor Green
Write-Host "  ✓ Authenticated users (JWT token from Supabase)" -ForegroundColor White
Write-Host "  ✓ Your PC's IP address ($ipv4)" -ForegroundColor White
Write-Host "  ✓ Requests with the API key in X-API-Key header" -ForegroundColor White

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Testing" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Test from your whitelisted PC:" -ForegroundColor Yellow
Write-Host 'curl -X POST http://localhost:8080/minecraft/health' -ForegroundColor Gray

Write-Host "`nOr read the full documentation:" -ForegroundColor Yellow
Write-Host "backend/SECURITY.md" -ForegroundColor Cyan

Write-Host "`nSetup complete! 🎮🔒`n" -ForegroundColor Green
