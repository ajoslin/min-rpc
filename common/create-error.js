module.exports = function createError (data, status) {
  var message = typeof data === 'string' ? data
    : (data && data.message) ? data.message
    : 'Bad Request'

  var error = new Error(message)
  error.statusCode = status || 400

  return error
}
