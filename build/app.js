"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var bodyParser = require('body-parser');
var app = express_1.default();
var morgan = require('morgan');
var api = require('./routes/api/apriori');
var api_mb = require('./routes/api/useMetabase');
var api_debug = require('./routes/api/debug');
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({
    extended: false,
}));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});
app.use('/apriori', api);
app.use('/useMetabase', api_mb);
app.use('/debug', api_debug);
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
