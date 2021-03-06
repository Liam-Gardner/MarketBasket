"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var bodyParser = require('body-parser');
var app = express_1.default();
var morgan = require('morgan');
var path = require('path');
var api_mb = require('./routes/api/useMetabase');
app.use('/plots', express_1.default.static('./plots'));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({
    extended: false,
}));
app.use(bodyParser.json());
var accessOrigin = process.env.ENVIRONMENT !== 'DEV' ? 'https://liam-gardner.github.io' : '*';
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', accessOrigin);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Origin', accessOrigin);
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});
app.use('/useMetabase', api_mb);
//err handling
app.use(function (req, res, next) {
    var error = new Error('Not Found!');
    res.status(404);
    next(error);
});
app.use(function (error, req, res, next) {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message,
        },
    });
});
module.exports = app;
