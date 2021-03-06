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

  if (baseUrl.charAt(baseUrl.length - 1) !== '/') {
    baseUrl += '/'
  }

  rpcClient.request = request

  return rpcClient

  function rpcClient () {
    var args = Array.prototype.slice.call(arguments)
    var path = args.shift()
    var callback = typeof args[args.length - 1] === 'function'
      ? args.pop()
      : noop

    if (typeof path !== 'string' || !path.length) {
      throw new Error('First argument must be a string path!')
    }

    if (path.charAt(0) === '/') {
      path = path.substring(1)
    }

    request(path, {
      body: {arguments: args}
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
    xhr(baseUrl + path, options, handleResponse)

    function handleResponse (error, resp, body) {
      var success = !error && String(resp.statusCode).charAt(0) === '2'

      if (success) {
        callback(null, body)
      } else {
        callback(assign(
          new Error(),
          createError(error || body, resp.statusCode)
        ))
      }
    }
  }
}
