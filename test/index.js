var test = require('tape')
var express = require('express')
var http = require('http')
var proxyquire = require('proxyquire')
var freeport = require('find-free-port')
var Server = require('../server')
var Client = proxyquire('../client', {
  xhr: require('request')
})

var services = [
  {
    manifest: {path: 'first', methods: ['addOne']},
    methods: {
      addOne: (data, callback) => callback(null, data + 1)
    }
  },
  {
    manifest: {path: 'first', methods: ['nope']},
    methods: {
      nope: (data, callback) => callback(new Error('Error from value ' + data))
    }
  },
  {
    manifest: {path: 'super.nested', methods: ['yeah', 'thrower']},
    methods: {
      yeah: (a1, a2, a3, callback) => callback(null, a1 + a2 + a3),
      thrower: () => {
        throw new Error('Oh no!')
      }
    }
  }
]

var app = express()
var handler = Server(services)
app.use(handler)

var server = http.createServer(app)

test('basics', function (t) {
  t.plan(13)

  freeport(3000, function (error, port) {
    t.ifError(error)
    server.listen(port, function (error) {
      t.ifError(error)

      var api = Client(services.map((s) => s.manifest), {
        baseUrl: 'http://localhost:' + port
      })

      api.first.addOne(3, function (error, data) {
        t.ifError(error)
        t.equal(data, 4)
      })
      api.first.nope(4, function (error, data) {
        t.ok(error)
        t.notOk(data)
        t.equal(error.message, 'Error from value 4')
        t.equal(error.statusCode, 400)
      })
      api.super.nested.yeah('a', 'b', 'c', function (error, data) {
        t.ifError(error)
        t.equal(data, 'abc')
      })
      api.super.nested.thrower(function (error, data) {
        t.notOk(data)
        t.equal(error.message, 'Oh no!')
        t.equal(error.statusCode, 400)
      })
    })
  })
})

test('teardown', function (t) {
  server.close()
  t.end()
})
