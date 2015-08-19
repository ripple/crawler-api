'use strict';
var express = require('express');
var app = express();
var rc_util = require('rippled-network-crawler/src/lib/utility.js');
var modelsFactory = require('rippled-network-crawler/src/lib/models.js');
var DB = require('rippled-network-crawler/src/lib/database');
var Promise = require('bluebird');
var _ = require("lodash");

var args = process.argv.slice(2);
if (args.length === 3) {
  var local_host = args[0];
  var local_port = args[1];
  var dbUrl = args[2];
} else {
  console.error('Need db url as argument');
  process.exit(1);
}

app.get('/', function(req, res) {
  var instructions = {
    'rippleds': 'GET /rippleds'
  }
  res.send(instructions);
});

app.get('/rippleds', function(req, res) {
  var logsql = true;
  rc_util.getLatestRow(dbUrl, logsql).then(function(row) {
    var rippleds = rc_util.getRippledsC(JSON.parse(row.data));
    var flatRippleds = _.map(rippleds, function(item, key) {
      item.public_key = key;
      return item;
    });
    res.send(flatRippleds);
  });
});


var server = app.listen(local_port, local_host, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Crawler API listening at http://%s:%s', host, port);
});
