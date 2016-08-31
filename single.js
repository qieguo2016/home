/**
 * Created by zhouyongjia on 2016/8/31.
 */
'use strict';

var request = require("request");
var cheerio = require("cheerio");
var keywords = require('./models/keywords.js');
var searchWord = require('./common/search.js');

searchWord.init(keywords);

var options = {
  method: 'GET',
  url: 'https://www.douban.com/group/topic/90144149/',
  headers: {
    'cache-control': 'no-cache',
    'http-only': true,
    'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36'
  }
};

request(options, function (error, response, body) {
  if (error) {
    throw new Error(error);
  }
  var $ = cheerio.load(body, {
    normalizeWhitespace: true,
    decodeEntities: false
  });

  //topic_id: {type: String}
  //title: {type: String},
  //author_name: {type: String},
  //author_id: {type: String},
  //create_at: {type: Date},
  //content: {type: String},
  //reply_count: {type: Number, default: 0},
  //last_reply_at: {type: Date},
  //tags: [{type: String}]

  var col = {}, $root = $('#content');

  col.topic_id = /topic\/(\w+)\/$/.exec(options.url)[1];

  var $title = $('.tablecc', $root);
  if ($title.length > 0) {
    col.title = $title.text().substr(3);
  } else {
    col.title = $root.children('h1').text().trim();
  }

  var $author = $('.from a', $root);
  col.author_name = $author.text();
  col.author_id = /people\/(\w+)\/$/.exec($author.attr('href'))[1];

  col.create_at = new Date($author.parent().next().text());

  col.content = $('#link-report', $root).html();

  var $reply = $(".reply-doc", $root);
  col.reply_count = $reply.length;
  col.last_reply_at = new Date($('.pubtime', $reply[$reply.length - 1]).text());

  var result = searchWord.search(col.title + col.content).sort();
  var _tags = [result[0]];
  for (var i = 1, len = result.length; i < len; i++) {
    if (_tags[_tags.length - 1] !== result[i]) {
      _tags.push(result[i]);
    }
  }
  col.tags = _tags;

  console.log('data: ', col);
});
