const express = require('express');
const router = express.Router();
const { exec, spawn, execFile } = require('child_process');

router.post('', () => {
  // spawn R
  // respond with the rules
  res.status(200);
});

module.exports = router;
