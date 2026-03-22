const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
const port = 3003;

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(`${new Date().toISOString()} gateway-service ${req.method} ${req.originalUrl} -> ${res.statusCode} ${durationMs}ms`);
  });
  next();
});

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3000';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3002';

async function forwardGet(routeLabel, targetUrl, res) {
  const startedAt = Date.now();
  try {
    const response = await axios.get(targetUrl, { timeout: 5000 });
    const durationMs = Date.now() - startedAt;
    console.log(`${new Date().toISOString()} gateway-service upstream ${routeLabel} GET ${targetUrl} -> ${response.status} ${durationMs}ms`);
    res.status(response.status).json(response.data);
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const upstreamStatus = error.response?.status;
    console.log(`${new Date().toISOString()} gateway-service upstream ${routeLabel} GET ${targetUrl} -> ${upstreamStatus || 'ERR'} ${durationMs}ms`);
    res.status(500).json({ error: `Error fetching ${routeLabel}` });
  }
}

async function forwardPost(routeLabel, targetUrl, body, res) {
  const startedAt = Date.now();
  try {
    const response = await axios.post(targetUrl, body, { timeout: 5000 });
    const durationMs = Date.now() - startedAt;
    console.log(`${new Date().toISOString()} gateway-service upstream ${routeLabel} POST ${targetUrl} -> ${response.status} ${durationMs}ms`);
    res.status(response.status).json(response.data);
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const upstreamStatus = error.response?.status;
    console.log(`${new Date().toISOString()} gateway-service upstream ${routeLabel} POST ${targetUrl} -> ${upstreamStatus || 'ERR'} ${durationMs}ms`);
    res.status(500).json({ error: `Error creating ${routeLabel}` });
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'Gateway Service is healthy' });
});

app.get('/api/users', async (req, res) => {
  await forwardGet('users', `${USER_SERVICE_URL}/users`, res);
});

app.get('/api/products', async (req, res) => {
  await forwardGet('products', `${PRODUCT_SERVICE_URL}/products`, res);
});

app.get('/api/orders', async (req, res) => {
  await forwardGet('orders', `${ORDER_SERVICE_URL}/orders`, res);
});

app.post('/api/orders', async (req, res) => {
  await forwardPost('orders', `${ORDER_SERVICE_URL}/orders`, req.body, res);
});

app.listen(port, () => {
  console.log(`Gateway service running on port ${port}`);
});