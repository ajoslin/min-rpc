# min-rpc [![Build Status](https://travis-ci.org/ajoslin/min-rpc.svg?branch=master)](https://travis-ci.org/ajoslin/min-rpc)

> Minimal rpc server and client using http. <3kb in the browser.

Inspired by [vas](https://github.com/ahdinosaur/vas), but with as few features as possible.

## Install

```
$ npm install --save min-rpc
```

## Usage

**person/service.js**
```js
module.exports = {
  path: 'person',
  methods: {
    shout: function (phrase, callback) {
      callback(null, phrase.toUpperCase() + '!')
    },
    shoutUser: function (phrase, callback) {
      callback(null, this.user.name + ': ' + phrase.toUpperCase() + '!')
    }
  }
}
```

**server.js**
```js
var rpcServer = require('min-rpc/server')
var services = [
  require('./person/service')
]

var handler = rpcServer(services, {
  getContext: function (req, res, callback) {
    // ... Get the user from cookies or headers here.
    callback(null, {
      user: {name: 'Bob'}
    })
  }
})

var app = require('express')()
app.use('/api', handler)

app.listen(3000)
```

**browser.js**
```js
var rpcClient = require('min-rpc/client')

var api = rpcClient({
  baseUrl: 'http://localhost:3000/api'
})

api('person/shout', 'hey', function (error, data) {
  console.log(error) // => null
  console.log(data) // => 'HEY!'
})

api('person/shoutUser', 'hey', function (error, data) {
  console.log(error) // => null
  console.log(data) // => 'Bob: HEY!'
})
```

## Roadmap

- [EventSource addon](https://github.com/ajoslin/min-rpc/issues/2)
- Better tests

## API

### `require('min-rpc/server')(services, options)` -> `requestHandler`

Returns an http request handler that you can mount in your app. Accepts requests from the api client.

##### services

Each item in the `services` array must have a string key `path` and an object `methods`. Example:

```js
{
  path: 'my/service',
  methods: {
    method1: function (data, callback) { callback(null, 'result') },
    method2: function (data, callback) { callback(new Error('Nope!')) }
  }
}
```

##### options

###### getContext(req, res, callback)

Pass the `context` that will be passed as the first argument into all service methods.

Call `callback` with `(error, context)`

This is most often used to set the current user. Example:

```js
var rpcServer = RpcServer(services, {
  getContext: function (req, res, callback) {
    db.getUser(req.session.userId, function (error, user) {
      if (error) return callback(error)

      // Now `this` of service methods is equal to `{user: user}`
      callback(null, {user: user})
    })
  }
})

### `require('min-rpc/client')(options)` -> `apiClient`

Returns an `apiClient` function, which can talk to the server given at `baseUrl`.

The apiClient also exposes a `apiClient.request` function, which takes parameters (url, options, callback). Options are passed to [xhr](https://github.com/raynos/xhr). This function is used internally to perform all rpc calls.

##### options

###### baseUrl

Type: `string`
Default: `/`

The url at which your min-rpc server is hosted.

###### transformRequest

Type: `function`

Use this to transform any requests made to the api. Receives options passed to [xhr](https://github.com/raynos/xhr). Change the options and return new options.

You can use this to handle authentication. For example:

```js
var myAuthToken = 'abc123qwert'
var api = rpcClient(services, {
  transformRequest: function (options) {
    options.headers.Authorization = 'Bearer ' + myAuthToken
    return options
  }
})
```


## License

MIT © [Andrew Joslin](http://ajoslin.com)
