'use strict'

var xhr = require('xhr')
var assign = require('xtend/mutable')
var createError = require('./common/create-error')

function noop () {}
function identity (n) { return n }

module.exports = function createClient (options) {
  options = options || {}

  var baseUrl = options.baseUrl || '/'
  var transformRequest = options.transformRequest || identity

  if (baseUrl.charAt(baseUrl.length - 1) !== '/') baseUrl += '/'

  api.request = request

  return api

  function api () {
    var args = Array.prototype.slice.call(arguments)
    var path = args.shift()
    var callback = typeof args[args.length - 1] === 'function'
      ? args.pop()
      : noop

    if (path.charAt(0) === '/') path = path.substring(1)

    if (typeof path !== 'string') throw new Error('rpcClient: api must be called with string path as first argument.')

    return request(path, {
      body: {
        arguments: args
      }
    }, callback)
  }

  function request (path, options, callback) {
    options = options || {}
    options = assign({
      method: 'POST',
      json: true
    }, options)
    options.headers = assign({
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }, options.headers)

    options = transformRequest(options)

    xhr(baseUrl + path, options, function handleResponse (error, resp, body) {
      var success = !error && String(resp.statusCode).charAt(0) === '2'

      if (success) {
        callback(null, body)
      } else {
        error = assign(new Error(), createError(error || body, resp.statusCode))
        callback(error)
      }
    })
  }
}
