'use strict'

var express = require('express')
var once = require('one-time')
var bodyParser = require('body-parser')
var createError = require('./common/create-error')
var getMethodUrl = require('./common/get-method-url')
var validateManifest = require('./common/validate-manifest')

module.exports = function createRouter (services) {
  if (!Array.isArray(services)) throw new Error('Array services required')
  var router = express.Router()

  router.use(bodyParser.json())

  services.forEach(function (service, index) {
    validateManifest(service.manifest, index)
    if (typeof service.methods !== 'object') {
      throw new Error('services[' + index + ']: Object service.methods required')
    }

    service.manifest.methods.forEach(function (methodName) {
      if (!service.methods[methodName]) {
        throw new Error('services[' + index + ']: No matching method in service for manifest method ' + methodName)
      }

      router.post(
        getMethodUrl(service.manifest.path, methodName),
        createHandler(service.methods[methodName])
      )
    })
  })

  return router
}

function createHandler (fn) {
  return function handler (req, res) {
    var args = req.body && req.body.arguments || []

    const callback = once(function handleResponse (error, data) {
      if (error) {
        error = createError(error)
        return res.status(error.statusCode).json({
          message: error.message,
          statusCode: error.statusCode
        })
      }
      res.status(200).json(data)
    })

    try {
      fn.apply(null, args.concat(callback))
    } catch (error) {
      callback(error)
    }
  }
}
