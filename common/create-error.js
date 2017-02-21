var assign = require('xtend/mutable')

module.exports = function createError (data, status) {
  if (Array.isArray(data)) return createError(data[0], status)

  var message = typeof data === 'string' ? data
    : (data && data.message) ? data.message
    : 'Bad Request'

  var error = assign(
    {
      message: message,
      statusCode: status || 400
    },
    typeof data === 'object' ? data : {}
  )

  return error
}
