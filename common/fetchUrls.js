/**
 * Created by qieguo on 2016/8/25 0025.
 */

'use strict';

var request = require("request");
var cheerio = require("cheerio");
var async = require('async');
var userAgent = require('./spider.config.js').userAgent.win;

// 爬帖子title、href、lastmodified
var concurrencyCount = 0;
function fetchUrl(opt, callback, ago) {
  concurrencyCount++;
  console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', opt.url);
  ago = ago || 604800000;      // 604800000 = 7 days
  request(opt, function (error, response, body) {
    if (error) {
      throw new Error(error);
    }
    var $ = cheerio.load(body, {
      normalizeWhitespace: true,
      decodeEntities: false
    });
    var items = [];
    var year = new Date().getFullYear();
    var isStop = false;
    $('.olt tr').slice(1).each(function (index, el) {
      var lastTime = $('.time', el).text();
      if (Date.now() - new Date(year + '-' + lastTime) > ago) {
        isStop = true;
        return false;
      }
      var $item = $('.title > a', el);
      items.push({
        title: $item.attr('title'),
        href: $item.attr('href'),
        lastTime: lastTime
      });
    });
    if (isStop) {
      callback('error: too long ago', items);
    } else {
      concurrencyCount--;
      console.log('fetch url success,', opt.url);
      callback(null, items);
    }
  });
}

/**
 * 请求参数初始化
 * @param: urls:请求的url、 opts：请求header参数， num：爬取的页数
 */
function initRequestOpt(urls, num) {
  var opts = [];
  urls.forEach(function (url) {
    for (var i = 0; i < num; i++) {
      opts.push({
        method: 'GET',
        url: url + '?start=' + (i * 25).toString(),
        headers: {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'cache-control': 'no-cache',
          'http-only': true,
          'user-agent': userAgent
        }
      });
    }
  });
  return opts;
}

/**
 * 关键词筛选
 * @param: str:被筛选的字符串、 words：正则表达式参数（数组）
 * @return: true:包含所有关键词、 false:不全包含给出的关键词
 */
function checkIncludeWords(str, words) {
  var result = words.every(function (word) {
    return new RegExp(word, 'g').test(str);
  });
  return result;
}

/**
 * 关键词排除
 * @param: str:被筛选的字符串、 words：正则表达式参数（数组）
 * @return: true:不包含任一关键词、 false:包含给出的关键词
 */
function checkExcludeWords(str, words) {
  var result = words.some(function (word) {
    return new RegExp(word, 'g').test(str);
  });
  return !result;
}

/**
 * 控制请求的并发为5，完成数据爬取
 * @params: baseUrls:[], num: 请求数, daysAgo: 在此之前的数据不爬
 * @return: 爬取的结果
 * */
module.exports = function (baseUrls, num, cb, daysAgo) {
  var opts = initRequestOpt(baseUrls, num);
  var ago = daysAgo && daysAgo * 1000 * 60 * 60 * 24;
  async.mapLimit(opts, 5, function (opt, callback) {
    fetchUrl(opt, callback, ago);
  }, function (err, results) {
    results = results.reduce(function (pre, next) {
      return pre.concat(next);
    });
    if (err) {
      console.log('fetchUrl Error: ', err);
      return cb(err, results);
    }
    console.log(results);
    console.log('finish! data number:  ', results.length);
    cb(null, results);
  });
};