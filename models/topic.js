var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var config = require('../config');
var _ = require('lodash');
var BaseModel = require("./base_model");

var TopicSchema = new Schema({
  title: {type: String},
  content: {type: String},
  author_id: {type: String},
  author_name: {type: String},
  create_at: {type: Date},
  reply_count: {type: Number, default: 0},
  reply: [{type: ObjectId}],
  last_reply: {type: ObjectId},
  last_reply_at: {type: Date},
  tags: [{type: String}]

  //update_at: {type: Date},
  //visit_count: { type: Number, default: 0 },
  //collect_count: {type: Number, default: 0},
  //top: { type: Boolean, default: false }, // 置顶帖
  //good: {type: Boolean, default: false}, // 精华帖
  //lock: {type: Boolean, default: false}, // 被锁定主题
  //content_is_html: { type: Boolean },
  //tab: {type: String},
  //deleted: {type: Boolean, default: false},
});

TopicSchema.plugin(BaseModel);
TopicSchema.index({create_at: -1});
TopicSchema.index({last_reply_at: -1});
TopicSchema.index({author_id: 1});
TopicSchema.index({author_name: 1});


//TopicSchema.virtual('tabName').get(function () {
//  var tab = this.tab;
//  var pair = _.find(config.tabs, function (_pair) {
//    return _pair[0] === tab;
//  });
//
//  if (pair) {
//    return pair[1];
//  } else {
//    return '';
//  }
//});

mongoose.model('Topic', TopicSchema);
