var JSONStream = require('JSONStream')
var request = require('request')
var spawn = require('child_process').spawn

module.exports = local

function Queue (fn) {
  this.queue = []
  this.fn = fn
}

Queue.prototype.add = function (obj) {
  this.queue.push(obj)
  if (this.queue.length == 1) this.process()
}

Queue.prototype.process = function () {
  var self = this
  if (!self.queue.length) return
  var obj = self.queue[0]
  this.fn(obj, function () {
    self.queue.shift()
    self.process()
  })
}

function local () {
  request('http://isaacs.iriscouch.com/registry/', function (err, res, body) {
    var docs = JSON.parse(body).doc_count

    var i = 0
    var queue = new Queue(function (pkg, done) {
      console.log('(' + (++i) + '/' + docs + ') install ' + pkg.key)
      spawn('npm', ['install', pkg.key]).on('exit', done)
    })

    request('http://isaacs.iriscouch.com/registry/_all_docs')
      .pipe(JSONStream.parse(['rows', true]))
      .on('data', queue.add.bind(queue))
  })
}
