# min-rpc [![Build Status](https://travis-ci.org/ajoslin/min-rpc.svg?branch=master)](https://travis-ci.org/ajoslin/min-rpc)

> Minimal rpc server and client using http. <3kb in the browser.

Inspired by [vas](https://github.com/ahdinosaur/vas), but with as few features as possible.

## Install

```
$ npm install --save min-rpc
```

## Usage

**person/manifest.json**
```js
{
  "path": ['person'],
  "methods": ['shout']
}
```

**person/service.js**
```js
var manifest = require('./manifest.json')

module.exports = {
  manifest: manifest,
  methods: {
    shout: function (phrase, callback) {
      callback(null, phrase.toUpperCase() + '!')
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

var handler = rpcServer(services)

var app = require('express')()
app.use('/api', handler)

app.listen(3000)
```

**browser.js**
```jsos
var rpcClient = require('min-rpc/client')
var services = [
  require('./person/manifest.json')
]

var api = rpcClient(services, {
  baseUrl: 'http://localhost:3000/api'
})

api.person.shout('hey', function (error, data) {
  console.log(error) // => null
  console.log(data) // => 'HEY!'
})
```

## Roadmap

- Coming soon: [Permissions](https://github.com/ajoslin/min-rpc/issues/1)

## API

#### `require('min-rpc/server')(services)` -> `requestHandler`

Returns an express router that you can mount in your app. Accepts requests from the api client.

##### services

Each item in the `services` array must be of the following format:

```
service {
  manifest: Object{
    path: string,
    methods: Array<string>
  },
  methods: Object{methodName: function}
}
```

Example:

```js
{
  manifest: {
    path: 'string',
    methods: ['method1', 'method2']
  },
  methods: {
    method1: (data, callback) => callback(null, 'result'),
    method2: (data, callback) => callback(new Error('Nope!'))
  }
}
```

#### `require('min-rpc/client')(manifests, options)` -> `apiClient`

Returns an `apiClient`, which is an object built off of the structure of all passed in manifests, using `path` to build the object. Example:

```js
const apiClient = rpcClient([
  {path: ['house', 'plumbing'], methods: ['turnOff', 'turnOn']},
  {path: ['house', 'gas'], methods: ['change']},
  {path: ['somethingElse'], methods: ['act']}
], myOptions)

apiClient.house.plumbing.turnOff // => function
apiClient.house.plumbing.turnOn // => function
apiClient.house.gas.change // => function
apiClient.somethingElse.act // => function
```

The apiClient also exposes a `apiClient.request` function, which takes parameters (url, options, callback). Options are passed to [xhr](https://github.com/raynos/xhr). This function is used internally to perform all rpc calls.

##### manifests

An array of `{path, methods}` objects, which are used to build an rpcClient.

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
