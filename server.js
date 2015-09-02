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
  res.header("Access-Control-Allow-Origin", "*");
  var instructions = {
    'rippleds': 'GET /rippleds',
    'graph': 'GET /graph'
  }
  res.send(instructions);
});

app.get('/rippleds', function(req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  var logsql = true;
  rc_util.getLatestRow(dbUrl, logsql)
  .then(function(row) {
    var rippleds = rc_util.getRippledsC(JSON.parse(row.data));
    var flatRippleds = _.map(rippleds, function(item, key) {
      item.public_key = key;
      return item;
    });
    res.send(flatRippleds);
  })
  .catch(function(err) {
    console.log(err);
    res.status(500);
    res.send('Internal Server Error');
  });
});

app.get('/graph', function(req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  var logsql = true;

  function graphify(crawl) {
    var results = {nodes: [], links: []};
    var pkToIndex = {};
    var rippleds = rc_util.getRippledsC(crawl);
    var links = rc_util.getLinks(crawl);

    // Fill in nodes and save indices
    _.each(Object.keys(rippleds), function(pk) {
      pkToIndex[pk] = results.nodes.length;
      var node = rippleds[pk];
      node.public_key = pk;
      results.nodes.push(node);
    });

    // Format links to match d3
    _.each(Object.keys(links), function(link) {
      var sIndex = pkToIndex[link.split(',')[0]];
      var tIndex = pkToIndex[link.split(',')[1]];
      if (sIndex !== undefined && tIndex !== undefined) {
        var newlink = {};
        newlink.source = pkToIndex[link.split(',')[0]];
        newlink.target = pkToIndex[link.split(',')[1]];
        newlink.value = links[link];
        results.links.push(newlink);
      }
    });
    return results;
  }

  rc_util.getLatestRow(dbUrl, logsql).
  then(function(row) {
    var graph = graphify(JSON.parse(row.data));
    res.send(graph);
  })
  .catch(function(err) {
    console.log(err);
    res.status(500);
    res.send('Internal Server Error');
  });

});


var server = app.listen(local_port, local_host, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Crawler API listening at http://%s:%s', host, port);
});
