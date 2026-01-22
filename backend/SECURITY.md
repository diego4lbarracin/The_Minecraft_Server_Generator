# API Security Configuration

This guide explains how to secure your Minecraft Server Generator API with authentication.

## Security Features

The API supports **3 authentication methods**:

1. **Supabase JWT Tokens** - For authenticated users (recommended)
2. **IP Whitelisting** - For your development PC
3. **API Keys** - For external integrations

## Setup Instructions

### 1. Get Your Supabase JWT Secret

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **Settings** → **API**
3. Find the **JWT Secret** (under "JWT Settings")
4. Copy this value

### 2. Configure Environment Variables

Edit your `backend/.env` file:

```env
# Supabase Configuration
SUPABASE_JWT_SECRET=your_jwt_secret_here

# API Security
API_KEY=your_secure_random_api_key_here
ALLOWED_IPS=127.0.0.1,::1,YOUR_PC_IP_HERE

# Example with your actual IP:
# ALLOWED_IPS=127.0.0.1,::1,192.168.1.100
```

### 3. Find Your PC's IP Address

**Windows:**

```powershell
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

**Mac/Linux:**

```bash
ifconfig
# or
ip addr show
```

Add your IP to the `ALLOWED_IPS` list in `.env`

### 4. Generate a Secure API Key (Optional)

**PowerShell:**

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Or use an online generator:** https://www.uuidgenerator.net/

Add this to `API_KEY` in `.env`

## Testing

### Method 1: Authenticated User (Frontend)

The frontend automatically sends the JWT token:

1. Log in to the dashboard
2. Click "Run Script"
3. Token is automatically included in the request

### Method 2: IP Whitelisting

If your IP is in `ALLOWED_IPS`, you can make requests without authentication:

```powershell
# From your whitelisted PC
curl -X POST http://localhost:8080/minecraft/create `
  -H "Content-Type: application/json" `
  -d '{\"eula\":true,\"server_name\":\"test\"}'
```

### Method 3: API Key

Include the API key in the header:

```powershell
curl -X POST http://localhost:8080/minecraft/create `
  -H "Content-Type: application/json" `
  -H "X-API-Key: your_api_key_here" `
  -d '{\"eula\":true,\"server_name\":\"test\"}'
```

## Protected vs Public Endpoints

### Public Endpoints (No Auth Required)

- `GET /minecraft/health` - Health check

### Protected Endpoints (Auth Required)

- `POST /minecraft/create` - Create Minecraft server
- `POST /minecraft/test` - Run test script
- `GET /minecraft/info/:id` - Get server info
- `POST /ec2/create` - Create EC2 instance

## Troubleshooting

### "Unauthorized" Error

**Check:**

1. Is your `.env` file configured correctly?
2. Is `SUPABASE_JWT_SECRET` set?
3. Is your IP in `ALLOWED_IPS`?
4. Are you logged in (for frontend requests)?

**View logs:**

```bash
# Backend will log authorization attempts
go run main.go
# Look for lines like: "Request authorized via..."
```

### Get Your Current IP

The backend logs will show your IP in unauthorized requests:

```
Unauthorized request from IP: 192.168.1.XXX
```

Add this IP to your `ALLOWED_IPS` in `.env`

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong API keys** - At least 32 random characters
3. **Rotate API keys regularly** - Change every 90 days
4. **Limit IP whitelist** - Only add trusted IPs
5. **Use HTTPS in production** - Never send tokens over HTTP

## Production Deployment

For production, consider:

1. Using environment-specific `.env` files
2. Storing secrets in AWS Secrets Manager or similar
3. Implementing rate limiting
4. Adding request logging/monitoring
5. Using a reverse proxy (nginx) with SSL

## Example Complete `.env` File

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here

# Supabase Configuration
SUPABASE_JWT_SECRET=your_jwt_secret_from_supabase_dashboard

# API Security
API_KEY=z8x7c6v5b4n3m2q1w0e9r8t7y6u5i4o3p2
ALLOWED_IPS=127.0.0.1,::1,192.168.1.100

# Server Configuration
PORT=8080
```

## Need Help?

If you encounter issues:

1. Check the backend logs for specific error messages
2. Verify all environment variables are set
3. Test with IP whitelisting first (easiest to debug)
4. Then test with API keys
5. Finally test with JWT tokens
