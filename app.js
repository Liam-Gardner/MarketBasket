const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const morgan = require('morgan');

const api = require('./routes/api/apriori');
const api_mb = require('./routes/api/useMetabase');
const api_debug = require('./routes/api/debug');

app.use(morgan('dev'));
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
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
app.use((req, res, next) => {
  const error = new Error('Not Found!');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

module.exports = app;
