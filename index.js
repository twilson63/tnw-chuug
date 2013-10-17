var fs = require('fs');
var req = require('hyperquest');
var _ = require('underscore');
var es = require('event-stream');
var async = require('async');
var wordCount = {};

console.time('wc');
var src = process.argv[2];
if (!src) { console.log('src file required'); return; }

fs.readFile(src, function(err, data) {
  var urls = data.toString().split('\n');
  urls.pop();
  async.map(urls, count, function(err, results) {
    console.dir(results[0]);
    console.timeEnd('wc');
  });
});


function count(url, done) {
  if (url.length > 0) {
  es.pipeline(
    req(url),
    es.split('\n'),
    es.map(function(data, cb) {
      var _wordCounts = _.chain(data.toString().split(' '))
         .map(function(line) { 
           return line.split(' ');
         })
         .flatten()
         .reduce(function(counts, word) {
           word = word.toUpperCase()
            .replace(/\r|\.|;|,|:|_$/,'')
            .replace(/^_/, '');
           counts[word] = (counts[word] || 0) + 1;
           return counts;
         }, {})
        .tap(function(obj) {
          _.each(obj, function(v, k) {
            wordCount[k] = (wordCount[k] || 0) + v;
          });
          return obj;
        })
        .value();   
      cb(null, data);
    }),
    es.wait(function(err, data) {
      done(null, wordCount);
    })
  );
  }
}
