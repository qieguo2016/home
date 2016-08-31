/**
 * Created by qieguo on 2016/8/25 0025.
 */

'use strict';

var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  res.render('index');
});

module.exports = router;