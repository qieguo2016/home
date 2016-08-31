/**
 * Created by qieguo on 2016/8/25 0025.
 */

'use strict';

var express = require('express');
var router = express.Router();
var home = require('./home');
var cv = require('./cv');
var lagou = require('./spiderLagou');
var douban = require('./spiderDouban');
var card = require('./card');
var wxsign = require('./wxsign');

// 主页
router.use('/', home);

// 简历
router.use('/cv', cv);

// 爬豆瓣
router.use('/douban', douban);

// 爬拉勾
router.use('/lagou', lagou);

// 二维码名片
router.use('/card',card);

// 微信验证
router.use('/wxsign', wxsign);

module.exports = router;
