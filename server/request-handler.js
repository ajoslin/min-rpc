var express = require('express')
var bodyParser = require('body-parser')
var join = require('url-join')
var callMethod = require('./call-method')
var createError = require('../common/create-error')

module.exports = function RequestHandler (servicesByPath, options) {
  var app = express()

  app.use(bodyParser.json())

  Object.keys(servicesByPath).forEach(function (path) {
    var service = servicesByPath[path]

    Object.keys(service.methods).forEach(function (methodName) {
      app.post(
        join(path, methodName),
        createHandler(service, methodName, options)
      )
    })
  })

  return app
}

function createHandler (service, methodName, options) {
  var getContext = options.getContext || defaultGetContext

  return function handler (req, res) {
    getContext(req, res, function handleContext (error, context) {
      if (error) return onError(error)

      callMethod(req.body, context, service.methods[methodName], function (error, data) {
        if (error) return onError(error)
        res.json(data)
      })
    })

    function onError (error) {
      error = createError(error)
      return res.status(error.statusCode).json(error)
    }
  }
}

function defaultGetContext (req, res, callback) {
  callback(null, {})
}
