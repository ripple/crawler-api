'use strict';
var express = require('express');
var app = express();
var rc_util = require('rippled-network-crawler/src/lib/utility.js');
var modelsFactory = require('rippled-network-crawler/src/lib/models.js');
var DB = require('rippled-network-crawler/src/lib/database');
var Promise = require('bluebird');

var args = process.argv.slice(2);
if (args.length === 3) {
  var local_host = args[0];
  var local_port = args[1];
  var dbUrl = args[2];
} else {
  console.error('Need db url as argument');
  process.exit(1);
}

function getLatestCrawl(dbUrl, logsql) {
  return new Promise(function(resolve, reject) {
    var log = logsql ? console.log : false;
    var sql = DB.initSql(dbUrl, log);

    var model = modelsFactory(sql);

    model.Crawl.findOne({
      order: [
        ['id', 'DESC']
      ]
    }).then(function(crawl) {
      if (!crawl) {
        return reject(new Error('No crawls in database'));
      }
      return resolve(crawl.dataValues);
    }).catch(function(error) {
      return reject(error);
    });
  });
}

app.get('/ipp', function(req, res) {
  var logsql = true;
  getLatestCrawl(dbUrl, logsql).then(function(latestCrawl) {
    var ipps = rc_util.getIpps(latestCrawl.data);
    res.send(ipps);
  });
});

app.get('/pubkey', function(req, res) {
  var logsql = true;
  getLatestCrawl(dbUrl, logsql).then(function(latestCrawl) {
    var ipps = rc_util.getRippledsC(latestCrawl.data);
    res.send(ipps);
  });
});


var server = app.listen(local_port, local_host, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Crawler API listening at http://%s:%s', host, port);
});
