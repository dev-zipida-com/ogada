# Stage 2: Use the Golang image as the base image
FROM golang:1.20

# Update and upgrade packages
RUN apt-get update -y -q && \
    apt-get upgrade -y -q

# Install required dependencies
RUN apt-get install -y \
    libnss3-dev \
    libx11-xcb1 \
    libxss1 \
    libasound2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libgbm1

RUN apt update && apt -y upgrade 

RUN apt -y install chromium

# Set the working directory
WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the rest of the application source
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Set the command to run the container
CMD ["./main"]
