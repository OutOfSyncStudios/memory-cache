# memory-cache

[![NPM](https://nodei.co/npm/@mediaxpost/memory-cache.png?downloads=true)](https://nodei.co/npm/@mediaxpost/memory-cache/)

[![Actual version published on npm](http://img.shields.io/npm/v/@mediaxpost/memory-cache.svg)](https://www.npmjs.org/package/@mediaxpost/memory-cache)
[![Travis build status](https://travis-ci.org/MediaXPost/memory-cache.svg)](https://www.npmjs.org/package/@mediaxpost/memory-cache)
[![Total npm module downloads](http://img.shields.io/npm/dt/@mediaxpost/memory-cache.svg)](https://www.npmjs.org/package/@mediaxpost/memory-cache)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/13d3b0cb546f42dd93fb9b831a3b175c)](https://www.codacy.com/app/chronosis/memory-cache?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=MediaXPost/memory-cache&amp;utm_campaign=Badge_Grade)
[![Codacy Coverage Badge](https://api.codacy.com/project/badge/Coverage/13d3b0cb546f42dd93fb9b831a3b175c)](https://www.codacy.com/app/chronosis/memory-cache?utm_source=github.com&utm_medium=referral&utm_content=MediaXPost/memory-cache&utm_campaign=Badge_Coverage)
[![Dependencies badge](https://david-dm.org/MediaXPost/memory-cache/status.svg)](https://david-dm.org/MediaXPost/memory-cache?view=list)

`memory-cache` is a simple, Redis-like, in-memory cache written in pure Javascript.  

Memory Cache is designed to be a fully-functional stand-in replacement for mocking Redis and fail-over in production systems for when Redis is not available. This package is intentionally designed to mimic the behavior of the node [`redis` module](https://www.npmjs.com/package/redis) and can be used with [nearly all commands supported by Redis](#commands)<sup>†</sup>.

Unlike some other Redis mocking library, thought has been put into achieving full Redis command coverage. Many other libraries only provide incomplete coverage by providing only the most commonly used commands. MemoryCache currently provides 224 of 267 (~85%) of the available Redis commands. With coverage for the remaining commands planned. All commands have been rigorously tested with over 500 unit test.

† [See below](#commands)

# [Installation](#installation)
<a name="installation"></a>

```shell
npm install @mediaxpost/memory-cache
```

# [Usage](#usage)
<a name="usage"></a>

```js
const MemoryCache = require('@mediaxpost/memory-cache');
const client = new MemoryCache({ bypassUnsupported: true });

client.createClient();
client.set("TestKey", 10);
client.get("TestKey");
```

# [API Reference](#api)
<a name="api"></a>

## constructor(options)
Create a new MemoryCache client with the passed options. MemoryCache only supports one option `bypassUnsupported` which if set `true` causes any unsupported commands to fail silently instead of throwing an error.

```js
const MemoryCache = require('@mediaxpost/memory-cache');
const client = new MemoryCache({ bypassUnsupported: true });
```

## MemoryCache.createClient()
Connect to the memory cache and emits the `connect` and `ready` events.

## MemoryCache.quit()
Disconnects from the memory cache and emits the `end` event.

## MemoryCache.end()
Disconnects from the memory cache and emits the `end` event. Unlike the Redis client this is identical to calling quit.

# Command simplification
Where possible, this module mimics the return data behavior of the Redis module.  For example, the `.hmset` will accept a single object hash to set multiple fields. Similar `.hmget` will return an object hash.

# Multiple parameters
Many Redis commands like `set`, `mget`, etc. accept multiple parameters. The memory cache library support passing all additional parameters.

**For example:**
```js
  client.mget('key1', 'key2', 'key3', 'key4');
```

Additionally, if a command is multiple words, then the additional portion of the command may be passed as the first parameter.

**For example:**
```js
  client.flushall('async');
```

# Using Promises
Every Redis command can be called with `*Async` at the end. This will invoke the Promisified variant of the command and return a Promise.

**For Example:**
```js
  client.getAsync('testkey')
  .then((res) => {
    // Do something useful
  })
  .catch((err) => {
    // Do something useful
  });
```

# Redis Commands
<a name="commands"></a>

MemoryCache support all but a select few [Redis Commands](https://redis.io/commands) and returns then data as close to identically as possible to the [`redis` module](https://www.npmjs.com/package/redis). Any errors are thrown as exceptions which should be caught.  The commands which are unavailable are as follows:

* BGREWRITEAOF
* BITFIELD
* BITPOS
* BLPOP
* BRPOP
* BRPOPLPUSH
* CLIENT *
* CLUSTER
* COMMAND *
* CONFIG *
* DEBUG *
* EVAL
* EVALSHA
* GEORADIUS
* GEORADIUSBYMEMBER
* HSCAN
* MIGRATE
* MONITOR
* OBJECT
* PFADD
* PFCOUNT
* PFMERGE
* PSUBSCRIBE
* PUBLISH
* PUBSUB
* PUNSUBSCRIBE
* READONLY
* READWRITE
* SCAN
* SCRIPT *
* SHUTDOWN
* SLAVEOF
* SLOWLOG
* SORT
* SSCAN
* SUBSCRIBE
* SYNC
* UNSUBSCRIBE
* UNWATCH
* WAIT
* WATCH
* ZINTERSTORE
* ZSCAN
* ZUNIONSTORE

If an unavailable command is issued, then the module throws a MemoryCacheError -- "MemoryCache does not support that operation". This thrown error can be bypassed by passing the option `bypassUnsupported` as true in the constructor.  Or by directly setting your MemoryCache instance `instance.options.bypassUnsupported = true`

# [License](#license)
<a name="license"></a>

Copyright (c) 2018 Jay Reardon -- Licensed under the MIT license.
