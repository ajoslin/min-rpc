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
    path: 'first',
    methods: {
      addOne: (data, callback) => callback(null, data + 1),
      callbackError: (data, callback) => callback({
        message: 'Error from value ' + data,
        moreInfo: 'foo'
      })
    }
  },
  {
    path: 'super/nested',
    methods: {
      yeah: (a1, a2, a3, callback) => callback(null, a1 + a2 + a3),
      throwError: () => {
        throw new Error('Oh no!')
      }
    }
  },
  {
    path: 'with/context',
    methods: {
      act: function (callback) {
        callback(null, this)
      }
    }
  }
]

var app = express()
var handler = Server(services, {
  getContext: (req, res, callback) => {
    if (req.body.arguments && req.body.arguments[0] === 'contextError') {
      return callback(new Error('context error!'))
    }
    callback(null, {reqPath: req.path})
  }
})

var server = http.createServer(app)

app.use('/api', handler)

freeport(3000, function (_, port) {
  var api = Client({
    baseUrl: 'http://localhost:' + port + '/api'
  })

  test('setup', function (t) {
    server.listen(port, function (error) {
      t.ifError(error)
      t.end()
    })
  })

  test('client validation', function (t) {
    t.throws(() => api(1))
    t.throws(() => api())
    t.throws(() => api({}))
    t.end()
  })

  test('server validation', function (t) {
    t.plan(6)

    api('something/not/valid', function (error) {
      t.ok(error instanceof Error)
      t.pass(error)
      t.equal(error.statusCode, 404)
    })

    api('first/notFound', function (error) {
      t.ok(error instanceof Error)
      t.pass(error)
      t.equal(error.statusCode, 404)
    })
  })

  test('methods success', function (t) {
    t.plan(4)

    api('first/addOne', 3, function (error, data) {
      t.ifError(error)
      t.equal(data, 4)
    })
    api('super/nested/yeah', 'a', 'b', 'c', function (error, data) {
      t.ifError(error)
      t.equal(data, 'abc')
    })
  })

  test('method context', function (t) {
    t.plan(4)

    api('with/context/act', function (error, data) {
      t.ifError(error)
      t.deepEqual(data, {reqPath: '/with/context/act'})
    })

    api('with/context/act', 'contextError', function (error, data) {
      t.ok(error)
      t.equal(error.message, 'context error!')
    })
  })

  test('methods error', function (t) {
    t.plan(9)

    api('first/callbackError', 4, function (error, data) {
      t.ok(error instanceof Error)
      t.notOk(data)
      t.equal(error.message, 'Error from value 4')
      t.equal(error.statusCode, 400)
      t.equal(error.moreInfo, 'foo')
    })

    api('super/nested/throwError', function (error, data) {
      t.ok(error instanceof Error)
      t.notOk(data)
      t.equal(error.message, 'Oh no!')
      t.equal(error.statusCode, 400)
    })
  })

  test('teardown', function (t) {
    server.close()
    t.end()
  })
})
