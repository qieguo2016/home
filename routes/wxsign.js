var express = require('express');
var router = express.Router();
var request = require('request');
var crypto = require('crypto');
var config = require('../config');
var access_token = null, jsapi_ticket = null, lasttime = null;

var getToken = function (cb) {
  var tokenUrl = 'https://api.weixin.qq.com/cgi-bin/token' +
    '?grant_type=client_credential' +
    '&appId=' + config.appId +
    '&secret=' + config.appSecret;
  request.get(tokenUrl, function (error, response, body) {
    if (error) {
      cb('getToken error!', error);
    } else {
      try {
        access_token = JSON.parse(body).access_token;
        cb(null, access_token);
      } catch (e) {
        cb('getToken error!!!', e);
        console.error('try error', e);
      }
    }
  });
};

var getTicket = function (token, cb) {
  request.get('https://api.weixin.qq.com/cgi-bin/ticket/getticket' +
    '?access_token=' + token +
    '&type=jsapi', function (error, res, body) {
    if (error) {
      cb('getNewTicket error', error);
    } else {
      try {
        var ticket = JSON.parse(body).ticket;
        cb(null, ticket);
      } catch (e) {
        cb('getNewTicket error', e);
      }
    }
  });
};

var createSignature = function (ticket, url, cb) {
  var timestamp = createTimestamp();
  var noncestr = createNonceStr();
  var str = 'jsapi_ticket=' + ticket +
    '&noncestr=' + noncestr +
    '&timestamp=' + timestamp +
    '&url=' + url;
  var signature = crypto.createHash('sha1').update(str, 'utf-8').digest('hex');

  try {
    var wx_config = {
      appId: config.appId,
      timestamp: timestamp,
      nonceStr: noncestr,
      signature: signature
    };
    cb(null, wx_config);
  } catch (e) {
    cb('createSignature error', e);
  }

};

var createNonceStr = function () {
  return Math.random().toString(36).substr(2, 15);
};

var createTimestamp = function () {
  return parseInt(new Date().getTime() / 1000) + '';
};

var setMenu = function (cb) {

  getToken(function (error, token) {
    if (error) {
      cb('getToken error!', error);
      console.error('error!', error);
    } else {
      var options = {
        method: 'POST',
        url: 'https://api.weixin.qq.com/cgi-bin/menu/create',
        qs: {access_token: token},
        headers: {
          'cache-control': 'no-cache',
          'content-type': 'application/json'
        },
        body: config.menu,
        json: true
      };

      request(options, function (error, response, body) {
        if (error) {
          cb('getToken request error!', error);
        }
        cb(null, body);
        console.log('msg: ', body);
      });
    }
  });

};

router.get('/setmenu', function (req, res, next) {
  setMenu(function (error, sres) {
    if (error) {
      res.send({'error': error});
      console.error('error!', error);
    } else {
      res.send({'msg': sres});
    }
  });
});

router.get('/', function (req, res, next) {

  console.log('-------- check signature --------');
  var signature = req.query.signature;
  var timestamp = req.query.timestamp;
  var nonce = req.query.nonce;
  var echostr = req.query.echostr;
  console.log('@@@@ req query: ', req.query);

  /*  加密/校验流程如下： */
  //1. 将token、timestamp、nonce三个参数进行字典序排序
  var array = new Array(config.appToken, timestamp, nonce);
  array.sort();
  var str = array.toString().replace(/,/g, "");
  console.log('@@@@ str: ', str);

  //2. 将三个参数字符串拼接成一个字符串进行sha1加密
  var sha1Code = crypto.createHash("sha1");
  var code = sha1Code.update(str, 'utf-8').digest("hex");
  console.log('@@@@ code: ', code);

  //3. 开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
  if (code === signature) {
    res.end(echostr);
    console.log('@@@@ Confirm and send echo back', echostr);
  } else {
    res.end("error");
  }

});

router.post('/', function (req, res, next) {

  console.log('======= wxsign =======');

  var myUrl = req.query.url;
  console.log(req.query);

  if (!myUrl) {
    res.send('======= Invalid requests: url is must! =======');
    console.log('======= Invalid requests: url is must! =======');
    console.log(req.query);
  } else {
    var now = new Date().getTime();
    // 未获得ticket或者ticket已过期（快要过期）
    if (!jsapi_ticket || (now - lasttime) > 1000 * 7100) {
      console.log('======= url =======');
      console.log(myUrl);
      getToken(function (error, token) {
        if (error) {
          res.json({
            'error': error
          });
        } else {
          console.log('======= token =======');
          console.log(token);
          getTicket(token, function (error, ticket) {
            if (error) {
              res.json({
                'error': error
              });
            } else {
              console.log('======= ticket =======');
              console.log(ticket);
              jsapi_ticket = ticket;
              lasttime = new Date().getTime();
              // request异步回调函数，不能跟下面的else合并
              createSignature(jsapi_ticket, myUrl, function (error, cbData) {
                if (error) {
                  res.json({
                    'error': error
                  });
                } else {
                  console.log('======= wx_config =======');
                  console.log(cbData);
                  res.json(cbData);
                }
              });
            }
          });
        }
      });
    } else {
      createSignature(jsapi_ticket, myUrl, function (error, cbData) {
        if (error) {
          res.json({
            'error': error
          });
        } else {
          console.log('======= wx_config =======');
          console.log(cbData);
          res.json(cbData);
        }
      });
    }
  }
});

module.exports = router;