
module.exports = function callMethod (body, context, fn, callback) {
  var args = body && body.arguments || []
  var called = false

  function done (error, data) {
    if (called) return

    called = true
    callback(error, data)
  }

  try {
    fn.apply(context, [].concat(args, done))
  } catch (error) {
    done(error)
  }
}
