require('dotenv').config();
const http = require('http');
const port = process.env.PORT || 3000;
const address = process.env.address || 'localhost';
const app = require('./app');

// server setup
const server = http.createServer(app);
server.listen(port);
console.log(`Market Basket analysis listening at http://${address}:${port}`);
