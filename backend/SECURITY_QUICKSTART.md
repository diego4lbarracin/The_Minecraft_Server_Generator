# 🔒 API Security - Quick Reference

## ✅ What Was Implemented

Your API now has **3-layer security**:

1. **JWT Authentication** - Users logged in via Supabase
2. **IP Whitelisting** - Your PC can access without login
3. **API Keys** - For scripts and external tools

## 🚀 Quick Start (3 Steps)

### Step 1: Run Setup Script

```powershell
cd backend
.\setup-security.ps1
```

### Step 2: Get Supabase JWT Secret

1. Go to https://app.supabase.com
2. Settings → API
3. Copy "JWT Secret"

### Step 3: Update `.env`

```env
SUPABASE_JWT_SECRET=paste_your_jwt_secret_here
API_KEY=<generated_by_script>
ALLOWED_IPS=127.0.0.1,::1,<your_ip_from_script>
```

## 📋 How It Works

### From Frontend (Automatic)

✅ Users log in → Token automatically sent with requests

### From Your PC (No Auth Needed)

✅ Your IP is whitelisted → Direct access

### From Scripts/Tools

✅ Include API key → `X-API-Key: your_api_key`

## 🎯 Protected Endpoints

- `POST /minecraft/create` ← Creates server (requires auth)
- `POST /minecraft/test` ← Test script (requires auth)
- `POST /ec2/create` ← Creates EC2 (requires auth)

## 🌐 Public Endpoints

- `GET /minecraft/health` ← No auth needed

## 🧪 Testing

**Test with curl (from whitelisted IP):**

```powershell
curl http://localhost:8080/minecraft/health
```

**Test with API key:**

```powershell
curl -H "X-API-Key: your_key" http://localhost:8080/minecraft/create -d '{...}'
```

**Test from frontend:**
Just log in and use the dashboard - works automatically!

## ❓ Troubleshooting

**"Unauthorized" error?**

1. Check `.env` has all 3 values set
2. Restart backend: `go run main.go`
3. Check logs to see your IP
4. Add your IP to `ALLOWED_IPS`

**Still not working?**
Check backend logs - they show exactly why auth failed:

```
Unauthorized request from IP: 192.168.1.XXX - No authorization provided
```

## 📚 Full Documentation

See `SECURITY.md` for complete details.

## ⚡ Start Backend

```powershell
cd backend
go run main.go
```

Watch for log messages like:

- `Request authorized via IP whitelist: ...`
- `Request authorized via API key from IP: ...`
- `Request authorized via JWT token for user: ...`

---

**You're all set!** 🎮🔒
