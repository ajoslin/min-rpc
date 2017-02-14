module.exports = function validateManifest (manifest, index) {
  if (!manifest) {
    throw new Error('manifests[' + index + ']: Object manifest.manifest required')
  }
  if (typeof manifest.path !== 'string') {
    throw new Error('manifests[' + index + ']: String manifest.path required')
  }
  if (!Array.isArray(manifest.methods)) {
    throw new Error('manifests[' + index + ']: Array manifest.manifest required')
  }
  if (manifest.path.indexOf('request') === 0) {
    throw new Error('manifests[' + index + ']: paths starting with "request" are forbidden.')
  }
}
