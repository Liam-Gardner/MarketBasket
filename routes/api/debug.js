const express = require('express');
const router = express.Router();
const fs = require('fs');

router.post('/createFolder', (req, res) => {
  //   const fileName = req.body.nameForFile;
  const folderName = req.body.nameForFolder;
  fs.mkdir(folderName, { recursive: true }, err => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
    } else {
      res.sendStatus(200);
    }
  });
});

module.exports = router;
