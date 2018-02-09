# memory-cache

[![NPM](https://nodei.co/npm/@mediaxpost/memory-cache.png?downloads=true)](https://nodei.co/npm/@mediaxpost/memory-cache/)

[![Actual version published on npm](http://img.shields.io/npm/v/@mediaxpost/memory-cache.svg)](https://www.npmjs.org/package/@mediaxpost/memory-cache)
[![Travis build status](https://travis-ci.org/MediaXPost/memory-cache.svg)](https://www.npmjs.org/package/@mediaxpost/memory-cache)
[![Total npm module downloads](http://img.shields.io/npm/dt/@mediaxpost/memory-cache.svg)](https://www.npmjs.org/package/@mediaxpost/memory-cache)
[![Dependencies badge](https://david-dm.org/MediaXPost/memory-cache/status.svg)](https://david-dm.org/MediaXPost/memory-cache?view=list)


`memory-cache` is a simple, Redis-like, in-memory cache written in pure Javascript.  The API is designed to mirror the node [`redis` module](https://www.npmjs.com/package/redis) and can be used with nearly all redis commands supported by Redis.

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

client.connect();
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

## MemoryCache.connect()
Connect to the memory cache and emits the `connect` and `ready` events.

## MemoryCache.quit()
Disconnects from the memory cache and emits the `end` event.

## Redis Commands
MemoryCache support all but a select few [Redis Commands](https://redis.io/commands) and returns then data as close to identically as possible to the [`redis` module](https://www.npmjs.com/package/redis). Any errors are thrown as exceptions which should be caught.  The commands which are unavailable are as follows:

 * CLUSTER
 * READONLY
 * READWRITE
 * MIGRATE
 * MOVE
 * OBJECT
 * SORT
 * WAIT
 * BLPOP
 * BRPOP
 * BRPOPLPUSH
 * EVAL
 * EVALSHA
 * SCRIPT *
 * BGREWRITEAOF
 * CLIENT *
 * COMMAND *
 * CONFIG *
 * DEBUG *
 * MONITOR
 * SHUTDOWN
 * SLAVEOF
 * SLOWLOG
 * SYNC
 * GEOADD
 * GEODIST
 * GEOHASH
 * GEOPOS
 * GEORADIUS
 * GEORADIUSBYMEMBER
 * PFADD
 * PFCOUNT
 * PFMERGE
 * BITFIELD
 * BITPOS
 * ZINTERSTORE
 * ZUNIONSTORE
 * UNWATCH
 * WATCH
 * SCAN
 * HSCAN
 * LSCAN
 * SSCAN
 * ZSCAN

If an unavailable command is issued, then the module throws a "MemoryCache does not support that operation" exception, unless the option `bypassUnsupported` is set to `true` in the constructor.

# [License](#license)
<a name="license"></a>

Copyright (c) 2018 Jay Reardon -- Licensed under the MIT license.
