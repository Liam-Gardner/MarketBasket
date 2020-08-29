require('dotenv').config();
import * as http from 'http';
const port = process.env.PORT || 3500;
const address = process.env.address || 'localhost';
const app = require('./app');

// server setup
const server = http.createServer(app);
server.listen(port);
console.log(`Market Basket analysis listening at http://${address}:${port}`);
