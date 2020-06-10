'use strict';

const express = require('express');

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.get('/', (req, res) => {
  res.send(' GET World');
});

app.post('/',(req, res) => {
  res.send(' POST World');
});

app.put('/', (req, res) => {
  res.send(' PUT World');
});

app.delete('/', (req, res) => {
  res.send(' DELETE World');
});
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
