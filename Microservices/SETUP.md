# Microservices Docker Setup Guide

## Project Structure

```
Microservices-Task/
├── docker-compose.yml
├── Microservices/
│   ├── gateway-service/
│   │   ├── app.js
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── user-service/
│   │   ├── app.js
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── product-service/
│   │   ├── app.js
│   │   ├── Dockerfile
│   │   └── package.json
│   └── order-service/
│       ├── app.js
│       ├── Dockerfile
│       └── package.json
```

## Step 1: Create Dockerfiles for Each Service

Each microservice has its own Dockerfile. All services follow the same pattern with only the `EXPOSE` port differing.

### User Service (`Microservices/user-service/Dockerfile`)

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm config set strict-ssl false && npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Product Service (`Microservices/product-service/Dockerfile`)

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm config set strict-ssl false && npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Order Service (`Microservices/order-service/Dockerfile`)

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm config set strict-ssl false && npm install
COPY . .
EXPOSE 3002
CMD ["npm", "start"]
```

### Gateway Service (`Microservices/gateway-service/Dockerfile`)

```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm config set strict-ssl false && npm install
COPY . .
EXPOSE 3003
CMD ["npm", "start"]
```

### Dockerfile Explanation

| Instruction | Purpose |
|---|---|
| `FROM node:24-alpine` | Uses a lightweight Node.js 24 Alpine base image |
| `WORKDIR /app` | Sets the working directory inside the container |
| `COPY package*.json ./` | Copies package.json and package-lock.json for dependency installation |
| `RUN npm config set strict-ssl false && npm install` | Disables strict SSL (for corporate proxy environments) and installs dependencies |
| `COPY . .` | Copies the application source code into the container |
| `EXPOSE <port>` | Documents the port the service listens on |
| `CMD ["npm", "start"]` | Starts the application using the `start` script from package.json |

> **Note:** Each service's `package.json` must include a `"start"` script:
> ```json
> "scripts": {
>   "start": "node app.js"
> }
> ```

---

## Step 2: Create Docker Compose File

Create `docker-compose.yml` in the project root (`Microservices-Task/`):

```yaml
version: '3.8'

services:
  user-service:
    build: ./Microservices/user-service
    ports:
      - "3000:3000"
    networks:
      - microservices-network

  product-service:
    build: ./Microservices/product-service
    ports:
      - "3001:3001"
    networks:
      - microservices-network

  order-service:
    build: ./Microservices/order-service
    ports:
      - "3002:3002"
    networks:
      - microservices-network

  gateway-service:
    build: ./Microservices/gateway-service
    ports:
      - "3003:3003"
    depends_on:
      - user-service
      - product-service
      - order-service
    networks:
      - microservices-network

networks:
  microservices-network:
    driver: bridge
```

### Docker Compose Explanation

| Key | Purpose |
|---|---|
| `build` | Path to the service directory containing the Dockerfile |
| `ports` | Maps container port to host port (`host:container`) |
| `depends_on` | Ensures backend services start before the gateway |
| `networks` | Places all services on a shared bridge network so they can communicate by service name |

---

## Step 3: Build and Run All Services

Navigate to the `Microservices-Task/` directory and run:

```bash
docker compose up --build -d
```

- `--build` forces a rebuild of all images
- `-d` runs containers in detached (background) mode

### Verify Containers Are Running

```bash
docker compose ps
```

Expected output should show all 4 services with status **Up**:

| Service | Port |
|---|---|
| user-service | 0.0.0.0:3000 → 3000 |
| product-service | 0.0.0.0:3001 → 3001 |
| order-service | 0.0.0.0:3002 → 3002 |
| gateway-service | 0.0.0.0:3003 → 3003 |

### View Logs (if troubleshooting)

```bash
docker compose logs
```

---

## Step 4: Verify and Test Locally in the Browser

### Health Check Endpoints

Open the following URLs in your browser to verify each service is healthy:

| URL | Expected Response |
|---|---|
| http://localhost:3000/health | `{"status":"User Service is healthy"}` |
| http://localhost:3001/health | `{"status":"Product Service is healthy"}` |
| http://localhost:3002/health | `{"status":"Order Service is healthy"}` |
| http://localhost:3003/health | `{"status":"Gateway Service is healthy"}` |

### API Endpoints (via Gateway on port 3003)

| URL | Description | Expected Response |
|---|---|---|
| http://localhost:3003/api/users | Fetches users via gateway → user-service | `[{"id":1,"name":"John Doe"},{"id":2,"name":"Jane Smith"}]` |
| http://localhost:3003/api/products | Fetches products via gateway → product-service | `[{"id":1,"name":"Laptop","price":999},{"id":2,"name":"Phone","price":699}]` |
| http://localhost:3003/api/orders | Fetches orders via gateway → order-service | `[]` (empty initially) |

### Architecture Flow

```
Browser → Gateway Service (port 3003)
              ├── /api/users    → User Service (port 3000)
              ├── /api/products → Product Service (port 3001)
              └── /api/orders   → Order Service (port 3002)
```

---

## Step 5: Stop All Services

```bash
docker compose down
```

This stops and removes all containers and the network.
