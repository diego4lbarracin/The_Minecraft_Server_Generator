# Build stage
FROM golang:1.25-alpine AS builder

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Final stage
FROM alpine:latest

# Install ca-certificates for HTTPS and AWS CLI dependencies
RUN apk --no-cache add ca-certificates curl

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/main .

# Copy scripts directory (needed for EC2 init scripts)
COPY --from=builder /app/scripts ./scripts

# Expose port (Render will override with PORT env variable)
EXPOSE 8080

# Run the application
CMD ["./main"]
