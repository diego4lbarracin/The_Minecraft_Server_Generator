# The Minecraft Server Generator

> **Test the App ->** [https://diego4lbarracin.github.io/The_Minecraft_Server_Generator/](https://diego4lbarracin.github.io/The_Minecraft_Server_Generator/)

![Project Screenshot](https://raw.githubusercontent.com/diego4lbarracin/Diego_Personal_Website/refs/heads/main/public/images/projects/Minecraft_Server_Generator.png)

In this project I created a web application that follows an API REST architecture and consists of a Minecraft Server Generator for Minecraft Java Edition to avoid having to use services offered by third parties that are full of ads, besides, to simplify the process of creating my own Minecraft Server using a user-friendly UI and automate the process of installing all the required software, turn on the server, set the server properties and configure all the related networking parameters (ports, IP addresses, etc).

---

## Table of `Contents`

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Security](#-security)
- [Author](#-author)
- [Support](#-support)

---

## Features

### Current Features

- **One-Click Server Creation**: Deploy a default Minecraft server in ~2 minutes.
- **Frontend and Backend Authentication**: Autheticantion has been enabled in both the frontend and backend using the Supabase authentication service (JWT Signing Keys) and a DB. A fuction that links a user to a record in a DB, whose primary key is the USER ID, is triggered after an INSERT in the authentication table and leaves a field called APPROVED as FALSE, which enables a required admin approval for each user before accessing all the application feautures.
- **AWS Integration**: Automatic EC2 instance provisioning and configuration using the AWS SDK. The EC2 instance type that is currently used is t3.medium, which has 2vCPUS and 4GB of RAM.
- **Docker-Based**: The project uses the Docker image [itzg/docker-minecraft-server](https://github.com/itzg/docker-minecraft-server) for running the Minecraft Server on the EC2 instancee. The backend, which handles requests from the frontend is also containerized and deployed using Docker + Render.
- **Server Auto-Shutdown**: The application checks the server logs and, after 5 minutes of inactivity, automatically shuts down the server (the EC2 instance) to save computing costs.

---

## Architecture

The application follows an API Rest architecture, where the frontend-side authenticates the user using a JWT, captures and sends HTTP requests to the backend using the defined endpoint for each functionality, then the backend checks that the request is being sent by an authenticated user using a JWT as well and, if everything is correct, the backend handles the request and, using the AWS SDK for Go, turns on the EC2 instance where the server is going to be hosted, installs the required software, fetches the docker image of the Minecraft Server from Docker Hub, turns the server on using the parameters sent by the client and, if successful, sends a confirmation message with the IP address back to the backend, which handles the response and sends it back to the frontend where it is finally displayed (IP address) to the user after 2 minutes, which is approximately the time it takes the EC2 instance and the Minecraft Server to be created.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  React 19 + Vite Frontend (GitHub Pages)             │   │
│  │  - Tailwind CSS for styling                          │   │
│  │  - React Router for navigation                       │   │
│  │  - Supabase Auth for authentication                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       SERVER SIDE                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Go Backend API (Gin Framework)                      │   │
│  │  - JWT Authentication (ES256)                        │   │
│  │  - AWS SDK v2 for EC2 management                     │   │
│  │  - Docker container orchestration                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ AWS SDK
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      AWS CLOUD                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  EC2 Instance (Amazon Linux 2023)                    │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  Docker Container                              │  │   │
│  │  │  - itzg/minecraft-server:latest                │  │   │
│  │  │  - Minecraft Java Edition Server               │  │   │
│  │  │  - Auto-shutdown monitor                       │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Security Groups: Port 25565 (Minecraft) + Port 22 (SSH)    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ TCP
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  MINECRAFT CLIENTS                          │
│           (Minecraft Java Edition - Any Version)            │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend

- **React**
- **Vite**
- **Tailwind CSS**
- **Supabase JS**

### Backend

- **Go 1.25**
- **Gin**
- **AWS SDK v2**
- **JWT (golang-jwt/jwt/v5)**
- **godotenv**

### Infrastructure

- **Amazon Linux 2023** - Base OS
- **AWS EC2 t3.medium** - Instance type.
- **AWS IMDSv2** - Instance metadata service
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipeline
- **GitHub Pages** - Frontend hosting
- **Render** - Backend hosting.

### Database & Auth

- **Supabase** - Authentication and user management
- **PostgreSQL** - User profiles and permissions (via Supabase)

---

## Project Structure

```
The_Minecraft_Server_Generator/
│
├── .github/
│   └── workflows/
│       └── deploy-frontend.yml          # CI/CD for frontend deployment
│
├── frontend/                            # React frontend application
│   ├── public/
│   │   ├── 404.html                     # GitHub Pages SPA routing
│   │   └── minecraft-favicon.png        # Favicon
│   │
│   ├── src/
│   │   ├── components/                  # Reusable React components
│   │   │   ├── CustomAlert.jsx          # Custom alert modal
│   │   │   ├── Footer.jsx               # Footer with social links
│   │   │   ├── Header.jsx               # Navigation header
│   │   │   ├── ProtectedRoute.jsx       # Auth guard for private routes
│   │   │   └── PublicRoute.jsx          # Redirect if authenticated
│   │   │
│   │   ├── config/
│   │   │   └── supabaseClient.js        # Supabase initialization
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx          # Global auth state management
│   │   │
│   │   ├── pages/                       # Page components
│   │   │   ├── DashboardPage.jsx        # User dashboard
│   │   │   ├── LandingPage.jsx          # Home page
│   │   │   ├── LoginPage.jsx            # Login form
│   │   │   ├── PendingApprovalPage.jsx  # Waiting for admin approval
│   │   │   ├── ServerStatusPage.jsx     # Server creation progress
│   │   │   └── SignUpPage.jsx           # Registration form
│   │   │
│   │   ├── App.css                      # Component styles
│   │   ├── App.jsx                      # Main app component with routing
│   │   ├── index.css                    # Global styles + Tailwind
│   │   └── main.jsx                     # Application entry point
│   │
│   ├── .env.example                     # Environment variables template
│   ├── .gitignore                       # Git ignore rules
│   ├── eslint.config.js                 # ESLint configuration
│   ├── index.html                       # HTML template
│   ├── package.json                     # Frontend dependencies
│   ├── postcss.config.js                # PostCSS configuration
│   ├── tailwind.config.js               # Tailwind CSS configuration
│   └── vite.config.js                   # Vite configuration
│
├── backend/                             # Go backend API
│   ├── handlers/                        # HTTP request handlers
│   │   ├── ec2_handler.go               # EC2 instance creation
│   │   └── minecraft_handler.go         # Minecraft server creation
│   │
│   ├── middleware/                      # HTTP middlewares
│   │   └── auth.go                      # JWT authentication (ES256)
│   │
│   ├── models/                          # Data models
│   │   ├── ec2.go                       # EC2 instance models
│   │   └── minecraft.go                 # Minecraft server models
│   │
│   ├── services/                        # Business logic
│   │   ├── ec2_service.go               # AWS EC2 operations
│   │   └── minecraft_service.go         # Minecraft server deployment
│   │
│   ├── .dockerignore                    # Docker ignore rules
│   ├── .env.example                     # Backend environment template
│   ├── api_requests.http                # API testing file (VS Code REST Client)
│   ├── Dockerfile                       # Docker image definition
│   ├── go.mod                           # Go module definition
│   ├── go.sum                           # Go dependencies lock file
│   ├── main.go                          # Application entry point
│   └── test_minecraft_api.ps1           # PowerShell test script
│
├── .gitignore                           # Root Git ignore rules
└── README.md                            # This file
```

---

## Deployment

### Frontend (GitHub Pages)

Frontend is automatically deployed via GitHub Actions when pushing to `main` branch.

The workflow ([`.github/workflows/deploy-frontend.yml`](.github/workflows/deploy-frontend.yml)) handles:

- Building with production environment variables (GitHub Secrets Manager).
- Uploading to GitHub Pages.
- Automatic deployment,

**GitHub Secrets Required:**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL` (your deployed backend URL)

### Backend (Currently on Render)

Backend is deployed on Render. The repository is linked to render. The directory `/backend` is set as root directory on Render, where it automatically builds and run the container based on the instructions in the Dockerfile.

**Using Docker:**

```bash
cd backend
docker build -t minecraft-server-generator-api .
docker run -p 8080:8080 --env-file .env minecraft-server-generator-api
```

**Environment variables for production:**

- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `SUPABASE_JWT_PUBLIC_KEY`
- `PORT` (default: 8080)

---

## API Documentation

### Base URL

```
Production: https://your-backend.com
Development: http://localhost:8080
```

### Endpoints

#### Health Check

```http
GET /minecraft/health
```

**Response:**

```json
{
  "status": "healthy",
  "service": "minecraft-server-manager"
}
```

#### Create Minecraft Server (Protected)

```http
POST /minecraft/create
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "eula": true,
  "server_name": "my-minecraft-server",
  "minecraft_type": "VANILLA",
  "version": "LATEST",
  "max_players": 20,
  "gamemode": "survival",
  "difficulty": "normal",
  "motd": "Welcome to my server!",
  "memory": "3G",
  "online_mode": false,
  "instance_type": "t3.medium"
}
```

**Response:**

```json
{
  "instance_id": "i-0123456789abcdef0",
  "public_ip": "54.123.45.67",
  "private_ip": "172.31.0.10",
  "state": "running",
  "instance_type": "t3.medium",
  "launch_time": "2025-01-20T12:00:00Z",
  "availability_zone": "us-east-1a",
  "server_name": "my-minecraft-server",
  "minecraft_version": "LATEST",
  "server_type": "VANILLA",
  "server_port": 25565,
  "server_address": "54.123.45.67:25565",
  "message": "Minecraft server is being set up..."
}
```

### Authentication

**Get JWT Token:**

```javascript
// Frontend (using Supabase)
const {
  data: { session },
} = await supabase.auth.getSession();
const token = session?.access_token;

// Use in API calls
fetch("http://localhost:8080/minecraft/create", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

---

## Security

### Authentication Strategy

- **JWT Tokens**: ES256 (ECDSA with P-256 curve) signed by Supabase
- **Token Validation**: Backend verifies signature using Supabase's public JWK
- **User Approval**: Admin must approve new users before granting access
- **RLS Policies**: Row-level security on Supabase profiles table

### Network Security

- **Security Groups**: Automatic creation with minimal required ports
- **Port 25565**: Minecraft server (TCP)
- **Port 22**: SSH access for administration
- **HTTPS**: Frontend served via GitHub Pages (TLS 1.3)

---

## Author

- **Personal Website**: [www.diego4lbarracin.com](diego4lbarracin.com)
- **GitHub**: [@diego4lbarracin](https://github.com/diego4lbarracin)
- **LinkedIn**: [diego4lbarracin](https://linkedin.com/in/diego4lbarracin)
- **Email**: [diegoalbarracin0405@gmail.com](mailto:diegoalbarracin0405@gmail.com)

---

## Support

If you encounter any issues or have questions:

1. Open a new issue with detailed description
2. Contact via email: [diegoalbarracin0405@gmail.com](mailto:diegoalbarracin0405@gmail.com)

---

<div align="center">
Copyright (c) 2026 Diego Albarracín
All rights reserved.
This software is proprietary and may not be copied, modified, or distributed
without explicit written permission from the author (me 🤠).

**Developed by [diego4lbarracin](https://github.com/diego4lbarracin)**

[⬆ Back to Top](#the-minecraft-server-generator-)

</div>
