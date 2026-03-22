const express = require('express');
const app = express();
const port = 3000;

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(`${new Date().toISOString()} user-service ${req.method} ${req.originalUrl} -> ${res.statusCode} ${durationMs}ms`);
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'User Service is healthy' });
});

app.get('/users', (req, res) => {
  const users = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' }
  ];
  res.json(users);
});

app.listen(port, () => {
  console.log(`User service running on port ${port}`);
});