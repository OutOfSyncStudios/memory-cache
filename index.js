/* eslint-disable complexity */
// memory-cache.js

const __ = {
  difference: require('lodash.difference'),
  flatten: require('lodash.flatten'),
  fromPairs: require('lodash.frompairs'),
  intersection: require('lodash.intersection'),
  isNil: require('lodash.isnil'),
  isUndefined: require('lodash.isundefined'),
  keys: require('lodash.keys'),
  merge: require('lodash.merge'),
  mergeWith: require('lodash.mergewith'),
  padStart: require('lodash.padstart'),
  padEnd: require('lodash.padend'),
  pick: require('lodash.pick'),
  reverse: require('lodash.reverse'),
  sample: require('lodash.sample'),
  sampleSize: require('lodash.samplesize'),
  size: require('lodash.size'),
  sortBy: require('lodash.sortby'),
  toPairs: require('lodash.topairs'),
  union: require('lodash.union'),
};

const bluebird = require('bluebird');
const geohash = require('ngeohash');
const geolib = require('geolib');
const Event = require('events');
const pkg = require('./package.json');

const messages = {
  ok: 'OK',
  queued: 'QUEUED',
  pong: 'PONG',
  noint: 'ERR value is not an integer or out of range',
  nofloat: 'ERR value is not an float or out of range',
  nokey: 'ERR no such key',
  nomultiinmulti: 'ERR MULTI calls can not be nested',
  nomultiexec: 'ERR EXEC without MULTI',
  nomultidiscard: 'ERR DISCARD without MULTI',
  busykey: 'ERR target key name is busy',
  syntax: 'ERR syntax error',
  unsupported: 'MemoryCache does not support that operation',
  wrongTypeOp: 'WRONGTYPE Operation against a key holding the wrong kind of value',
  wrongPayload: 'DUMP payload version or checksum are wrong',
  wrongArgCount: 'ERR wrong number of arguments for \'%0\' command',
  bitopnotWrongCount: 'ERR BITOP NOT must be called with a single source key',
  indexOutOfRange: 'ERR index out of range',
  invalidLexRange: 'ERR min or max not valid string range item',
  invalidDBIndex: 'ERR invalid DB index',
  invalidDBIndexNX: 'ERR invalid DB index, \'%0\' does not exist',
  mutuallyExclusiveNXXX: 'ERR XX and NX options at the same time are not compatible'
};

class MemoryCacheError extends Error {
  constructor(error) {
    super(error);
  }
}

class MemoryCache extends Event {
  constructor(options) {
    super();
    this.databases = {};
    this.databases[0] = Object.create({});
    this.cache = this.databases[0];
    this.currentDBIndex = 0;
    this.connected = false;
    this.options = __.merge(Object.assign({ debug: false, bypassUnsupported: false }), options || {});
    this.lastSave = Date.now();
    this.multiMode = false;
  }

  // ---------------------------------------
  // Connection
  // ---------------------------------------
  createClient() {
    this.connected = true;
    // exit multi mode if we are in it
    this.discard(null, true);
    this.emit('connect');
    this.emit('ready');
    return this;
  }

  quit() {
    this.connected = false;
    // exit multi mode if we are in it
    this.discard(null, true);
    this.emit('end');
    return this;
  }

  end() {
    return this.quit();
  }

  auth(password, callback) {
    return this._handleCallback(callback, messages.ok);
  }

  echo(message, callback) {
    return this._handleCallback(callback, message);
  }

  ping(message, callback) {
    message = message || messages.pong;
    return this._handleCallback(callback, message);
  }

  swapdb(dbIndex1, dbIndex2, callback) {
    const index1 = parseInt(dbIndex1);
    const index2 = parseInt(dbIndex2);
    if (isNaN(index1) || isNaN(index2)) {
      return this._handleCallback(callback, null, messages.invalidDBIndex);
    }
    if (!this.databases.hasOwnProperty(index1)) {
      return this._handleCallback(callback, null, messages.invalidDBIndexNX.replace('%0', index1));
    } else if (!this.databases.hasOwnProperty(index2)) {
      return this._handleCallback(callback, null, messages.invalidDBIndexNX.replace('%0', index2));
    }

    // exit multi mode if we are in it
    this.discard(null, true);

    // Swap databases
    const temp = this.databases[index1];
    this.databases[index1] = this.databases[index2];
    this.databases[index2] = temp;

    return this._handleCallback(callback, messages.ok);
  }

  select(dbIndex, callback) {
    const index = parseInt(dbIndex);
    if (isNaN(index)) {
      return this._handleCallback(callback, null, messages.invalidDBIndex);
    }
    if (!this.databases.hasOwnProperty(index)) {
      this.databases[index] = Object.create({});
    }
    this.multiMode = false;
    this.currentDBIndex = index;
    this.cache = this.databases[index];

    return this._handleCallback(callback, messages.ok);
  }

  // ---------------------------------------
  // ## Cluster ##
  // ---------------------------------------
  cluster(...params) {
    this._unsupported();
  }

  readonly() {
    this._unsupported();
  }

  readwrite() {
    this._unsupported();
  }

  // ---------------------------------------
  // ## Geo ##
  // ---------------------------------------
  geoadd(key, ...params) {
    let retVal = null;
    const callback = this._retrieveCallback(params);
    if (params.length < 3) {
      return this._handleCallback(callback, null, messages.wrongArgCount.replace('%0', 'geoadd'));
    }
    if (params.length % 3 !== 0) {
      return this._handleCallback(callback, null, messages.wrongArgCount.replace('%0', 'geoadd'));
    }

    let long, lat, name;
    const data = [];
    while (params.length > 0) {
      long = parseFloat(params.shift());
      lat = parseFloat(params.shift());
      if (isNaN(long) || isNaN(lat)) {
        return this._handleCallback(callback, null, messages.nofloat);
      }
      const hashint = geohash.encode_int(lat, long);
      data.push(hashint);
      name = params.shift();
      data.push(name);
    }

    try {
      retVal = this.zadd(key, data);
    } catch (err) {
      return this._handleCallback(callback, null, err);
    }

    return this._handleCallback(callback, retVal);
  }

  geodist(key, member1, member2, ...params) {
    let retVal = null;
    const callback = this._retrieveCallback(params);
    let conversion = 'm';

    if (params.length > 1) {
      return this._handleCallback(callback, null, messages.wrongArgCount.replace('%0', 'geodist'));
    }
    if (params.length > 0) {
      conversion = params[0];
      switch (conversion) {
        case 'km':
        case 'm':
        case 'mi':
        case 'ft':
          break;
        default:
          return this._handleCallback(callback, null, messages.syntax);
      }
    }

    let val1 = this.zscore(key, member1);
    let val2 = this.zscore(key, member2);

    if (!__.isNil(val1) && !__.isNil(val2)) {
      val1 = parseInt(val1);
      val2 = parseInt(val2);
      if (isNaN(val1) || isNaN(val2)) {
        return this._handleCallback(callback, null, messages.noint);
      }

      const point1 = geohash.decode_int(val1);
      const point2 = geohash.decode_int(val2);
      const dist = geolib.getDistance(
        {
          latitude: point1.latitude,
          longitude: point1.longitude
        },
        {
          latitude: point2.latitude,
          longitude: point2.longitude
        }
      );

      retVal = this._convertDistance(dist, conversion);
    }

    return this._handleCallback(callback, retVal);
  }

  geohash(key, ...members) {
    const retVal = [];
    const callback = this._retrieveCallback(members);
    if (members.length < 1) {
      return this._handleCallback(callback, null, messages.wrongArgCount.replace('%0', 'geohash'));
    }

    let val, point;
    while (members.length > 0) {
      const member = members.shift();
      try {
        val = this.zscore(key, member);
        if (!__.isNil(val)) {
          point = geohash.decode_int(val);
          retVal.push(geohash.encode(point.latitude, point.longitude));
        } else {
          retVal.push(null);
        }
      } catch (err) {
        return this._handleCallback(callback, null, err);
      }
    }

    return this._handleCallback(callback, retVal);
  }

  geopos(key, ...members) {
    const retVal = [];
    const callback = this._retrieveCallback(members);
    if (members.length < 1) {
      return this._handleCallback(callback, null, messages.wrongArgCount.replace('%0', 'geopos'));
    }

    let val, point;
    while (members.length > 0) {
      const member = members.shift();
      try {
        val = this.zscore(key, member);
        if (!__.isNil(val)) {
          point = geohash.decode_int(val);
          retVal.push([point.longitude, point.latitude]);
        } else {
          retVal.push(null);
        }
      } catch (err) {
        return this._handleCallback(callback, null, err);
      }
    }

    return this._handleCallback(callback, retVal);
  }

  georadius(...params) {
    this._unsupported();
  }

  georadiusbymember(...params) {
    this._unsupported();
  }

  // ---------------------------------------
  // ## Hash ##
  // ---------------------------------------
  hdel(key, ...fields) {
    let retVal = 0;
    const callback = this._retrieveCallback(fields);
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true, callback);
      for (let itr = 0; itr < fields.length; itr++) {
        const field = fields[itr];
        if (this._hasField(key, field)) {
          delete this.cache[key].value[field];
          retVal++;
        }
      }
    }
    return this._handleCallback(callback, retVal);
  }

  hexists(key, field, callback) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true, callback);
      if (this._hasField(key, field)) {
        retVal = 1;
      }
    }
    return this._handleCallback(callback, retVal);
  }

  hget(key, field, callback) {
    let retVal = null;
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true, callback);
      if (this._hasField(key, field)) {
        retVal = this._getKey(key)[field];
      }
    }
    return this._handleCallback(callback, retVal);
  }

  hgetall(key, callback) {
    let retVals = {};
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true, callback);
      retVals = this._getKey(key);
    }
    return this._handleCallback(callback, retVals);
  }

  hincrby(key, field, value, callback) {
    let retVal;
    try {
      retVal = this._addToField(key, field, value, false);
    } catch (err) {
      return this._handleCallback(callback, null, err);
    }
    return this._handleCallback(callback, retVal);
  }

  hincrbyfloat(key, field, value, callback) {
    let retVal;
    try {
      retVal = this._addToField(key, field, value, true);
    } catch (err) {
      return this._handleCallback(callback, null, err);
    }
    return this._handleCallback(callback, retVal);
  }

  hkeys(key, callback) {
    let retVals = [];
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true, callback);
      retVals = Object.keys(this._getKey(key));
    }

    return this._handleCallback(callback, retVals);
  }

  hlen(key, callback) {
    const retVal = this.hkeys(key).length;
    return this._handleCallback(callback, retVal);
  }

  hmget(key, ...fields) {
    const retVals = [];
    fields = __.flatten(fields);
    const callback = this._retrieveCallback(fields);

    if (this._hasKey(key)) {
      this._testType(key, 'hash', true, callback);
    }
    for (let itr = 0; itr < fields.length; itr++) {
      const field = fields[itr];
      let val = null;
      if (this._hasKey(key)) {
        if (this._hasField(key, field)) {
          val = this._getField(key, field);
        }
      }
      retVals.push(val);
    }
    return this._handleCallback(callback, retVals);
  }

  hmset(key, ...params) {
    let objData = [];
    const callback = this._retrieveCallback(params);
    if (params.length < 1) {
      return this._handleCallback(callback, null, messages.wrongArgCount.replace('%0', 'hmset'));
    }

    if (typeof params[0] === 'object') {
      objData = __.flatten(__.toPairs(params.shift()));
      if (params.length > 0) {
        return this._handleCallback(callback, null, messages.wrongArgCount.replace('%0', 'hmset'));
      }
      params = objData;
    }
    const parity = params.length % 2;
    // params should have key and field/value pairs and should be even in length
    if (parity === 1) {
      return this._handleCallback(callback, null, messages.wrongArgCount.replace('%0', 'hmset'));
    }

    if (this._hasKey(key)) {
      this._testType(key, 'hash', true, callback);
    } else {
      this.cache[key] = this._makeKey({}, 'hash');
    }

    const pairs = params.length / 2;
    for (let itr = 0; itr < pairs; itr++) {
      const field = params[itr * 2];
      const value = params[itr * 2 + 1];
      this._setField(key, field, value);
    }

    return this._handleCallback(callback, messages.ok);
  }

  hscan(key, cursor, pattern, count, callback) {
    // if (this._hasKey(key)) {
    //   this._testType(key, 'hash', true, callback);
    //   count = count || 10;
    //   pattern = pattern || '*';
    // }
    this._unsupported();
  }

  hset(key, field, value, callback) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true, callback);
    } else {
      this.cache[key] = this._makeKey({}, 'hash');
    }

    if (!this._hasField(key, field)) {
      retVal = 1;
    }

    this._setField(key, field, value.toString());
    this.persist(key);

    return this._handleCallback(callback, retVal);
  }

  hsetnx(key, field, value, callback) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true, callback);
    } else {
      this.cache[key] = this._makeKey({}, 'hash');
    }

    if (!this._hasField(key, field)) {
      this._setField(key, field, value.toString());
      this.persist(key);
      retVal = 1;
    }

    return this._handleCallback(callback, retVal);
  }

  hstrlen(key, field, callback) {
    let retVal = 0;
    const getVal = this.hget(key, field);
    if (!__.isNil(getVal)) {
      retVal = getVal.length;
    }

    return this._handleCallback(callback, retVal);
  }

  hvals(key, callback) {
    let retVals = [];
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true, callback);
      retVals = Object.values(this._getKey(key));
    }

    return this._handleCallback(callback, retVals);
  }

  // -------------------------------------------------
  // HyperLogLog (Unique Lists -- Stored as a string?)
  // -------------------------------------------------
  pfadd(key, ...elements) {
    this._unsupported();
  }

  pfcount(...keys) {
    this._unsupported();
  }

  pfmerge(destkey, ...srckeys) {
    this._unsupported();
  }

  // ---------------------------------------
  // Keys
  // ---------------------------------------
  del(...keys) {
    let retVal = 0;
    const callback = this._retrieveCallback(keys);
    // Flatten the array in case an array was passed
    keys = __.flatten(keys);

    for (let itr = 0; itr < keys.length; itr++) {
      const key = keys[itr];
      if (this._hasKey(key)) {
        delete this.cache[key];
        retVal++;
      }
    }

    return this._handleCallback(callback, retVal);
  }

  dump(key, callback) {
    let retVal = null;
    if (this._hasKey(key)) {
      retVal = JSON.stringify(this.cache[key]);
    }

    return this._handleCallback(callback, retVal);
  }

  exists(...keys) {
    let retVal = 0;
    const callback = this._retrieveCallback(keys);

    for (let itr = 0; itr < keys.length; itr++) {
      const key = keys[itr];
      if (this._hasKey(key)) {
        retVal++;
      }
    }
    return this._handleCallback(callback, retVal);
  }

  expire(key, seconds, callback) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this.cache[key].timeout = Date.now() + parseInt(seconds) * 1000;
      retVal = 1;
    }
    return this._handleCallback(callback, retVal);
  }

  expireat(key, timestamp, callback) {
    let retVal = 0;
    timestamp = parseInt(timestamp) * 1000;
    if (this._hasKey(key)) {
      this.cache[key].timeout = timestamp;
      retVal = 1;
    }
    return this._handleCallback(callback, retVal);
  }

  keys(pattern, callback) {
    const retVals = [];
    pattern = pattern || '*';
    const regEx = this._createRegExpGlob(pattern);
    for (const key in this.cache) {
      if (this._hasKey(key)) {
        if (!__.isNil(key.match(regEx))) {
          retVals.push(key);
        }
      }
    }
    return this._handleCallback(callback, retVals);
  }

  migrate(...params) {
    this._unsupported();
  }

  move(key, dbIndex, callback) {
    let retVal = 0;
    // Move a key to the specified dbindex.
    // If the database does not exist then it is created
    const index = parseInt(dbIndex);
    if (isNaN(index)) {
      return this._handleCallback(callback, null, messages.invalidDBIndex);
    }
    if (!this.databases.hasOwnProperty(index)) {
      this.databases[index] = Object.create({});
    }

    // exit multi mode if we are in it
    this.discard(null, true);

    if (!this.databases[index].hasOwnProperty(key) && this._hasKey(key)) {
      const temp = Object.assign(this.cache[key]);
      delete this.cache[key];
      this.databases[index][key] = temp;
      retVal = 1;
    }

    return this._handleCallback(callback, retVal);
  }

  object(subcommand, ...params) {
    this._unsupported();
  }

  persist(key, callback) {
    let retVal = 0;
    if (this._hasKey(key)) {
      if (!__.isNil(this._key(key).timeout)) {
        this._key(key).timeout = null;
        retVal = 1;
      }
    }
    return this._handleCallback(callback, retVal);
  }

  pexpire(key, milliseconds, callback) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this.cache[key].timeout = Date.now() + parseInt(milliseconds);
      retVal = 1;
    }
    return this._handleCallback(callback, retVal);
  }

  pexpireat(key, timestamp, callback) {
    let retVal = 0;
    timestamp = parseInt(timestamp);
    if (this._hasKey(key)) {
      this.cache[key].timeout = timestamp;
      retVal = 1;
    }
    return this._handleCallback(callback, retVal);
  }

  pttl(key, callback) {
    let retVal = -2;
    if (this._hasKey(key)) {
      if (!__.isNil(this.cache[key].timeout)) {
        retVal = this.cache[key].timeout - Date.now();
        // Prevent unexpected errors if the actual ttl just happens to be -2 or -1
        if (retVal < 0 && retVal > -3) {
          retVal = -3;
        }
      } else {
        retVal = -1;
      }
    }
    return this._handleCallback(callback, retVal);
  }

  randomkey(callback) {
    let retVal = null;
    const keys = Object.keys(this.cache);
    if (keys.length !== 0) {
      const idx = this._randInt(0, keys.length - 1);
      retVal = keys[idx];
    }
    return this._handleCallback(callback, retVal);
  }

  rename(key, newkey, callback) {
    if (this._hasKey(key)) {
      this.cache[newkey] = Object.assign(this.cache[key]);
      delete this.cache[key];
      return this._handleCallback(callback, messages.ok);
    }
    return this._handleCallback(callback, null, messages.nokey);
  }

  renamenx(key, newkey, callback) {
    let retVal = 0;
    if (this._hasKey(key)) {
      if (!this._hasKey(newkey)) {
        this.cache[newkey] = Object.assign(this.cache[key]);
        delete this.cache[key];
        retVal = 1;
      }
      return this._handleCallback(callback, retVal);
    }
    return this._handleCallback(callback, null, messages.nokey);
  }

  restore(key, ttl, value, replace, callback) {
    replace = !!(replace);
    ttl = ttl || 0;
    if (this._hasKey(key) && !replace) {
      return this._handleCallback(callback, null, messages.busykey);
    }
    let val;
    try {
      val = JSON.parse(value);
    } catch (err) {
      return this._handleCallback(callback, null, messages.wrongPayload);
    }
    this.cache[key] = Object.assign(val);
    if (ttl !== 0) {
      this.pexpire(key, ttl);
    }
    return this._handleCallback(callback, messages.ok);
  }

  scan(cursor, pattern, count, callback) {
    count = count || 10;
    pattern = pattern || '*';
    this._unsupported();
  }

  sort(key, ...params) {
    this._unsupported();
  }

  touch(...keys) {
    let retVal = 0;
    const callback = this._retrieveCallback(keys);

    for (let itr = 0; itr < keys.length; itr++) {
      const key = keys[itr];
      if (this._hasKey(key)) {
        this.cache[key].lastAccess = Date.now();
        retVal++;
      }
    }

    return this._handleCallback(callback, retVal);
  }

  ttl(key, callback) {
    let retVal = this.pttl(key);
    if (retVal >= 0 || retVal <= -3) {
      retVal = Math.floor(retVal / 1000);
    }
    return this._handleCallback(callback, retVal);
  }

  type(key, callback) {
    let keyType = 'none';
    if (this._hasKey(key)) {
      keyType = this.cache[key].type;
    }
    return this._handleCallback(callback, keyType);
  }

  unlink(...keys) {
    const callback = this._retrieveCallback(keys);
    return this._handleCallback(callback, this.del(keys));
  }

  wait(numslaves, timeout) {
    this._unsupported();
  }

  // ---------------------------------------
  // Lists (Array / Queue / Stack)
  // ---------------------------------------
  blpop(...params) {
    this._unsupported();
  }

  brpop(...params) {
    this._unsupported();
  }

  brpoplpush(...params) {
    this._unsupported();
  }

  lindex(key, index, callback) {
    let retVal = null;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true, callback);
      const length = this._getKey(key).length || 0;
      if (index < 0) {
        index = length + index;
      }
      if (index < length && index >= 0) {
        retVal = this._getKey(key)[index];
      }
    }

    return this._handleCallback(callback, retVal);
  }

  linsert(key, before, pivot, value, callback) {
    let retVal = -1;
    before = !__.isNil(before) ? before : true;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true, callback);
      const length = this._getKey(key).length || 0;
      if (pivot < length) {
        let add = 0;
        if (before === false || before === 'after') {
          add = 1;
        }
        const val = this._getKey(key);
        val.splice(pivot + add, 0, value);
        this._setKey(key, val);
        retVal = val.length;
      }
    }

    return this._handleCallback(callback, retVal);
  }

  llen(key, callback) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true, callback);
      retVal = this._getKey(key).length || 0;
    }

    return this._handleCallback(callback, retVal);
  }

  lpop(key, callback) {
    let retVal = null;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true, callback);
      const val = this._getKey(key);
      retVal = val.shift();
      this._setKey(key, val);
    }

    return this._handleCallback(callback, retVal);
  }

  lpush(key, value, callback) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true, callback);
    } else {
      this.cache[key] = this._makeKey([], 'list');
    }

    const val = this._getKey(key);
    val.splice(0, 0, value);
    this._setKey(key, val);
    retVal = val.length;
    return this._handleCallback(callback, retVal);
  }

  lpushx(key, value, callback) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true, callback);
      const val = this._getKey(key);
      val.splice(0, 0, value);
      this._setKey(key, val);
      retVal = val.length;
    }

    return this._handleCallback(callback, retVal);
  }

  lrange(key, start, stop, callback) {
    const retVal = [];
    if (this._hasKey(key)) {
      this._testType(key, 'list', true, callback);
      const val = this._getKey(key);
      const length = val.length;
      if (stop < 0) {
        stop = length + stop;
      }
      if (start < 0) {
        start = length + start;
      }
      if (start < 0) {
        start = 0;
      }
      if (stop >= length) {
        stop = length - 1;
      }
      if (stop >= 0 && stop >= start) {
        const size = stop - start + 1;
        for (let itr = start; itr < size; itr++) {
          retVal.push(val[itr]);
        }
      }
    }
    return this._handleCallback(callback, retVal);
  }

  lrem(key, count, value, callback) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true, callback);
      const val = this._getKey(key);
      const dir = count < 0 ? -1 : 1;
      let length = val.length;
      count = Math.abs(count);
      count = count === 0 ? length : count;
      let pos = dir < 0 ? length - 1 : 0;
      while (retVal < count && pos < length && pos >= 0) {
        if (val[pos] === value) {
          val.splice(pos, 1);
          retVal++;
          length--;
        }
        pos += dir;
      }
      this._setKey(key, val);
    }

    return this._handleCallback(callback, retVal);
  }

  lset(key, index, value, callback) {
    if (this._hasKey(key)) {
      this._testType(key, 'list', true, callback);
      const val = this._getKey(key);
      index = parseInt(index);
      if (isNaN(index)) {
        return this._handleCallback(callback, null, messages.noint);
      }
      if (index < 0 || index >= val.length) {
        return this._handleCallback(callback, null, messages.indexOutOfRange);
      }
      val[index] = value;
      this._setKey(key, val);
    } else {
      return this._handleCallback(callback, null, messages.nokey);
    }

    return this._handleCallback(callback, messages.ok);
  }

  ltrim(key, start, stop, callback) {
    if (this._hasKey(key)) {
      this._testType(key, 'list', true, callback);
      const val = this._getKey(key);
      const length = val.length;
      if (stop < 0) {
        stop = length + stop;
      }
      if (start < 0) {
        start = length + start;
      }
      if (stop >= length) {
        stop = length - 1;
      }
      if (start < 0 || start >= length) {
        return this._handleCallback(callback, null, messages.indexOutOfRange);
      }

      if (stop >= 0 && stop >= start) {
        // Left Trim
        for (let itr = 0; itr < start; itr++) {
          val.shift();
        }
        // Right Trim
        for (let itr = stop + 1; itr < length; itr++) {
          val.pop();
        }
        this._setKey(key, val);
      }
    }

    return this._handleCallback(callback, messages.ok);
  }

  rpop(key, callback) {
    let retVal = null;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true, callback);
      const val = this._getKey(key);
      retVal = val.pop();
      this._setKey(key, val);
    }

    return this._handleCallback(callback, retVal);
  }

  rpoplpush(sourcekey, destkey, callback) {
    const retVal = this.rpop(sourcekey);
    if (retVal !== null) {
      this.lpush(destkey, retVal);
    }

    return this._handleCallback(callback, retVal);
  }

  rpush(key, value, callback) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true, callback);
    } else {
      this.cache[key] = this._makeKey([], 'list');
    }

    const val = this._getKey(key);
    val.push(value);
    this._setKey(key, val);
    retVal = val.length;
    return this._handleCallback(callback, retVal);
  }

  rpushx(key, value, callback) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true, callback);
      const val = this._getKey(key);
      val.push(value);
      this._setKey(key, val);
      retVal = val.length;
    }

    return this._handleCallback(callback, retVal);
  }

  // ---------------------------------------
  // Pub/Sub
  // ---------------------------------------
  psubscribe(...params) {
    this._unsupported();
  }

  pubsub(...params) {
    this._unsupported();
  }

  publish(...params) {
    this._unsupported();
  }

  punsubscribe(...params) {
    this._unsupported();
  }

  suscribe(...params) {
    this._unsupported();
  }

  unsubscribe(...params) {
    this._unsupported();
  }

  // ---------------------------------------
  // Scripting
  // ---------------------------------------
  eval(...params) {
    this._unsupported();
  }

  evalsha(...params) {
    this._unsupported();
  }

  script(...params) {
    this._unsupported();
  }

  // ---------------------------------------
  // ## Server ##
  // ---------------------------------------
  bgrewriteaof() {
    this._unsupported();
  }

  bgsave(callback) {
    this.lastSave = Date.now();
    return this._handleCallback(callback, messages.ok);
  }

  client(...params) {
    this._unsupported();
  }

  command(...params) {
    this._unsupported();
  }

  config(...params) {
    this._unsupported();
  }

  dbsize(callback) {
    const retVal = Object.keys(this.cache).length;
    return this._handleCallback(callback, retVal);
  }

  debug(command, ...params) {
    this._unsupported();
    // switch (command) {
    //   default:
    //     break;
    // }
  }

  flushall(...params) {
    const callback = this._retrieveCallback(params);
    this.currentDBIndex = 0;
    delete this.cache;
    delete this.databases;
    this.databases = Object.assign({});
    this.databases[this.currentDBIndex] = Object.assign({});
    this.cache = this.databases[this.currentDBIndex];

    return this._handleCallback(callback, messages.ok);
  }

  flushdb(callback) {
    delete this.cache;
    delete this.databases[this.currentDBIndex];
    this.databases[this.currentDBIndex] = Object.assign({});
    this.cache = this.databases[this.currentDBIndex];

    return this._handleCallback(callback, messages.ok);
  }

  info(section, callback) {
    return this._handleCallback(callback, '');
  }

  lastsave(callback) {
    return this._handleCallback(callback, this.lastSave);
  }

  monitor() {
    this._unsupported();
  }

  role(callback) {
    const retVal = ['master', 0, null];
    return this._handleCallback(callback, retVal);
  }

  save(callback) {
    this.lastSave = Date.now();
    return this._handleCallback(callback, messages.ok);
  }

  shutdown() {
    this._unsupported();
  }

  slaveof(host, port) {
    this._unsupported();
  }

  slowlog(command, param) {
    this._unsupported();
  }

  sync() {
    this._unsupported();
  }

  time(callback) {
    const retVal = [];
    const now = Date.now();
    const rawSeconds = now / 1000;
    const seconds = Math.floor(rawSeconds);
    const micro = Math.floor((rawSeconds - seconds) * 1000000);
    retVal.push(seconds);
    retVal.push(micro);

    return this._handleCallback(callback, retVal);
  }

  // ---------------------------------------
  // ## Sets (Unique Lists)##
  // ---------------------------------------
  sadd(key, ...members) {
    let retVal = 0;
    const callback = this._retrieveCallback(members);
    if (this._hasKey(key)) {
      this._testType(key, 'set', true, callback);
    } else {
      this.cache[key] = this._makeKey([], 'set');
    }
    const val = this._getKey(key);
    const length = val.length;
    const nval = __.union(val, members);
    const newlength = nval.length;
    retVal = newlength - length;
    this._setKey(key, nval);

    return this._handleCallback(callback, retVal);
  }

  scard(key, callback) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'set', true, callback);
      retVal = this._getKey(key).length;
    }
    return this._handleCallback(callback, retVal);
  }

  sdiff(key, ...keys) {
    let retVal = [];
    keys = __.flatten(keys);
    const callback = this._retrieveCallback(keys);
    if (this._hasKey(key)) {
      this._testType(key, 'set', true, callback);
      retVal = this._getKey(key);
    }

    if (retVal.length !== 0) {
      for (const idx in keys) {
        if (keys.hasOwnProperty(idx)) {
          const diffkey = keys[idx];
          let diffval = [];
          if (this._hasKey(diffkey)) {
            this._testType(diffkey, 'set', true, callback);
            diffval = this._getKey(diffkey);
          }
          retVal = __.difference(retVal, diffval);
        }
      }
    }

    return this._handleCallback(callback, retVal);
  }

  sdiffstore(destkey, key, ...keys) {
    const callback = this._retrieveCallback(keys);
    const retset = this.sdiff(key, keys);
    this.cache[destkey] = this._makeKey(retset, 'set');
    return this._handleCallback(callback, retset.length);
  }

  sinter(key, ...keys) {
    let retVal = [];
    keys = __.flatten(keys);
    const callback = this._retrieveCallback(keys);
    if (this._hasKey(key)) {
      this._testType(key, 'set', true, callback);
      retVal = this._getKey(key);
    }

    if (retVal.length !== 0) {
      for (const idx in keys) {
        if (keys.hasOwnProperty(idx)) {
          const diffkey = keys[idx];
          let diffval = [];
          if (this._hasKey(diffkey)) {
            this._testType(diffkey, 'set', true, callback);
            diffval = this._getKey(diffkey);
          }
          retVal = __.intersection(retVal, diffval);
        }
      }
    }

    return this._handleCallback(callback, retVal);
  }

  sinterstore(destkey, key, ...keys) {
    const callback = this._retrieveCallback(keys);
    const retset = this.sinter(key, keys);
    this.cache[destkey] = this._makeKey(retset, 'set');
    return this._handleCallback(callback, retset.length);
  }

  sismember(key, member, callback) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'set', true, callback);
      const val = this._getKey(key);
      if (val.includes(member)) {
        retVal = 1;
      }
    }

    return this._handleCallback(callback, retVal);
  }

  smembers(key, callback) {
    let retVal = [];
    if (this._hasKey(key)) {
      this._testType(key, 'set', true, callback);
      retVal = this._getKey(key);
    }
    return this._handleCallback(callback, retVal);
  }

  smove(sourcekey, destkey, member, callback) {
    let retVal = 0;
    if (this._hasKey(sourcekey)) {
      this._testType(sourcekey, 'set', true, callback);
      const val = this._getKey(sourcekey);
      const idx = val.indexOf(member);
      if (idx !== -1) {
        this.sadd(destkey, member);
        val.splice(idx, 1);
        retVal = 1;
      }
    }
    return this._handleCallback(callback, retVal);
  }

  spop(key, count, callback) {
    let retVal = null;
    count = count || 1;
    count = parseInt(count);
    if (isNaN(count)) {
      return this._handleCallback(callback, null, messages.noint);
    }

    if (this._hasKey(key)) {
      retVal = [];
      this._testType(key, 'set', true, callback);
      const val = this._getKey(key);
      const length = val.length;
      count = count > length ? length : count;
      for (let itr = 0; itr < count; itr++) {
        retVal.push(val.pop());
      }
    }

    return this._handleCallback(callback, retVal);
  }

  srandmember(key, count, callback) {
    let retVal = [];
    const nullBehavior = __.isNil(count);
    count = count || 1;
    count = parseInt(count);
    if (isNaN(count)) {
      return this._handleCallback(callback, null, messages.noint);
    }

    const uniqueBehavior = count >= 0;
    if (!uniqueBehavior) {
      count = -count;
    }

    if (this._hasKey(key)) {
      this._testType(key, 'set', true, callback);
      const val = this._getKey(key);
      if (uniqueBehavior) {
        retVal = __.sampleSize(val, count);
      } else {
        for (let itr = 0; itr < count; itr++) {
          retVal.push(__.sample(val));
        }
      }
    } else if (nullBehavior) {
      retVal = null;
    }

    return this._handleCallback(callback, retVal);
  }

  srem(key, ...members) {
    let retVal = 0;
    const callback = this._retrieveCallback(members);
    if (this._hasKey(key)) {
      this._testType(key, 'set', true, callback);
      const val = this._getKey(key);
      for (const index in members) {
        if (members.hasOwnProperty(index)) {
          const member = members[index];
          const idx = val.indexOf(member);
          if (idx !== -1) {
            val.splice(idx, 1);
            retVal++;
          }
        }
      }
      this._setKey(key, val);
    }
    return this._handleCallback(callback, retVal);
  }

  sscan(...params) {
    this._unsupported();
  }

  sunion(key, ...keys) {
    let retVal = [];
    const callback = this._retrieveCallback(keys);
    if (this._hasKey(key)) {
      this._testType(key, 'set', true, callback);
      retVal = this._getKey(key);
    }

    if (retVal.length !== 0) {
      for (const idx in keys) {
        if (keys.hasOwnProperty(idx)) {
          const diffkey = keys[idx];
          let diffval = [];
          if (this._hasKey(diffkey)) {
            this._testType(diffkey, 'set', true, callback);
            diffval = this._getKey(diffkey);
          }
          retVal = __.union(retVal, diffval);
        }
      }
    }

    return this._handleCallback(callback, retVal);
  }

  sunionstore(destkey, key, ...keys) {
    const callback = this._retrieveCallback(keys);
    const retset = this.sunion(key, keys);
    this.cache[destkey] = this._makeKey(retset, 'set');
    return this._handleCallback(callback, retset.length);
  }

  // ---------------------------------------
  // ## Sorted Sets ##
  // ---------------------------------------
  zadd(key, ...params) {
    let retVal = 0;
    let notexists = false;
    let onlyexists = false;
    let change = false;
    let increment = false;

    params = __.flatten(params);
    const callback = this._retrieveCallback(params);

    // Look for the start of score parameters
    let index = 0;
    let foundIndex = -1;
    while (index < params.length && foundIndex === -1) {
      const val = params[index];
      if (!isNaN(parseFloat(val))) {
        foundIndex = index;
      }
      index++;
    }

    if (foundIndex === -1) {
      return this._handleCallback(callback, null, messages.wrongArgCount.replace('%0', 'zadd'));
    }

    let modifiers = [];
    if (foundIndex > 0) {
      modifiers = params.slice(0, foundIndex);
    }
    const members = params.slice(foundIndex);

    if (members.length % 2 !== 0) {
      return this._handleCallback(callback, null, messages.wrongArgCount.replace('%0', 'zadd'));
    }
    const memObj = {};

    for (let itr = 0, end = members.length; itr < end; itr += 2) {
      const kn = members[itr + 1];
      const kv = parseFloat(members[itr]);
      if (isNaN(kv)) {
        return this._handleCallback(callback, null, messages.nofloat);
      }
      memObj[kn] = kv;
    }

    for (let itr = 0; itr < modifiers.length; itr++) {
      const mod = modifiers[itr].toLowerCase();
      switch (mod) {
        case 'nx': {
          notexists = true;
          break;
        }
        case 'xx': {
          onlyexists = true;
          break;
        }
        case 'ch': {
          change = true;
          break;
        }
        case 'incr': {
          increment = true;
          break;
        }
        default: {
          return this._handleCallback(callback, null, messages.syntax);
        }
      }
    }

    if (this._hasKey(key)) {
      this._testType(key, 'zset', true, callback);
    } else {
      this.cache[key] = this._makeKey({}, 'zset');
    }

    const val = this._getKey(key);
    const length = __.size(val);
    let updates = [];

    if (notexists && onlyexists) {
      return this._handleCallback(callback, null, messages.mutuallyExclusiveNXXX);
    } else if (onlyexists) {
      updates = __.intersection(__.keys(val), __.keys(memObj));
    } else if (notexists) {
      updates = __.difference(__.keys(memObj), __.keys(val));
    } else {
      updates = __.keys(memObj);
    }

    if (increment) {
      __.mergeWith(val, __.pick(memObj, updates), (obj, src) => {
        return obj + src;
      });
    } else {
      __.merge(val, __.pick(memObj, updates));
    }

    const newlength = __.size(val);
    if (change) {
      retVal = updates.length;
    } else {
      retVal = newlength - length;
    }

    this._setKey(key, val);

    return this._handleCallback(callback, retVal);
  }

  zcard(key, callback) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'zset', true, callback);
      const val = this._getKey(key);
      retVal = __.size(val);
    }

    return this._handleCallback(callback, retVal);
  }

  zcount(key, min, max, callback) {
    let retVal = 0;
    const mn = this._parseRange(min);
    const mx = this._parseRange(max);
    if (isNaN(mn.range) || isNaN(mx.range)) {
      return this._handleCallback(callback, null, messages.nofloat);
    }

    if (this._hasKey(key)) {
      this._testType(key, 'zset', true, callback);
      const val = this._getKey(key);
      let top, bottom, memval;
      for (const memberIndex in val) {
        if (val.hasOwnProperty(memberIndex)) {
          memval = val[memberIndex];
          bottom = mn.exclusive ? memval > mn.range : memval >= mn.range;
          top = mx.exclusive ? memval < mx.range : memval <= mx.range;
          if (top && bottom) {
            retVal++;
          }
        }
      }
    }

    return this._handleCallback(callback, retVal);
  }

  zincrby(key, increment, member, callback) {
    const incr = parseFloat(increment);
    if (isNaN(incr) || __.isNil(incr)) {
      return this._handleCallback(callback, null, messages.nofloat);
    }

    if (this._hasKey(key)) {
      this._testType(key, 'zset', true, callback);
    } else {
      this.cache[key] = this._makeKey({}, 'zset');
    }

    let value;
    if (this._hasField(key, member)) {
      value = this._getField(key, member);
    } else {
      value = 0;
    }

    value += incr;
    this._setField(key, member, value);

    return this._handleCallback(callback, value);
  }

  zinterstore(...params) {
    this._unsupported();
  }

  zlexcount(key, min, max, callback) {
    let retVal = 0;
    const mn = this._parseLexRange(min, callback);
    const mx = this._parseLexRange(max, callback);

    if (this._hasKey(key)) {
      this._testType(key, 'zset', true, callback);
      const val = this._getKey(key);
      let top, bottom, memval;
      for (const memberIndex in val) {
        if (val.hasOwnProperty(memberIndex)) {
          memval = memberIndex;
          if (mn.everything) {
            bottom = false;
          } else if (mn.nothing) {
            bottom = memval >= '';
          } else if (mn.exclusive) {
            bottom = memval > mn.range;
          } else {
            bottom = memval >= mn.range;
          }

          if (mx.nothing) {
            top = false;
          } else if (mx.everything) {
            top = memval >= '';
          } else if (mx.exclusive) {
            top = memval < mx.range;
          } else {
            top = memval <= mx.range;
          }

          if (top && bottom) {
            retVal++;
          }
        }
      }
    }

    return this._handleCallback(callback, retVal);
  }

  zrange(key, start, stop, ...params) {
    // withscores, callback) {
    const retVal = [];
    let withscores = false;
    const callback = this._retrieveCallback(params);

    if (params.length > 0) {
      if (params.length > 1) {
        return this._handleCallback(callback, null, messages.syntax);
      } else if (params[0].toString().toLowerCase() === 'withscores') {
        withscores = true;
      } else {
        return this._handleCallback(callback, null, messages.syntax);
      }
    }

    start = parseInt(start);
    stop = parseInt(stop);

    if (isNaN(start) || isNaN(stop)) {
      return this._handleCallback(callback, null, messages.noint);
    }

    if (this._hasKey(key)) {
      this._testType(key, 'zset', true, callback);
      const val = this._getKey(key);
      const length = __.size(val);
      if (stop < 0) {
        stop = length + stop;
      }
      if (start < 0) {
        start = length + start;
      }
      if (start < 0) {
        start = 0;
      }
      if (stop >= length) {
        stop = length - 1;
      }
      if (stop >= 0 && stop >= start) {
        const size = stop - start + 1;
        const sorted = __.sortBy(__.toPairs(val), (ob) => {
          return ob[1];
        });

        const len = start + size;
        for (let itr = start; itr < len; itr++) {
          retVal.push(sorted[itr][0]);
          if (withscores) {
            retVal.push(sorted[itr][1]);
          }
        }
      }
    }
    return this._handleCallback(callback, retVal);
  }

  zrangebylex(key, min, max, ...params) {
    let retVal = [];
    let limit = false;
    let offset;
    let count;

    const callback = this._retrieveCallback(params);

    const mn = this._parseLexRange(min, callback);
    const mx = this._parseLexRange(max, callback);

    // Handle parameters
    if (params.length > 0) {
      limit = true;
      if (params.length !== 3) {
        return this._handleCallback(callback, null, messages.syntax);
      }

      if (params[0].toString().toLowerCase() === 'limit') {
        offset = parseInt(params[1]);
        count = parseInt(params[2]);
      } else {
        return this._handleCallback(callback, null, messages.syntax);
      }

      if (isNaN(offset) || isNaN(count)) {
        return this._handleCallback(callback, null, messages.noint);
      }
    }

    if (this._hasKey(key)) {
      this._testType(key, 'zset', true, callback);
      const val = this._getKey(key);
      const sorted = __.sortBy(
        __.sortBy(__.toPairs(val), (ob) => {
          return ob[1];
        }),
        (ob) => {
          return ob[0];
        }
      );
      let top, bottom, memval;
      for (const memberIndex in sorted) {
        if (sorted.hasOwnProperty(memberIndex)) {
          memval = sorted[memberIndex];
          if (mn.everything) {
            bottom = false;
          } else if (mn.nothing) {
            bottom = memval[0] >= '';
          } else if (mn.exclusive) {
            bottom = memval[0] > mn.range;
          } else {
            bottom = memval[0] >= mn.range;
          }

          if (mx.nothing) {
            top = false;
          } else if (mx.everything) {
            top = memval[0] >= '';
          } else if (mx.exclusive) {
            top = memval[0] < mx.range;
          } else {
            top = memval[0] <= mx.range;
          }

          if (top && bottom) {
            retVal.push(memval[0]);
          }
        }
      }
    }

    if (limit) {
      const len = offset + count;
      const temp = [];
      for (let itr = offset; itr < len && itr < retVal.length; itr++) {
        temp.push(retVal[itr]);
      }
      retVal = temp;
    }

    return this._handleCallback(callback, retVal);
  }

  zrangebyscore(key, min, max, ...params) {
    let retVal = [];
    let withscores = false;
    let limit = false;
    let offset;
    let count;

    const callback = this._retrieveCallback(params);

    const mn = this._parseRange(min);
    const mx = this._parseRange(max);

    if (isNaN(mn.range) || isNaN(mx.range)) {
      return this._handleCallback(callback, null, messages.nofloat);
    }

    // Handle parameters
    if (params.length > 0) {
      let itr = 0;
      while (itr < params.length) {
        const curr = params.shift();
        switch (curr.toString().toLowerCase()) {
          case 'withscores':
            withscores = true;
            break;
          case 'limit':
            if (params.length !== 2) {
              return this._handleCallback(callback, null, messages.wrongArgCount.replace('%0', 'zrangebyscore'));
            }
            limit = true;
            offset = parseInt(params.shift());
            count = parseInt(params.shift());
            itr += 2;
            break;
          default:
            return this._handleCallback(callback, null, messages.syntax);
        }
        itr++;
      }

      if (limit && (isNaN(offset) || isNaN(count))) {
        return this._handleCallback(callback, null, messages.noint);
      }
    }

    const temp = [];
    if (this._hasKey(key)) {
      this._testType(key, 'zset', true, callback);
      const val = this._getKey(key);
      const sorted = __.sortBy(__.toPairs(val), (ob) => {
        return ob[1];
      });
      let top, bottom, memval;
      for (const memberIndex in sorted) {
        if (sorted.hasOwnProperty(memberIndex)) {
          memval = sorted[memberIndex];
          bottom = mn.exclusive ? memval[1] > mn.range : memval[1] >= mn.range;
          top = mx.exclusive ? memval[1] < mx.range : memval[1] <= mx.range;
          if (top && bottom) {
            temp.push(memval);
          }
        }
      }
    }

    if (limit) {
      const len = offset + count;
      for (let itr = offset; itr < len && itr < temp.length; itr++) {
        retVal.push(temp[itr][0]);
        if (withscores) {
          retVal.push(temp[itr][1]);
        }
      }
    } else if (withscores) {
      retVal = __.flatten(temp);
    } else {
      retVal = __.keys(__.fromPairs(temp));
    }

    return this._handleCallback(callback, retVal);
  }

  zrank(key, member, callback) {
    let retVal = null;

    if (this._hasKey(key)) {
      this._testType(key, 'zset', true, callback);
      const val = this._getKey(key);
      if (this._hasField(key, member)) {
        const sorted = __.sortBy(__.toPairs(val), (ob) => {
          return ob[1];
        });
        const length = sorted.length;
        let index = 0;
        let done = false;
        while (index < length && !done) {
          if (sorted[index][0] === member) {
            done = true;
          } else {
            index++;
          }
        }
        retVal = index;
      }
    }

    return this._handleCallback(callback, retVal);
  }

  zrem(key, ...members) {
    let retVal = 0;
    members = __.flatten(members);
    const callback = this._retrieveCallback(members);

    if (this._hasKey(key)) {
      this._testType(key, 'zset', true, callback);
      for (let idx = 0; idx < members.length; idx++) {
        const member = members[idx];
        if (this._hasField(key, member)) {
          delete this.cache[key].value[member];
          retVal++;
        }
      }
    }

    return this._handleCallback(callback, retVal);
  }

  zremrangebylex(key, min, max, callback) {
    let retVal = 0;
    let removeKeys = [];
    try {
      removeKeys = this.zrangebylex(key, min, max);
      retVal = this.zrem(key, removeKeys);
    } catch (err) {
      return this._handleCallback(callback, null, err);
    }

    return this._handleCallback(callback, retVal);
  }

  zremrangebyrank(key, start, stop, callback) {
    let retVal = 0;
    let removeKeys = [];
    try {
      removeKeys = this.zrange(key, start, stop);
      retVal = this.zrem(key, removeKeys);
    } catch (err) {
      return this._handleCallback(callback, null, err);
    }

    return this._handleCallback(callback, retVal);
  }

  zremrangebyscore(key, min, max, callback) {
    let retVal = 0;
    let removeKeys = [];
    try {
      removeKeys = this.zrangebyscore(key, min, max);
      retVal = this.zrem(key, removeKeys);
    } catch (err) {
      return this._handleCallback(callback, null, err);
    }

    return this._handleCallback(callback, retVal);
  }

  zrevrange(key, start, stop, ...params) {
    // withscores, callback) {
    const retVal = [];
    let withscores = false;
    const callback = this._retrieveCallback(params);
    withscores = withscores || false;

    if (params.length > 0) {
      if (params.length > 1) {
        return this._handleCallback(callback, null, messages.syntax);
      } else if (params[0].toString().toLowerCase() === 'withscores') {
        withscores = true;
      } else {
        return this._handleCallback(callback, null, messages.syntax);
      }
    }

    start = parseInt(start);
    stop = parseInt(stop);

    if (isNaN(start) || isNaN(stop)) {
      return this._handleCallback(callback, null, messages.noint);
    }

    if (this._hasKey(key)) {
      this._testType(key, 'zset', true, callback);
      const val = this._getKey(key);
      const length = __.size(val);
      if (stop < 0) {
        stop = length + stop;
      }
      if (start < 0) {
        start = length + start;
      }
      if (start < 0) {
        start = 0;
      }
      if (stop >= length) {
        stop = length - 1;
      }
      if (stop >= 0 && stop >= start) {
        const size = stop - start + 1;
        const sorted = __.reverse(__.sortBy(__.toPairs(val), (ob) => {
          return ob[1];
        }));
        const len = start + size;
        for (let itr = start; itr < len; itr++) {
          retVal.push(sorted[itr][0]);
          if (withscores) {
            retVal.push(sorted[itr][1]);
          }
        }
      }
    }
    return this._handleCallback(callback, retVal);
  }

  zrevrangebylex(key, max, min, ...params) {
    let retVal = [];
    let limit = false;
    let offset;
    let count;

    const callback = this._retrieveCallback(params);

    const mn = this._parseLexRange(min, callback);
    const mx = this._parseLexRange(max, callback);

    // Handle parameters
    if (params.length > 0) {
      limit = true;
      if (params.length !== 3) {
        return this._handleCallback(callback, null, messages.syntax);
      }

      if (params[0].toString().toLowerCase() === 'limit') {
        offset = parseInt(params[1]);
        count = parseInt(params[2]);
      } else {
        return this._handleCallback(callback, null, messages.syntax);
      }

      if (isNaN(offset) || isNaN(count)) {
        return this._handleCallback(callback, null, messages.noint);
      }
    }

    if (this._hasKey(key)) {
      this._testType(key, 'zset', true, callback);
      const val = this._getKey(key);
      const sorted = __.sortBy(
        __.sortBy(__.toPairs(val), (ob) => {
          return ob[1];
        }),
        (ob) => {
          return ob[0];
        }
      );
      let top, bottom, memval;
      for (const memberIndex in sorted) {
        if (sorted.hasOwnProperty(memberIndex)) {
          memval = sorted[memberIndex];
          if (mn.everything) {
            bottom = false;
          } else if (mn.nothing) {
            bottom = memval[0] >= '';
          } else if (mn.exclusive) {
            bottom = memval[0] > mn.range;
          } else {
            bottom = memval[0] >= mn.range;
          }

          if (mx.nothing) {
            top = false;
          } else if (mx.everything) {
            top = memval[0] >= '';
          } else if (mx.exclusive) {
            top = memval[0] < mx.range;
          } else {
            top = memval[0] <= mx.range;
          }

          if (top && bottom) {
            retVal.push(memval[0]);
          }
        }
      }
    }

    retVal = __.reverse(retVal);

    if (limit) {
      const len = offset + count;
      const temp = [];
      for (let itr = offset; itr < len && itr < retVal.length; itr++) {
        temp.push(retVal[itr]);
      }
      retVal = temp;
    }

    return this._handleCallback(callback, retVal);
  }

  zrevrangebyscore(key, max, min, ...params) {
    let retVal = [];
    let withscores = false;
    let limit = false;
    let offset;
    let count;

    const callback = this._retrieveCallback(params);

    const mn = this._parseRange(min);
    const mx = this._parseRange(max);

    if (isNaN(mn.range) || isNaN(mx.range)) {
      return this._handleCallback(callback, null, messages.nofloat);
    }

    // Handle parameters
    if (params.length > 0) {
      let itr = 0;
      while (itr < params.length) {
        const curr = params.shift();
        switch (curr.toString().toLowerCase()) {
          case 'withscores':
            withscores = true;
            break;
          case 'limit':
            if (params.length !== 2) {
              return this._handleCallback(callback, null, messages.wrongArgCount.replace('%0', 'zrangebyscore'));
            }
            limit = true;
            offset = parseInt(params.shift());
            count = parseInt(params.shift());
            itr += 2;
            break;
          default:
            return this._handleCallback(callback, null, messages.syntax);
        }
        itr++;
      }

      if (limit && (isNaN(offset) || isNaN(count))) {
        return this._handleCallback(callback, null, messages.noint);
      }
    }

    const temp = [];
    if (this._hasKey(key)) {
      this._testType(key, 'zset', true, callback);
      const val = this._getKey(key);
      const sorted = __.reverse(__.sortBy(__.toPairs(val), (ob) => {
        return ob[1];
      }));
      let top, bottom, memval;
      for (const memberIndex in sorted) {
        if (sorted.hasOwnProperty(memberIndex)) {
          memval = sorted[memberIndex];
          bottom = mn.exclusive ? memval[1] > mn.range : memval[1] >= mn.range;
          top = mx.exclusive ? memval[1] < mx.range : memval[1] <= mx.range;
          if (top && bottom) {
            temp.push(memval);
          }
        }
      }
    }

    if (limit) {
      const len = offset + count;
      for (let itr = offset; itr < len && itr < temp.length; itr++) {
        retVal.push(temp[itr][0]);
        if (withscores) {
          retVal.push(temp[itr][1]);
        }
      }
    } else if (withscores) {
      retVal = __.flatten(temp);
    } else {
      retVal = __.keys(__.fromPairs(temp));
    }

    return this._handleCallback(callback, retVal);
  }

  zrevrank(key, member, callback) {
    let retVal = null;

    if (this._hasKey(key)) {
      this._testType(key, 'zset', true, callback);
      const val = this._getKey(key);
      if (this._hasField(key, member)) {
        const sorted = __.reverse(__.sortBy(__.toPairs(val), (ob) => {
          return ob[1];
        }));
        const length = sorted.length;
        let index = 0;
        let done = false;
        while (index < length && !done) {
          if (sorted[index][0] === member) {
            done = true;
          } else {
            index++;
          }
        }
        retVal = index;
      }
    }

    return this._handleCallback(callback, retVal);
  }

  zscore(key, member, callback) {
    let retVal = null;

    if (this._hasKey(key)) {
      this._testType(key, 'zset', true, callback);
      if (this._hasField(key, member)) {
        retVal = this._getField(key, member);
      }
    }

    return this._handleCallback(callback, retVal);
  }

  zunionstore(...params) {
    this._unsupported();
  }

  zscan(...params) {
    this._unsupported();
  }

  // ---------------------------------------
  // ## String Oprations ##
  // ---------------------------------------
  append(key, value, callback) {
    const retValue = value.length || 0;
    let keyValue = '';
    if (this._hasKey(key)) {
      this._testType(key, 'string', true, callback);
      keyValue = this._getKey(key);
    } else {
      this.cache[key] = this._makeKey('', 'string');
    }
    const newValue = `${keyValue}${value}`;
    this._setKey(key, newValue);
    return this._handleCallback(callback, newValue.length);
  }

  bitcount(key, ...params) {
    let retValue = 0;
    let keyValue = '';
    let end = -1, start = 0;

    const callback = this._retrieveCallback(params);
    if (params.length > 2 || params.length > 0 && params.length < 2) {
      return this._handleCallback(callback, null, messages.syntax);
    }

    if (params.length > 0) {
      start = parseInt(params.shift());
      end = parseInt(params.shift());
      if (isNaN(start) || isNaN(end)) {
        return this._handleCallback(callback, null, messages.noint);
      }
    }

    if (this._hasKey(key)) {
      this._testType(key, 'string', true, callback);
      keyValue = this._getKey(key);
    }

    const length = keyValue.length << 4;

    if (end < 0) {
      end = length + end;
    }
    if (start < 0) {
      start = length + start;
    }
    if (start < 0) {
      start = 0;
    }
    if (end >= length) {
      end = length - 1;
    }

    let endByte = end >> 4;
    const endOffset = end % 16;
    let startByte = start >> 4;
    const startOffset = start % 16;
    let val;

    // Do first byte with offset
    val = keyValue.charCodeAt(startByte);
    if (startOffset > 0) {
      // move to offset
      for (let itr = 0; itr < startOffset; itr++) {
        val >>= 1;
      }
      for (let itr = startOffset; itr < 16; itr++) {
        retValue += val & 1;
        val >>= 1;
      }
    } else {
      // Grab full byte below
      startByte--;
    }

    // Do last byte with offset
    val = keyValue.charCodeAt(endByte);
    if (endOffset > 0) {
      // move to offset
      for (let itr = 0; itr < endOffset; itr++) {
        retValue += val & 1;
        val >>= 1;
      }
    } else {
      // Grab full byte below
      endByte++;
    }

    // Grab all middle bits
    for (let itr = startByte + 1; itr < endByte - 1; itr++) {
      val = keyValue.charCodeAt(itr);
      for (let jtr = 0; jtr < 16; jtr++) {
        retValue += val & 1;
        val >>= 1;
      }
    }
    return this._handleCallback(callback, retValue);
  }

  bitfield(...params) {
    this._unsupported();
  }

  bitop(operation, destkey, ...srckeys) {
    let retVal = 0;
    let setVal = null;
    srckeys = __.flatten(srckeys);
    const callback = this._retrieveCallback(srckeys);

    if (srckeys.length < 1) {
      return this._handleCallback(callback, null, messages.wrongArgCount.replace('%0', 'bitop'));
    }
    operation = operation.toLowerCase();
    const keys = this.mget(srckeys);

    switch (operation) {
      case 'and':
      case 'or':
      case 'xor':
        setVal = this._strbit(operation, keys);
        retVal = setVal.length;
        break;
      case 'not':
        if (srckeys.length > 1) {
          return this._handleCallback(callback, null, messages.bitopnotWrongCount);
        }
        setVal = this._strnot(keys[0]);
        retVal = setVal.length;
        break;
      default:
        return this._handleCallback(callback, null, messages.syntax);
    }

    this.set(destkey, setVal);
    return this._handleCallback(callback, retVal);
  }

  bitpos(key, bit, start, end, callback) {
    this._unsupported();
  }

  decr(key, callback) {
    let retVal = null;
    try {
      retVal = this._addToKey(key, -1);
    } catch (err) {
      return this._handleCallback(callback, null, err);
    }
    return this._handleCallback(callback, retVal);
  }

  decrby(key, amount, callback) {
    let retVal = null;
    try {
      retVal = this._addToKey(key, -amount);
    } catch (err) {
      return this._handleCallback(callback, null, err);
    }
    return this._handleCallback(callback, retVal);
  }

  get(key, callback) {
    let retVal = null;
    if (this._hasKey(key)) {
      this._testType(key, 'string', true, callback);
      retVal = this._getKey(key);
    }
    return this._handleCallback(callback, retVal);
  }

  getbit(key, offset, callback) {
    let retVal = 0;
    const byteoffset = Math.floor(offset / 16);
    if (this._hasKey(key)) {
      this._testType(key, 'string', true, callback);
      const keyValue = this._getKey(key) || '';
      let bitoffset = offset % 16;
      if (byteoffset > keyValue.length) {
        return this._handleCallback(callback, retVal);
      }
      let val = keyValue.charCodeAt(byteoffset);
      while (bitoffset > 0) {
        val >>= 1;
        bitoffset--;
      }
      retVal = val & 1;
    }
    return this._handleCallback(callback, retVal);
  }

  getrange(key, start, end, callback) {
    let retVal = '';
    if (this._hasKey(key)) {
      this._testType(key, 'string', true, callback);
      const val = this._getKey(key);
      const length = val.length;

      if (end < 0) {
        end = length + end;
      }
      if (start < 0) {
        start = length + start;
      }

      const len = end - start + 1;
      retVal = val.substr(start, len);
    }

    return this._handleCallback(callback, retVal);
  }

  getset(key, value, callback) {
    let retVal = null;

    if (this._hasKey(key)) {
      this._testType(key, 'string', true, callback);
      retVal = this._getKey(key);
      this.set(key, value);
    }

    return this._handleCallback(callback, retVal);
  }

  incr(key, callback) {
    let retVal = null;
    try {
      retVal = this._addToKey(key, 1);
    } catch (err) {
      return this._handleCallback(callback, null, err);
    }
    return this._handleCallback(callback, retVal);
  }

  incrby(key, amount, callback) {
    let retVal = null;
    try {
      retVal = this._addToKey(key, amount);
    } catch (err) {
      return this._handleCallback(callback, null, err);
    }
    return this._handleCallback(callback, retVal);
  }

  incrbyfloat(key, amount, callback) {
    let keyValue = 0;
    amount = parseFloat(amount);

    if (isNaN(amount)) {
      return this._handleCallback(callback, null, messages.nofloat);
    }

    if (this._hasKey(key)) {
      this._testType(key, 'string', true, callback);
      keyValue = parseFloat(this._getKey(key));
      if (isNaN(keyValue)) {
        return this._handleCallback(callback, null, messages.nofloat);
      }
    } else {
      this.cache[key] = this._makeKey('0.0', 'string');
    }
    const val = keyValue + amount;
    this._setKey(key, val.toString());
    return this._handleCallback(callback, val);
  }

  mget(...keys) {
    const retVals = [];
    keys = __.flatten(keys);
    const callback = this._retrieveCallback(keys);
    for (let itr = 0; itr < keys.length; itr++) {
      const key = keys[itr];
      let val = null;
      if (this._hasKey(key)) {
        if (this._testType(key, 'string')) {
          val = this._getKey(key);
        }
      }
      retVals.push(val);
    }
    return this._handleCallback(callback, retVals);
  }

  mset(...params) {
    const callback = this._retrieveCallback(params);

    // params should have key and value pairs and should be even in length
    if (params.length % 2 !== 0) {
      return this._handleCallback(callback, null, messages.wrongArgCount.replace('%0', 'mset'));
    }
    const pairs = params.length / 2;
    for (let itr = 0; itr < pairs; itr++) {
      const key = params[itr * 2];
      const value = params[itr * 2 + 1];
      this.cache[key] = this._makeKey(value, 'string');
    }
    return this._handleCallback(callback, messages.ok);
  }

  msetnx(...params) {
    let retVal = 1;
    const callback = this._retrieveCallback(params);

    // params should have key and value pairs and should be even in length
    if (params.length % 2 !== 0) {
      return this._handleCallback(callback, null, messages.wrongArgCount.replace('%0', 'msetnx'));
    }
    const pairs = params.length / 2;
    let key, value;

    // Check that all keys do not exist
    for (let itr = 0; itr < pairs; itr++) {
      key = params[itr * 2];
      if (this._hasKey(key)) {
        retVal &= 0;
      }
    }

    if (retVal === 1) {
      for (let itr = 0; itr < pairs; itr++) {
        key = params[itr * 2];
        value = params[itr * 2 + 1];
        // Only set the value if they do not exist
        this.cache[key] = this._makeKey(value, 'string');
      }
    }

    return this._handleCallback(callback, retVal);
  }

  psetex(key, pttl, value, callback) {
    try {
      const retVal = this.set(key, value, 'px', pttl);
      return this._handleCallback(callback, retVal);
    } catch (err) {
      return this._handleCallback(callback, null, err);
    }
  }

  //  set(key, value, ttl, pttl, notexist, onlyexist, callback) {
  set(key, value, ...params) {
    const retVal = null;
    params = __.flatten(params);
    const callback = this._retrieveCallback(params);
    let ttl, pttl, notexist, onlyexist;
    // parse parameters
    while (params.length > 0) {
      const param = params.shift();
      switch (param.toString().toLowerCase()) {
        case 'nx':
          notexist = true;
          break;
        case 'xx':
          onlyexist = true;
          break;
        case 'ex':
          if (params.length === 0) {
            return this._handleCallback(callback, null, messages.syntax);
          }
          ttl = parseInt(params.shift());
          if (isNaN(ttl)) {
            return this._handleCallback(callback, null, messages.noint);
          }
          break;
        case 'px':
          if (params.length === 0) {
            return this._handleCallback(callback, null, messages.syntax);
          }
          pttl = parseInt(params.shift());
          if (isNaN(pttl)) {
            return this._handleCallback(callback, null, messages.noint);
          }
          break;
        default:
          return this._handleCallback(callback, null, messages.syntax);
      }
    }

    if (!__.isNil(ttl) && !__.isNil(pttl)) {
      return this._handleCallback(callback, null, messages.syntax);
    }

    if (notexist && onlyexist) {
      return this._handleCallback(callback, null, messages.syntax);
    }

    pttl = pttl || ttl * 1000 || null;
    if (!__.isNil(pttl)) {
      pttl = Date.now() + pttl;
    }
    if (this._hasKey(key)) {
      this._testType(key, 'string', true, callback);
      if (notexist) {
        return this._handleCallback(callback, retVal);
      }
    } else if (onlyexist) {
      return this._handleCallback(callback, retVal);
    }
    this.cache[key] = this._makeKey(value.toString(), 'string', pttl);

    return this._handleCallback(callback, messages.ok);
  }

  setbit(key, offset, value, callback) {
    value &= 1;
    let getVal = null;
    const byteoffset = Math.floor(offset / 16);
    const bitoffset = offset % 16;

    if (this._hasKey(key)) {
      this._testType(key, 'string', true, callback);
      getVal = this._getKey(key);
    }

    // Create bitmask
    let bitmask = 1;
    bitmask <<= bitoffset;

    // Zero-pad the string value (+1 offset length for the current bit to set)
    if (!__.isNil(getVal)) {
      getVal = __.padEnd(getVal, byteoffset + 1, '\u0000');
    } else {
      getVal = __.padEnd('', byteoffset + 1, '\u0000');
    }

    let code = getVal.charCodeAt(byteoffset);
    const retVal = (code & bitmask) > 0 ? 1 : 0;

    if (value === 0) {
      // Clear the specified bit
      code &= ~bitmask;
    } else {
      // Set the specified bit
      code |= bitmask;
    }

    const valArr = getVal.split('');
    valArr[byteoffset] = String.fromCharCode(code);
    getVal = valArr.join('');

    this.set(key, getVal);
    return this._handleCallback(callback, retVal);
  }

  setex(key, ttl, value, callback) {
    try {
      const retVal = this.set(key, value, 'ex', ttl);
      return this._handleCallback(callback, retVal);
    } catch (err) {
      return this._handleCallback(callback, null, err);
    }
  }

  setnx(key, value, callback) {
    try {
      let retVal = this.set(key, value, 'nx');
      retVal = retVal === 'OK' ? 1 : 0;
      return this._handleCallback(callback, retVal);
    } catch (err) {
      return this._handleCallback(callback, null, err);
    }
  }

  setrange(key, offset, value, callback) {
    let beginning = '';
    let end = '';
    let getVal = null;
    if (this._hasKey(key)) {
      this._testType(key, 'string', true, callback);
      getVal = this._getKey(key);
    }

    if (!__.isNil(getVal)) {
      const fullStr = __.padEnd(getVal, offset, '\u0000');
      beginning = fullStr.substr(0, offset);
      end = fullStr.substr(offset + value.length);
    } else {
      // Pad the string with null characters
      beginning = __.padEnd('', offset, '\u0000');
    }
    const retVal = `${beginning}${value}${end}`;
    this.set(key, retVal);
    return this._handleCallback(callback, retVal.length);
  }

  strlen(key, callback) {
    let retVal = 0;
    let getVal = '';
    if (this._hasKey(key)) {
      this._testType(key, 'string', true, callback);
      getVal = this._getKey(key);
    }

    if (!__.isNil(getVal)) {
      retVal = getVal.length;
    }

    return this._handleCallback(callback, retVal);
  }

  // ---------------------------------------
  // ## Transactions (Atomic) ##
  // ---------------------------------------
  // TODO: Transaction Queues watch and unwatch
  // https://redis.io/topics/transactions
  // This can be accomplished by temporarily swapping this.cache to a temporary copy of the current statement
  // holding and then using __.merge on actual this.cache with the temp storage.
  discard(callback, silent) {
    // Clear the queue mode, drain the queue, empty the watch list
    if (this.multiMode) {
      this.cache = this.databases[this.currentDBIndex];
      this.tempCache = {};
      this.multiMode = false;
      this.responseMessages = [];
    } else if (!silent) {
      return this._handleCallback(callback, null, messages.nomultidiscard);
    }
    return this._handleCallback(callback, messages.ok);
  }

  exec(callback) {
    // Run the queue and clear queue mode
    if (!this.multiMode) {
      return this._handleCallback(callback, null, messages.nomultiexec);
    }
    this.multiMode = false;
    this.databases[this.currentDBIndex] = Object.assign(this.tempCache);
    this.cache = this.databases[this.currentDBIndex];
    const tempMessages = this.responseMessages;
    tempMessages.push(messages.ok);
    this.responseMessages = [];
    return this._handleCallback(callback, tempMessages);
  }

  multi(callback) {
    // Set Queue mode active
    if (this.multiMode) {
      return this._handleCallback(callback, null, messages.nomultiinmulti);
    }
    this.multiMode = true;
    this.tempCache = Object.assign(this.cache);
    this.cache = this.tempCache;
    this.responseMessages = [];

    return this._handleCallback(callback, messages.ok, null, false);
  }

  unwatch() {
    // remove key from watch list
    this._unsupported();
  }

  watch() {
    // Add key to watch list
    this._unsupported();
  }

  // ---------------------------------------
  // ## Internal - Util ##
  // ---------------------------------------
  _unsupported() {
    if (this.options.bypassUnsupported) {
      return undefined;
    }
    return this._handleCallback(null, null, messages.unsupported);
  }

  _createRegExpGlob(pattern) {
    pattern = pattern.replace(/\./, '.');
    pattern = pattern.replace(/\\/, '\\');
    pattern = pattern.replace(/\?/, '.?');
    pattern = pattern.replace(/\*/, '.*');
    return new RegExp(`^${pattern}`);
  }

  _randInt(min, max) {
    min = Math.ceil(min || 0);
    max = Math.floor(max || 1);
    return Math.round(Math.random() * (max - min)) + min;
  }

  _testType(key, type, throwError, callback) {
    throwError = !__.isNil(throwError) ? throwError : false;
    const keyType = this._key(key).type;
    if (keyType !== type) {
      if (throwError) {
        return this._handleCallback(callback, null, messages.wrongTypeOp);
      }
      return false;
    }
    return true;
  }

  _parseRange(value) {
    value = value.toString() || '';
    const excl = value.indexOf('(') === 0;
    const adj = excl ? 1 : 0;
    const newVal = value.replace(/[Ii]nf$/, 'Infinity');
    const newStr = newVal.substr(adj);
    const range = parseFloat(newStr);
    return { exclusive: excl, range: range };
  }

  _parseLexRange(value, callback) {
    value = value.toString() || '';
    if (!value.match(/^[([+-]/)) {
      return this._handleCallback(callback, null, messages.invalidLexRange);
    }
    const excl = value.indexOf('(') === 0;
    const nothing = value.indexOf('-') === 0 && value.length === 1;
    const everything = value.indexOf('+') === 0 && value.length === 1;
    if (nothing || everything) {
      value = '';
    }
    value = value.substr(1);
    return { exclusive: excl, nothing: nothing, everything: everything, range: value };
  }

  _logReturn(message) {
    if (!__.isUndefined(message)) {
      if (this.multiMode) {
        if (!__.isNil(this.responseMessages)) {
          this.responseMessages.push(message);
          if (message === messages.ok) {
            message = messages.queued;
          }
        }
      }
      return message;
    }
    return;
  }

  _handleCallback(callback, message, error, nolog) {
    let err = error;
    let msg = message;
    nolog = __.isNil(nolog) ? true : nolog;
    if (nolog) {
      err = this._logReturn(error);
      msg = this._logReturn(message);
    }
    if (typeof callback === 'function') {
      callback(err, msg);
      return;
    }
    if (err) {
      throw new MemoryCacheError(err);
    }
    return msg;
  }

  _retrieveCallback(params) {
    if (Array.isArray(params) && params.length > 0 && typeof params[params.length - 1] === 'function') {
      return params.pop();
    }
    return;
  }

  // ---------------------------------------
  // ## Internal - Geo ##
  // ---------------------------------------
  _convertDistance(dist, conversion) {
    switch (conversion) {
      case 'km':
        dist /= 1000;
        break;
      case 'ft':
        dist *= 3.28084;
        break;
      case 'mi':
        dist /= 1609.344;
        break;
      case 'm':
      default:
        break;
    }
    return dist;
  }

  // ---------------------------------------
  // ## Internal - Key ##
  // ---------------------------------------
  _hasKey(key) {
    return this.cache.hasOwnProperty(key);
  }

  _makeKey(value, type, timeout) {
    return { value: value, type: type, timeout: timeout || null, lastAccess: Date.now() };
  }

  _key(key) {
    this.cache[key].lastAccess = Date.now();
    return this.cache[key];
  }

  // ---------------------------------------
  // ## Internal - Hash ##
  // ---------------------------------------
  _addToField(key, field, amount, useFloat, callback) {
    useFloat = useFloat || false;
    let fieldValue = useFloat ? '0.0' : '0';
    let value = 0;

    if (isNaN(amount) || __.isNil(amount)) {
      return this._handleCallback(callback, null, useFloat ? messages.nofloat : messages.noint);
    }

    if (this._hasKey(key)) {
      this._testType(key, 'hash', true, callback);
      if (this._hasField(key, field)) {
        value = this._getField(key, field);
      }
    } else {
      this.cache[key] = this._makeKey({}, 'hash');
    }

    fieldValue = useFloat ? parseFloat(value) : parseInt(value);
    amount = useFloat ? parseFloat(amount) : parseInt(amount);
    if (isNaN(fieldValue) || __.isNil(fieldValue)) {
      return this._handleCallback(callback, null, useFloat ? messages.nofloat : messages.noint);
    }

    fieldValue += amount;
    this._setField(key, field, fieldValue.toString());
    return fieldValue;
  }

  _getField(key, field) {
    return this._getKey(key)[field];
  }

  _hasField(key, field) {
    let retVal = false;
    if (key && field) {
      const ky = this._getKey(key);
      if (ky) {
        retVal = ky.hasOwnProperty(field);
      }
    }
    return retVal;
  }

  _setField(key, field, value) {
    this._getKey(key)[field] = value;
  }

  // ---------------------------------------
  // ## Internal - String ##
  // ---------------------------------------
  _addToKey(key, amount, callback) {
    let keyValue = 0;

    if (isNaN(amount) || __.isNil(amount)) {
      return this._handleCallback(callback, null, messages.noint);
    }

    if (this._hasKey(key)) {
      this._testType(key, 'string', true, callback);
      keyValue = parseInt(this._getKey(key));
      if (isNaN(keyValue) || __.isNil(keyValue)) {
        return this._handleCallback(callback, null, messages.noint);
      }
    } else {
      this.cache[key] = this._makeKey('0', 'string');
    }
    const val = keyValue + amount;
    this._setKey(key, val.toString());
    return val;
  }

  _strnot(value) {
    const bytes = [];
    let newPoint = 0;
    for (let itr = 0; itr < value.length; itr++) {
      const code = value.charCodeAt(itr);
      newPoint = ((code & 0xFFFF) ^ 0xFFFF) & 0xFFFF;
      bytes.push(String.fromCharCode(newPoint));
    }
    return bytes.join('');
  }

  _strbit(op, values) {
    let retVal = values[0];
    let bytes = [];
    for (let itr = 1; itr < values.length; itr++) {
      let next = values[itr];
      // Zero-pad values before operation
      retVal = __.padEnd(retVal, next.length, '\u0000');
      next = __.padEnd(next, retVal.length, '\u0000');
      bytes = [];
      for (let jtr = 0; jtr < next.length; jtr++) {
        const destCode = retVal.charCodeAt(jtr);
        const srcCode = next.charCodeAt(jtr);
        let val = 0;
        switch (op) {
          case 'and':
            val = destCode & srcCode;
            break;
          case 'or':
            val = destCode | srcCode;
            break;
          case 'xor':
            val = destCode ^ srcCode;
            break;
          default:
            val = destCode;
            break;
        }
        bytes.push(String.fromCharCode(val));
      }
      retVal = bytes.join('');
    }
    return retVal;
  }

  _getKey(key) {
    const _key = this._key(key) || {};
    if (_key.timeout && _key.timeout <= Date.now()) {
      this.del(key);
      return null;
    }
    return _key.value;
  }

  _setKey(key, value) {
    this.cache[key].value = value;
    this.cache[key].lastAccess = Date.now();
  }
}

// ---------------------------------------
// ## Export ##
// ---------------------------------------
// Add Asyncronous functions and Uppercase variants
bluebird.promisifyAll(MemoryCache.prototype);
const keys = Object.getOwnPropertyNames(MemoryCache.prototype);
for (const idx in keys) {
  if (keys.hasOwnProperty(idx)) {
    const key = keys[idx];
    if (key !== 'constructor' && key.indexOf('_') !== 0) {
      // Add uppercase variant
      MemoryCache.prototype[key.toUpperCase()] = MemoryCache.prototype[key];
    }
  }
}

module.exports = MemoryCache;
module.exports.MemoryCacheError = MemoryCacheError;
