const express = require('express');
const app = express();
const port = 3001;

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(`${new Date().toISOString()} product-service ${req.method} ${req.originalUrl} -> ${res.statusCode} ${durationMs}ms`);
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'Product Service is healthy' });
});

app.get('/products', (req, res) => {
  const products = [
    { id: 1, name: 'Laptop', price: 999 },
    { id: 2, name: 'Phone', price: 699 }
  ];
  res.json(products);
});

app.listen(port, () => {
  console.log(`Product service running on port ${port}`);
});