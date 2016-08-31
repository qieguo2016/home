/**
 * Created by qieguo on 2016/8/28 0028.
 */

'use strict';

var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  res.render('cv');
});

module.exports = router;