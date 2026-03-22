# Microservices-Task (Kubernetes + Minikube)

This project deploys a simple Node.js microservices application on Kubernetes using Minikube.

## Architecture

```
Client
  |  /api/*
  v
Gateway Service (3003)
  |-- /api/users    -> User Service (3000)    /users
  |-- /api/products -> Product Service (3001) /products
  |-- /api/orders   -> Order Service (3002)   /orders
```

Kubernetes service discovery is done via ClusterIP DNS names:

- `http://user-service:3000`
- `http://product-service:3001`
- `http://order-service:3002`

## Prerequisites

- Docker Desktop (Linux containers) running
- `kubectl` installed
- `minikube` installed

Verify:

```powershell
docker info -f "{{.OSType}}"   # should be linux
kubectl version --client
minikube version
```

## 1a. Kubernetes Deployments (manifests)

Deployments are in the `k8s/` folder:

- `k8s/user-service-deployment.yaml`
- `k8s/product-service-deployment.yaml`
- `k8s/order-service-deployment.yaml`
- `k8s/gateway-service-deployment.yaml`

Each Deployment includes:

- container image reference (currently `*:1.1`)
- requests/limits
- environment variables
- readiness + liveness probes (`GET /health`)
- labels/selectors (`app: <service-name>`)

## 1b. Kubernetes Services (ClusterIP + discovery)

Services are also in `k8s/`:

- `k8s/user-service-service.yaml` (ClusterIP 3000)
- `k8s/product-service-service.yaml` (ClusterIP 3001)
- `k8s/order-service-service.yaml` (ClusterIP 3002)
- `k8s/gateway-service-service.yaml` (NodePort 3003)

The backend services are ClusterIP to enable in-cluster discovery. The gateway is NodePort so it can be reached from outside the cluster (or you can use port-forward).

## 2. Minikube Setup and Validation

### 2.1 Start Minikube

```powershell
minikube start --driver=docker
kubectl config current-context
```

### 2.2 Build images and load into Minikube

The manifests reference local images (`user-service:1.1`, etc.). Build them with Docker Desktop and load them into Minikube.

```powershell
docker build -t user-service:1.1 .\Microservices\user-service
docker build -t product-service:1.1 .\Microservices\product-service
docker build -t order-service:1.1 .\Microservices\order-service
docker build -t gateway-service:1.1 .\Microservices\gateway-service

minikube image load user-service:1.1
minikube image load product-service:1.1
minikube image load order-service:1.1
minikube image load gateway-service:1.1
```

### 2.3 Deploy all components

```powershell
kubectl apply -f .\k8s
```

### 2.4 Validate running state

```powershell
kubectl get pods -o wide
kubectl get svc
kubectl get endpoints

kubectl rollout status deploy/user-service
kubectl rollout status deploy/product-service
kubectl rollout status deploy/order-service
kubectl rollout status deploy/gateway-service
```

### 2.5 Validate inter-service communication

Port-forward the gateway and call the APIs:

```powershell
kubectl port-forward svc/gateway-service 13003:3003
```

In another terminal:

```powershell
curl.exe http://localhost:13003/health
curl.exe http://localhost:13003/api/users
curl.exe http://localhost:13003/api/products
curl.exe http://localhost:13003/api/orders
```

## 3. Ingress Configuration

Ingress manifest:

- `k8s/microservices-ingress.yaml`

It defines host + path routing:

- `/api/users` -> `user-service`
- `/api/products` -> `product-service`
- `/api/orders` -> `order-service`
- `/` -> `gateway-service`

### 3.1 Enable the ingress controller (Minikube addon)

```powershell
minikube addons enable ingress
```

If your environment blocks pulling from `registry.k8s.io` with a TLS/x509 error, pull the ingress images using Docker Desktop and load them into Minikube:

```powershell
docker pull registry.k8s.io/ingress-nginx/controller:v1.14.3
docker pull registry.k8s.io/ingress-nginx/kube-webhook-certgen:v1.6.7

minikube image load registry.k8s.io/ingress-nginx/controller:v1.14.3
minikube image load registry.k8s.io/ingress-nginx/kube-webhook-certgen:v1.6.7
```

Then restart ingress pods/jobs:

```powershell
kubectl -n ingress-nginx delete pod --all
kubectl -n ingress-nginx delete job --all
```

### 3.2 Apply the Ingress

```powershell
kubectl apply -f .\k8s\microservices-ingress.yaml
kubectl get ingress
```

### 3.3 Test host-based rules

For the Docker driver on Windows, Minikube typically requires `minikube tunnel` for Ingress to be reachable on localhost:

```powershell
minikube tunnel
```

Then test routing by sending the Host header:

```powershell
curl.exe -H "Host: microservices.local" http://127.0.0.1/api/users
curl.exe -H "Host: microservices.local" http://127.0.0.1/api/products
curl.exe -H "Host: microservices.local" http://127.0.0.1/api/orders
curl.exe -H "Host: microservices.local" http://127.0.0.1/health
```

## 4. Documentation and Testing

### 4.1 Health checks

- `GET /health` exists on all services.

### 4.2 Logs proving service communication

Tail gateway logs while calling `/api/*`:

```powershell
kubectl logs -f deploy/gateway-service
```

In another terminal, tail a backend:

```powershell
kubectl logs -f deploy/user-service
```

You should see lines like:

- `gateway-service upstream users GET http://user-service:3000/users -> 200 ...`
- `user-service GET /users -> 200 ...`

### 4.3 Cleanup

```powershell
kubectl delete -f .\k8s
minikube stop
```

## Notes

- The gateway supports configurable upstream URLs via `USER_SERVICE_URL`, `PRODUCT_SERVICE_URL`, and `ORDER_SERVICE_URL` (defaults match in-cluster DNS names).
- If you change image tags in the manifests, rebuild and `minikube image load` with the same tags.
