module.exports = function getMethodUrl (path, methodName) {
  return '/' + path.split('.').concat(methodName).join('/')
}
