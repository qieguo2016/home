/**
 * Created by zhouyongjia on 2016/8/31.
 */
'use strict';

var request = require("request");
var cheerio = require("cheerio");
var keywords = require('./../models/keywords.js');
var userAgent = require('./spider.config.js').userAgent.win;

var models = require('./../models/index');
var Topic = models.Topic;

//var searchWord = require('./search.js');
//searchWord.init(keywords);
//var result = searchWord.search(col.title + col.content).sort();
//var _tags = [result[0]];
//for (var i = 1, len = result.length; i < len; i++) {
//  if (_tags[_tags.length - 1] !== result[i]) {
//    _tags.push(result[i]);
//  }
//}

// url: 'https://www.douban.com/group/topic/90144149/',

function fetchDetail(opt) {

  var options = {
    method: 'GET',
    url: opt.url,
    headers: {
      'cache-control': 'no-cache',
      'http-only': true,
      'user-agent': userAgent
    }
  };

  opt.headers && (options.headers = opt.headers);

  request(options, function (error, response, body) {
    if (error) {
      throw new Error(error);
    }
    var $ = cheerio.load(body, {
      normalizeWhitespace: true,
      decodeEntities: false
    });

    getData($, function (err) {
      if (err) {
        console.error('Save fail!');
        return;
      } else {
        console.log('Save success!');
      }
    });
  });
}

function getData($, cb) {

  var topic = new Topic();
  topic.topic_id = /topic\/(\w+)\/$/.exec(options.url)[1];

  var $root = $('.article');
  var $title = $('.tablecc', $root);
  if ($title) {
    topic.title = $title.text().substr(3);
  } else {
    topic.title = $('#content h1').text().trim();
  }
  var $author = $('.from a', $root);
  topic.author.id = /people\/(\w+)\/$/.exec($author.attr('href'))[1];
  topic.author.name = $author.text();
  topic.create_at = new Date($author.parent().next().text());

  var $content = $('#link-report', $root);
  topic.content = $content.text();
  topic.imgs = [];
  $('img', $content).each(function (i, el) {
    topic.imgs[i] = $(this).attr('src');
  });

  var $reply = $(".reply-doc", $root);
  topic.reply_count = $reply.length;
  topic.last_reply_at = new Date($('.pubtime', $reply[$reply.length - 1]).text());

  topic.save(function (err) {
    if (err) {
      cb && cb(err);
    } else {
      cb && cb();
    }
  });
}

module.exports = fetchDetail;