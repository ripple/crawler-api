'use strict';
var express = require('express');
var app = express();
var Client = require('crawler-hbase').Client;
var utils = require('crawler-hbase').utils;
var Promise = require('bluebird');
var _ = require('lodash');

var args = process.argv.slice(2);
if (args.length === 3) {
  var local_host = args[0];
  var local_port = args[1];
  var dbUrl = args[2];
} else {
  console.error('Need db url as argument');
  process.exit(1);
}
var hbaseClient = new Client(dbUrl);

app.get('/', function(req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  var instructions = {
    'rippleds': 'GET /rippleds',
    'graph': 'GET /graph'
  };
  res.send(instructions);
});

app.get('/rippleds', function(req, res) {
  res.header('Access-Control-Allow-Origin', '*');

  console.log('/rippleds requested');
  hbaseClient.getCrawlInfo()
  .then(function(crawlInfo) {
    return hbaseClient.getCrawlNodeStats(crawlInfo.rowkey).then(function(nodeStats) {
      var rippleds = _.map(nodeStats, function(r) {
        return {
          'version': r.version,
          'uptime': parseInt(r.uptime),
          'in': parseInt(r.in_count),
          'out': parseInt(r.out_count),
          'public_key': r.pubkey,
          'in_add_count': r.in_add_count,
          'out_add_count': r.out_add_count,
          'in_drop_count': r.in_drop_count,
          'out_drop_count': r.out_drop_count,
          'ipp': r.ipp,
        };
      });
      res.send(rippleds);
    });
  })
  .catch(function(err) {
    console.log(err);
    res.status(500);
    res.send('Internal Server Error');
    process.exit(1);
  });
});

app.get('/graph', function(req, res) {
  res.header('Access-Control-Allow-Origin', '*');

  function graphify(crawlKey) {
    return new Promise(function(resolve, reject) {

      var results = {nodes: [], links: []};
      Promise.all([
        hbaseClient.getCrawlNodeStats(crawlKey),
        hbaseClient.getAllConnections(crawlKey)
      ])
      .then(function(retArray) {
        var rippleds = retArray[0];
        var links = retArray[1];
        var pkToIndex = {};
        _.each(rippleds, function(r) {
          pkToIndex[r.pubkey] = results.nodes.length;
          var node = {
            'version': r.version,
            'uptime': parseInt(r.uptime),
            'in': parseInt(r.in_count),
            'out': parseInt(r.out_count),
            'public_key': r.pubkey,
            'in_add_count': r.in_add_count,
            'out_add_count': r.out_add_count,
            'in_drop_count': r.in_drop_count,
            'out_drop_count': r.out_drop_count,
            'ipp': r.ipp,
          };
          results.nodes.push(node);
        });
        _.each(links, function(l) {
          var sIndex = pkToIndex[utils.getSourceByConnectionKey(l.rowkey)];
          var tIndex = pkToIndex[utils.getTargetByConnectionKey(l.rowkey)];
          if (sIndex !== undefined && tIndex !== undefined) {
            var newlink = {};
            newlink.source = sIndex;
            newlink.target = tIndex;
            newlink.value = 1;
            results.links.push(newlink);
          }
        });
        return resolve(results);
      })
      .catch(reject);
    });
  }

  hbaseClient.getCrawlInfo()
  .then(function(crawlInfo) {
    return graphify(crawlInfo.rowkey).then(function(graph) {
      res.send(graph);
    });
  })
  .catch(function(err) {
    console.log(err);
    res.status(500);
    res.send('Internal Server Error');
    process.exit(1);
  });

});


var server = app.listen(local_port, local_host, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Crawler API listening at http://%s:%s', host, port);
});
