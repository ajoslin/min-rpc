var assert = require('assert')
var RequestHandler = require('./request-handler')

module.exports = function createRouter (services, options) {
  if (!Array.isArray(services)) throw new Error('Array services required')

  options = options || {}

  var servicesByPath = services.reduce(function (acc, service, index) {
    assert.equal(typeof service.methods, 'object', 'Object service.methods required.')

    var path = service.path.charAt(0) !== '/' ? ('/' + service.path) : service.path
    assert.ok(!acc[path], 'service with path ' + path + ' already declared.')

    Object.keys(service.methods).forEach(function (methodName) {
      assert.equal(typeof service.methods[methodName], 'function', 'service.methods[' + methodName + '] must be a function.')
    })

    acc[path] = service
    return acc
  }, {})

  return RequestHandler(servicesByPath, options)
}
