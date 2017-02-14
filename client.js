'use strict'

var xhr = require('xhr')
var extend = require('xtend')
var join = require('url-join')
var createError = require('./common/create-error')
var getMethodUrl = require('./common/get-method-url')
var validateManifest = require('./common/validate-manifest')

function noop () {}
function identity (n) { return n }

module.exports = function createClient (manifests, options) {
  options = options || {}
  if (!Array.isArray(manifests)) throw new Error('Array manifests required')

  var baseUrl = options.baseUrl || '/'
  var transformRequest = options.transformRequest || identity
  var api = {}

  manifests.forEach(function (manifest, index) {
    validateManifest(manifest, index)

    var methods = api
    manifest.path.split('.').forEach(function (key) {
      methods = methods[key] || (methods[key] = {})
    })

    manifest.methods.forEach(function (methodName) {
      if (methods[methodName]) {
        throw new Error('A method already exists at path ' + manifest.path.split('.').concat(methodName).join('.') + '!')
      }
      methods[methodName] = createMethod(manifest, methodName)
    })
  })

  return extend(api, {
    request: request
  })

  function createMethod (manifest, methodName) {
    function wrapped () {
      var args = Array.prototype.slice.call(arguments)
      var callback = typeof args[args.length - 1] === 'function'
          ? args.pop()
          : noop

      request(getMethodUrl(manifest.path, methodName), {
        body: {
          arguments: args
        }
      }, callback)
    }

    wrapped.displayName = methodName

    return wrapped
  }

  function request (path, options, callback) {
    options = options || {}
    options = extend({
      method: 'POST',
      json: true
    }, options)
    options.headers = extend({
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }, options.headers)

    options = transformRequest(options)

    xhr(join(baseUrl, path), options, function handleResponse (error, resp, body) {
      var success = !error && String(resp.statusCode).charAt(0) === '2'

      if (success) {
        callback(null, body)
      } else {
        callback(createError(error || body, resp.statusCode))
      }
    })
  }
}
