// memory-cache.js

const __ = require('@mediaxpost/lodashext');
const bluebird = require('bluebird');
const Event = require('events');
const pkg = require('./package.json');

const messages = {
  ok: 'OK',
  pong: 'PONG',
  noint: 'ERR value is not an integer or out of range',
  nofloat: 'ERR value is not an float or out of range',
  nokey: 'ERR no such key',
  busykey: 'ERR target key name is busy',
  syntax: 'ERR syntax error',
  unsupported: 'MemoryCache does not support that operation',
  wrongTypeOp: 'WRONGTYPE Operation against a key holding the wrong kind of value',
  wrongPayload: 'DUMP payload version or checksum are wrong',
  wrongArgCount: 'ERR wrong number of arguments for \'%0\' command',
  bitopnotWrongCount: 'ERR BITOP NOT must be called with a single source key',
  indexOutOfRange: 'ERR index out of range',
  invalidDBIndex: 'ERR invalid DB index',
  invalidDBIndexNX: 'ERR invalid DB index, \'%0\' does not exist'
};

class MemoryCache extends Event {
  constructor(options) {
    super();
    this.databases = {};
    this.databases[0] = Object.create({});
    this.cache = this.databases[0];
    this.currentDBIndex = 0;
    this.isConnected = false;
    this.options = __.merge(Object.assign({
      debug: false,
      bypassUnsupported: false
    }), options || {});
    this.lastSave = Date.now();
  }

  // ---------------------------------------
  // Connection
  // ---------------------------------------
  connect() {
    this.isConnected = true;
    this.emit('connect');
    this.emit('ready');
    return this;
  }

  quit() {
    this.isConnected = false;
    this.emit('end');
    return this;
  }

  auth(password) {
    return messages.ok;
  }

  echo(message) {
    return message;
  }

  ping(message) {
    if (__.isUnset(message)) {
      return messages.pong;
    }
    return message;
  }

  swapdb(dbIndex1, dbIndex2) {
    let index1 = parseInt(dbIndex1);
    let index2 = parseInt(dbIndex2);
    if (index1 === NaN || index2 == NaN) {
      throw new Error(messages.invalidDBIndex);
    }
    if (!this.databases.hasOwnProperty(index1)) {
      throw new Error(messages.invalidDBIndexNX.replace('%0', index1));
    } else if (!this.databases.hasOwnProperty(index2)) {
      throw new Error(messages.invalidDBIndexNX.replace('%0', index2));
    }

    // Swap databases
    let temp = this.databases[index1];
    this.databases[index1] = this.databases[index2];
    this.databases[index2] = temp;

    return message.ok;
  }

  select(dbIndex) {
    let index = parseInt(dbIndex);
    if (index === NaN) {
      throw new Error(messages.invalidDBIndex);
    }
    if (!this.databases.hasOwnProperty(index)) {
      this.databases[index] = Object.create({});
    }
    this.currentDBIndex = index;
    this.cache = this.databases[index];
    return messages.ok
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
  geoadd(...params) {
    this._unsupported();
  }

  geodist(...params) {
    this._unsupported();
  }

  geohash(...params) {
    this._unsupported();
  }

  geopos(...params) {
    this._unsupported();
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
    let fieldCount = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true);
      for (let c = 0; c < fields.length; c++) {
        const field = fields[c];
        if (this._hasField(key, field)) {
          delete this.cache[key].value[field];
          fieldCount++;
        }
      }
    }
    return fieldCount;
  }

  hexists(key, field) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true);
      if (this._hasField(key, field)) {
        retVal = 1;
      }
    }
    return retVal;
  }

  hget(key, field) {
    let retVal = null;
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true);
      if (this._hasField(key, field)) {
        retVal = this._getKey(key)[field];
      }
    }
    return retVal;
  }

  hgetall(key) {
    let retVals = [];
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true);
      for (var field in this._getKey(key)) {
        retVals.push(field);
        retVals.push(this._getField(key, field));
      }
    }
    return retVals;
  }

  hincrby(key, field, value) {
    return this._addToField(key, field, value, false);
  }

  hincrbyfloat(key, field, value) {
    return this._addToField(key, field, value, true);
  }

  hkeys(key) {
    let retVal = [];
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true);
      retVal = this._getKey(key).keys();
    }

    return retVals;
  }

  hlen(key) {
    return this.hkeys(key).length;
  }

  hmget(key, ...fields) {
    const fieldVals = [];
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true);
    }
    for (let c = 0; c < fields.length; c++) {
      const field = fields[c];
      let val = null;
      if (this._hasKey(key)) {
        if (this._hasField(key, field)) {
          val = this._getField(key, field);
        }
      }
      fieldVals.push(val);
    }
    return fieldVals;
  }

  hmset(key, ...params) {
    // params should have key and field/value pairs and should be even in length
    if (((params.legnth)  % 2) !== 0)
    {
      throw new Error(messages.wrongArgCount.replace('%0', 'hmset'));
    }
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true);
    } else {
      this.cache[key] = this._makeKey({}, 'hash');
    }

    const pairs = params.length / 2;
    for (let itr = 0; itr < pairs; itr++) {
      let field = param[itr * 2];
      let value = param[(itr * 2) + 1];
      this._setField(key, field, value);
    }

    return messages.ok;
  }

  hscan(key, cursor, pattern, count) {
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true);
      count = count || 10;
      pattern = pattern || '*';
    }
    this._unsupported();
  }

  hset(key, field, value) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true);
    } else {
      this.cache[key] = this._makeKey({}, 'hash');
    }

    if (!this._hasField(key, field)) {
      retVal = 1;
    }

    this._setField(key, field, value);
    this.persist(key);

    return retVal;
  }

  hsetnx() {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true);
    } else {
      this.cache[key] = this._makeKey({}, 'hash');
    }

    if (!this._hasField(key, field)) {
      this._setField(key, field, value);
      this.persist(key);
      retVal = 1;
    }

    return retVal;
  }

  hstrlen(key, field) {
    const getVal = this.hget(key, field);
    if (__.hasValue(getVal)) {
      return getVal.length;
    }
    return 0;
  }

  hvals(key) {
    let retVals = [];
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true);
      retVals = this._getKey(key).values();
    }

    return retVals;
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
    let keyCount = 0;
    for (let c = 0; c < keys.length; c++) {
      const key = keys[c];
      if (this._hasKey(key)) {
        delete this.cache[key];
        keyCount++;
      }
    }
    return keyCount;
  }

  dump(key) {
    if (this._hasKey(key)) {
      return JSON.stringify(this.cache[key]);
    }
    return null;
  }

  exists(...keys) {
    let existCount = 0;
    for (let c = 0; c < keys.length; c++) {
      const key = keys[c];
      if (this._hasKey(key)) { existCount++; }
    }
    return existCount;
  }

  expire(key, seconds) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this.cache[key].timeout = Date.now() + (parseInt(seconds) * 1000);
      retVal = 1;
    }
    return retVal;
  }

  expireat(key, timestamp) {
    let retVal = 0;
    if (parseInt(timestamp).toString().length <= 11) {
      timestamp = parseInt(timestamp) * 1000;
    }
    if (this._hasKey(key)) {
      this.cache[c].timeout = timestamp;
      retVal = 1;
    }
    return retVal;
  }

  keys(pattern) {
    let keyList = [];
    pattern = pattern || '*';
    let regEx = this._createRegExpGlob(pattern);
    for (const key in this.cache) {
      if (this._hasKey(key)) {
        if (__.hasValue(key.matches(regEx))) { keyList.push(key); }
      }
    }
    return keyList;
  }

  migrate(...params) {
    this._unsupported();
  }

  move(key, db) {
    this._unsupported();
  }

  object(subcommand, ...params) {
    this._unsupported();
  }

  persist(key) {
    let retVal = 0;
    if (this._hasKey(key)) {
      if (__.hasValue(this._key(key).timeout)) {
        this._key(key).timeout = null;
        retVal = 1;
      }
    }
    return retVal;
  }

  pexpire(key, milliseconds) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this.cache[key].timeout = Date.now() + (parseInt(milliseconds));
      retVal = 1;
    }
    return retVal;
  }

  pexpireat(key, timestamp) {
    return this.expireat(key, timestamp);
  }

  pttl(key) {
    let retVal = -2;
    if (this._hasKey(key)) {
      if (__.hasValue(this.cache[key].timeout)) {
        retVal = this.cache[key].timeout - Date.now();
        // Prevent unexpected errors if the actual ttl just happens to be -2 or -1
        if (retVal < 0 && rettVal > -3) retVal = -3;
      } else {
        retVal = -1;
      }
    }
    return retVal;
  }

  randomkey() {
    let keyName = null;
    const keys = Object.keys(this.cache);
    if (keys.length !== 0) {
      const idx = this._randInt(0, keys.length - 1);
      keyName = keys[idx];
    }
    return keyName;
  }

  rename(key, newkey) {
    if (this._hasKey(key)) {
      this.cache[newkey] = Object.assign(this.cache[key]);
      delete this.cache[key];
      return messages.ok;
    }
    throw new Error(messages.nokey);
  }

  renamenx(key, newkey) {
    let retVal = 0;
    if (this._hasKey(key)) {
      if (!this._hasKey(newkey)) {
        this.cache[newkey] = Object.assign(this.cache[key]);
        delete this.cache[key];
        retVal = 1;
      }
      return retVal;
    }
    throw new Error(messages.nokey);
  }

  restore(key, ttl, value, replace) {
    replace = __.bool(replace);
    ttl = ttl || 0;
    if (this._hasKey(key) && !replace) {
      throw new Error(messages.busykey);
    }
    let val;
    try {
      val = JSON.parse(value)
    } catch (err) {
      throw new Error(messages.wrongPayload);
    }
    this.cache[key] = Object.assign(val);
    if (ttl !== 0) {
      this.pexpire(key, ttl);
    }
    return message.ok;
  }

  scan(cursor, pattern, count) {
    count = count || 10;
    pattern = pattern || '*';
    this._unsupported();
  }

  sort(key, ...params) {
    this._unsupported();
  }

  touch(...keys) {
    let keyCount = 0;
    for (let c = 0; c < keys.length; c++) {
      const key = keys[c];
      if (this._hasKey(key)) {
        this.cache[key].lastAccess = Date.now();
      }
    }
    return keyCount;
  }

  ttl(key) {
    let keyttl = this.pttl(key);
    if (keyttl < 0 && keyttl > -3) {
      return keyttl;
    }
    return Math.floor(keyttl / 1000);
  }

  type(key) {
    let keyType = 'none';
    if (this._hasKey(key)) {
      return this.cache[key].type;
    }
    return keyType;
  }

  unlink(...keys) {
    return this.del(keys);
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

  lindex(key, index) {
    let retVal = null;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true);
      let length = this._getKey(key).length || 0;
      if (index < 0) { index = length + index; }
      if (index < length && index >= 0) {
        retVal = this._getKey(key)[index];
      }
    }

    return retVal;
  }

  linsert(key, before, pivot, value) {
    let retVal = -1;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true);
      let length = this._getKey(key).length || 0;
      if (pivot < length ) {
        let add = 0;
        if (before === false || before === "after") {
          add = 1;
        }
        v = this._getKey(key);
        v.splice(pivot + add, 0, value);
        this._setKey(key, v);
      }
    }

    return retVal;
  }

  llen(key) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true);
      retVal = this._getKey(key).length || 0;
    }

    return retVal;
  }

  lpop(key) {
    let retVal = null;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true);
      v = this._getKey(key);
      retVal = v.shift();
      this._setKey(key, v);
    }

    return retVal;
  }

  lpush(key, value) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true);
    } else {
      this.cache[key] = this._makeKey([], 'list');
    }

    let v = this._getKey(key);
    v.splice(0, 0, value);
    this._setKey(key, v);
    retVal = v.length;
    return retVal;
  }

  lpushx(key, value) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true);
      let v = this._getKey(key);
      v.splice(0, 0, value);
      this._setKey(key, v);
      retVal = v.length;
    }

    return retVal;
  }

  lrange(key, start, stop) {
    let retVal = [];
    if (this._hasKey(key)) {
      this._testType(key, 'list', true);
      let v = this._getKey(key);
      let length = v.length;
      if (stop < 0) { stop = length + stop; }
      if (start < 0) { start = length + start; }
      if (start < 0) { start = 0; }
      if (stop >= 0 && stop >= start) {
        let size = stop - start + 1;
        for (let itr = start; itr < size; itr++) {
          retVal.push(v[itr]);
        }
      }
    }
    return retVal;
  }

  lrem(key, count, value) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true);
      let v = this._getKey(key);
      let length = v.lenth;
      let dir = (count < 0) ? -1 : 1;
      let count = Math.abs(count);
      count = (count === 0) ? length : count;
      let pos = (dir < 0) ? count : 0;
      let itr = 0;

      while (itr < count && (pos < length || pos >= 0))
      {
        if (v[pos] == value) {
          v.splice(pos, 1);
          retVal++;
          itr++;
        }
        pos += dir;
      }
      this._setKey(key, v);
    }

    return retVal;
  }

  lset(key, index, value) {
    if (this._hasKey(key)) {
      this._testType(key, 'list', true);
      let v = this._getKey(key);
      index = parseInt(index);
      if (index === NaN) {
        throw new Error(messages.noint);
      }
      if (index < 0 || index >= v.length) {
        throw new Error(messages.indexOutOfRange);
      }
      v[index] = value;
      this._setKey(key, v);
    } else {
      throw new Error(messages.nokey);
    }

    return messages.ok;
  }

  ltrim(key, start, stop) {
    let retVal = [];
    if (this._hasKey(key)) {
      this._testType(key, 'list', true);
      let v = this._getKey(key);
      let length = v.length;
      if (stop < 0) { stop = length + stop; }
      if (start < 0) { start = length + start; }
      if (start < 0 || start >= length) {
        throw new Error(messages.indexOutOfRange);
      }
      console.log(`${start} => ${stop} :: ${length}`);
      if (stop >= 0 && stop >= start) {
        // Left Trim
        for (let itr = 0; itr < start; itr++) {
          v.shift();
        }
        // Right Trim
        for (let itr = stop + 1; itr < length; itr++) {
          v.pop();
        }
        this._setKey(key, v);
      }
    }

    return messages.ok;
  }

  rpop(key) {
    let retVal = null;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true);
      v = this._getKey(key);
      retVal = v.pop();
      this._setKey(key, v);
    }

    return retVal;
  }

  rpoplpush(sourcekey, destkey) {
    let retVal = this.rpop(sourcekey);
    if (retVal !== null) {
      this.lpush(destkey, retVal);
    }

    return retVal;
  }

  rpush(key, value) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true);
    } else {
      this.cache[key] = this._makeKey([], 'list');
    }

    let v = this._getKey(key);
    v.push(value);
    this._setKey(key, v);
    retVal = v.length;
    return retVal;
  }

  rpushx(key, value) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'list', true);
      let v = this._getKey(key);
      v.push(value);
      this._setKey(key, v);
      retVal = v.length;
    }

    return retVal;
  }

  // ---------------------------------------
  // Pub /Sub
  // ---------------------------------------
  psubscribe() {}
  pubsub() {}
  publish() {}
  punsubscribe() {}
  suscribe() {}
  unsubscribe() {}

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

  bgsave() {
    this.lastSave = Date.now();
    return messages.ok;
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

  dbsize() {
    return Object.keys(this.cache).length;
  }

  debug(command, ...params) {
    switch(command) {
      default:
        this._unsupported();
        break;
    }
  }

  flushall() {
    this.currentDBIndex = 0
    delete this.cache;
    delete this.databases;
    this.databases = Object.assign({});
    this.databases[this.currentDBIndex] = Object.assign({});
    this.cache = this.databases[this.currentDBIndex];

    return messages.ok;
  }

  flushall_async() {
    this.flushall();
  }

  flushdb() {
    delete this.cache;
    delete this.databases[this.currentDBIndex];
    this.databases[this.currentDBIndex] = Object.assign({});
    this.cache = this.databases[this.currentDBIndex];

    return messages.ok;
  }

  info(section) {
    return '';
  }

  lastsave() {
    return this.lastSave;
  }

  monitor() {
    this._unsupported();
  }

  role() {
    return ['master', 0, null];
  }

  save() {
    this.lastSave = Date.now();
    return messages.ok;
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

  time() {
    const retVal = [];
    let now = Date.now();
    let rawSeconds = now / 1000;
    let seconds = Math.floor(rawSeconds);
    let micro = Math.floor((rawSeconds - seconds) * 1000000);
    retVal.push(seconds);
    retVal.push(micro);

    return retVal;
  }

  // ---------------------------------------
  // ## Sets (Unique Lists)##
  // ---------------------------------------
  sadd(key, ...members) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'set', true);
    } else {
      this.cache[key] = this._makeKey([], 'set');
    }
    let v = this._getKey(key);
    let length = v.length;
    let nv = __.union(v, members);
    let newlength = nv.length;
    retVal = newlength - length;
    this._setKey(key, nv);

    return retVal;
  }

  scard() {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'set', true);
      retVal = this._getKey(key).length;
    }
    return retVal;
  }

  sdiff(key, ...keys) {
    let retVal = [];
    if (this._hasKey(key)) {
      this._testType(key, 'set', true);
      retVal = this._getKey(key);
    }

    if (retVal.length !== 0) {
      for (let idx in keys) {
        if (keys.hasOwnProperty(idx)) {
          diffkey = keys[idx];
          let diffval = [];
          if (this._hasKey(diffkey)) {
            this._testType(diffkey, 'set', true);
            diffval = this._getKey(diffkey);
          }
          retVal = __.difference(retVal, diffval);
        }
      }
    }

    return retVal;
  }

  sdiffstore(destkey, key, ...keys) {
    let retset = this.sdiff(key, keys);
    this.cache[destkey] = this._makeKey(retset, 'set');
    return retset.length;
  }

  sinter(key, ...keys) {
    let retVal = [];
    if (this._hasKey(key)) {
      this._testType(key, 'set', true);
      retVal = this._getKey(key);
    }

    if (retVal.length !== 0) {
      for (let idx in keys) {
        if (keys.hasOwnProperty(idx)) {
          diffkey = keys[idx];
          let diffval = [];
          if (this._hasKey(diffkey)) {
            this._testType(diffkey, 'set', true);
            diffval = this._getKey(diffkey);
          }
          retVal = __.intersection(retVal, diffval);
        }
      }
    }

    return retVal;
  }

  sinterstore(destkey, key, ...keys) {
    let retset = this.sinter(key, keys);
    this.cache[destkey] = this._makeKey(retset, 'set');
    return retset.length;
  }

  sismember(key, member) {
    let retVal = 0;
    if (this._hasKey(key)) {
      this._testType(key, 'set', true);
      let v = this._getKey(key);
      if (v.includes(member)) {
        retVal = 1;
      }
    }

    return retVal;
  }

  smembers(key) {
    let retVal = [];
    if (this._hasKey(key)) {
      this._testType(key, 'set', true);
      retVal = this._getKey(key);
    }
    return retVal;
  }

  smove(sourcekey, destkey, member) {
    let retVal = 0;
    if (this._hasKey(sourcekey)) {
      this._testType(sourcekey, 'set', true);
      let v = this._getKey(sourcekey);
      let idx = v.findIndex(member);
      if (idx !== -1) {
        this.sadd(destkey, member);
        v.splice(idx, 1);
        retVal = 1;
      }
    }
    return retVal;
  }

  spop(key, count) {
    let retVal = [];
    count = count || 1;
    count = parseInt(count);
    if (count === NaN) {
      throw new Error(messages.noint);
    }

    if (this._hasKey(key)) {
      this._testType(key, 'set', true);
      let v = this._getKey(key);
      let length = v.length;
      count = (count > length) ? length : count;
      for (let itr = 0; itr < count; itr++) {
        retVal.push(v.pop());
      }
    }

    return retVal;
  }

  srandmember(key, count) {
    let retVal = [];
    let nullBehavior = __.hasValue(count);
    count = count || 1;
    count = parseInt(count);
    if (count === NaN) {
      throw new Error(messages.noint);
    }

    let uniqueBehavior = (count >= 0);
    if (!uniqueBehavior) { count = -count; }

    if (this._hasKey(key)) {
      this._testType(key, 'set', true);
      let v = this._getKey(key);
      let length = v.length;
      if (uniqueBehavior) {
        for (let itr = 0; (itr < count && itr < length); itr++) {
          retVal.push(v[itr]);
        }
      } else {
        for (let itr = 0; itr < count; itr++) {
          retVal.push(v[this.randInt(0, length-1)]);
        }
      }
    } else {
      if (nullBehavior) { retVal = null; }
    }

    return retVal;
  }

  srem(key, ...members) {
    let retVal = 0;
    if (this._hasKey(sourcekey)) {
      this._testType(sourcekey, 'set', true);
      let v = this._getKey(sourcekey);
      for (var idx in members) {
        if (members.hasOwnProperty(idx)) {
          let member = members[idx];
          let idx = v.findIndex(member);
          if (idx !== -1) {
            v.splice(idx, 1);
            retVal++;
          }
        }
      }
      this._setKey(key, v);
    }
    return retVal;
  }

  sscan(...params) {
    this._unsupported();
  }

  sunion(key, ...keys) {
    let retVal = [];
    if (this._hasKey(key)) {
      this._testType(key, 'set', true);
      retVal = this._getKey(key);
    }

    if (retVal.length !== 0) {
      for (let idx in keys) {
        if (keys.hasOwnProperty(idx)) {
          diffkey = keys[idx];
          let diffval = [];
          if (this._hasKey(diffkey)) {
            this._testType(diffkey, 'set', true);
            diffval = this._getKey(diffkey);
          }
          retVal = __.union(retVal, diffval);
        }
      }
    }

    return retVal;
  }

  sunionstore(destkey, key, ...keys) {
    let retset = this.sunion(key, keys);
    this.cache[destkey] = this._makeKey(retset, 'set');
    return retset.length;
  }

  // ---------------------------------------
  // ## Sorted Sets ##
  // ---------------------------------------

  zadd() {}
  zcard() {}
  zcount() {}
  zincrby() {}
  zinterstore() {}
  zlexcount() {}
  zrange() {}
  zrangebylex() {}
  zrevrangebylex() {}
  zrangebyscore() {}
  zrank() {}
  zrem() {}
  zremrangebylex() {}
  zremrangebyrank() {}
  zremrangebyscore() {}
  zrevrange() {}
  zrevrangebyscore() {}
  zrevrank() {}
  zscore() {}
  zunionstore() {}
  zscan() {}

  // ---------------------------------------
  // ## String Oprations ##
  // ---------------------------------------
  append(key, value) {
    let retValue = value.length || 0;
    let keyValue = '';
    if (this._hasKey(key)) {
      this._testType(key, 'string', true);
      keyValue = this._getKey(key);
    } else {
      this.cache[key] = this._makeKey('', 'string');
    }
    this._setKey(key, `${keyValue}${value}`);
    return retValue;
  }

  bitcount(key, start, end) {
    let retValue = 0;
    let keyValue = '';
    if (this._hasKey(key)) {
      this._testType(key, 'string', true);
      keyValue = this._getKey(key);
    }
    for (let itr = 0; itr < keyValue.length; itr++) {
      let val = keyValue.charCodeAt(itr);
      for (let jtr = 0; jtr < 16; jtr++) {
        retValue += (val & 1);
        val >>= 1;
      }
    }
    return retValue;
  }

  bitfield(...params) {
    this._unsupported();
  }

  bitop(operation, destkey, ...srckeys) {
    let retVal = 0;
    let setVal = null;
    if (srckeys.length < 1) { throw new Error(messages.wrongArgCount.replace('%0','bitop')); }
    operation = operation.toLowerCase();
    let keys = this.mget(srckeys);

    switch (opertaion) {
      case 'and':
      case 'or':
      case 'xor':
        setVal = _strbit(opertaion, keys);
        retVal = setVal.length;
        break;
      case 'not':
        if (srckeys.legnth > 1) { throw new Error(messages.bitopnotWrongCount); }
        setVal = _strnot(keys[0]);
        retVal = setVal.length;
        break;
      default:
        throw new Error(messages.syntax);
        break;
    }

    this.set(destkey, setVal);
    return retVal;
  }

  bitpos(key, bit, start, end) {
    this._unsupported();
  }

  decr(key) {
    return this._addToKey(key, -1);
  }

  decrby(key, amount) {
    return this._addToKey(key, -amount);
  }

  get(key) {
    let retVal = null;
    if (this._hasKey(key)) {
      this._testType(key, 'string', true);
      retVal = this._getKey(key);
    }
    return retVal;
  }

  getbit(key, offset) {
    let keyValue;
    let retVal = 0;
    const byteoffset = Math.floor(offset / 16);
    const bitoffset = offset % 16;
    keyValue = this.get(key) || '';
    if (byteoffset > keyValue.length) {
      return retVal;
    }
    const val = keyValue.charCodeAt(byteoffset);
    while (bitoffset > 0) {
      val >>= 1;
      bitoffset--;
    }
    retVal = (val & 1);
    return retVal;
  }

  getrange(key, start, end) {
    const len = end - start + 1;
    let val = this.get(key);
    let retVal = val.substr(start, len);
    return retVal;
  }

  getset(key, value) {
    const retVal = this.get(key);
    this.set(key, value);
    return retVal;
  }

  incr(key) {
    return this._addToKey(key, 1);
  }

  incrby(key, amount) {
    return this._addToKey(key, amount);
  }

  incrbyfloat(key, amount) {
    let keyValue = '0.0';
    if (this._hasKey(key)) {
      this._testType(key, 'string', true);
      keyValue = parseFloat(this._getKey(key));
      if (keyValue === NaN || __.isUnset(keyValue)) {
        throw new Error(messages.nofloat);
      }
    } else {
      this.cache[key] = this._makeKey('0.0', 'string');
    }
    let val = (keyValue + amount);
    this._setKey(key, val.toString());
    return val;
  }

  mget(...keys) {
    const keyVals = [];
    for (let c = 0; c < keys.length; c++) {
      const key = keys[c];
      let val = null;
      if (this._hasKey(key)) {
        if (this._testType(key, 'string')) {
          val = this._getKey(key);
        }
      }
      keyVals.push(val);
    }
    return keyVals;
  }

  mset(...params) {
    // params should have key and value pairs and should be even in length
    if ((params.legnth % 2) !== 0)
    {
      throw new Error(messages.wrongArgCount.replace('%0', 'mset'));
    }
    const pairs = params.length / 2;
    for (let itr = 0; itr < pairs; itr++) {
      let key = param[itr * 2];
      let value = param[(itr * 2) + 1];
      this.cache[key] = this._makeKey(value, 'string');
    }
    return messages.ok;
  }

  msetnx(...params) {
    let retVal = 0;

    // params should have key and value pairs and should be even in length
    if ((params.legnth % 2) !== 0)
    {
      throw new Error(messages.wrongArgCount.replace('%0', 'msetnx'));
    }
    const pairs = params.length / 2;
    for (let itr = 0; itr < pairs; itr++) {
      let key = param[itr * 2];
      let value = param[(itr * 2) + 1];
      // Only set the value if they do not exist
      if (!this._hasKey(key)) {
        this.cache[key] = this._makeKey(value, 'string');
        retVal = 1;
      }
    }

    return retVal;
  }

  psetex(key, pttl, value) {
    return this.set(key, value, null, pttl, null, true);
  }

  set(key, value, ttl, pttl, notexist, onlyexist) {
    let retVal = null;
    pttl = pttl || (ttl * 1000) || null;
    if (__.hasValue(ttl) && __.hasValue(pttl)) {
      throw new Error(messages.syntax);
    }
    if (this._hasKey(key)) {
      this._testType(key, 'string', true);
      if (notexist) {
        return retVal;
      }
    } else {
      if (onlyexist) {
        return retVal;
      }
    }
    this.cache[key] = this._makeKey(value, 'string', pttl);

    return messages.ok;
  }

  setbit(key, offset, value) {
    value &= 1;
    const byteoffset = Math.floor(offset / 16);
    const bitoffset = offset % 16;
    const getVal = this.get(key);

    let bitmask = 1;

    // Create bitmask
    for (let itr = 0; itr < bitoffset; itr++) {
      // Shift Left the bitmask to get the bit into the correct position
      bitmask <<= 1;
    }

    // Zero-pad the string value (+1 offset length for the current bit to set)
    if (__.hasValue(getVal)) {
      getVal = __.padEnd(getVal, byteoffset + 1, '\u0000');
    } else {
      getVal = __.padEnd('', byteoffset + 1, '\u0000');
    }

    let code = getVal.charCodeAt(byteoffset);
    if (value == 0) {
      // Clear the specified bit
      code &= ~bitmask;
    } else {
      // Set the specified bit
      code |= bitmask;
    }
    getVal[byteoffset] = Buffer.from([ code ]).toString();

    this.set(key, getVal);
  }

  setex(key, ttl, value) {
    return this.set(key, value, ttl, null, null, true);
  }

  setnx(key, value) {
    return this.set(key, value, null, null, true);
  }

  setrange(key, offset, value) {
    let beginning = '';
    let end = '';
    const getVal = this.get(key);
    if (__.hasValue(getVal)) {
      let fullStr = __.padEnd(getVal, offset, '\u0000');
      beginning = fullStr.substr(0, offset);
      end = fullStr.substr(offset + value.length);
    } else {
      // Pad the string with null characters
      beginning = __.padEnd('', offset, '\u0000');
    }
    const retVal = `${beginning}${value}${end}`;
    this.set(key, retVal);
    return retVal.length;
  }

  strlen(key) {
    const getVal = this.get(key);
    if (__.hasValue(getVal)) {
      return getVal.length;
    }
    return 0;
  }

  // ---------------------------------------
  // ## Transactions (Atomic) ##
  // ---------------------------------------
  // TODO: Transaction Queues and retrofitting all the methods so that they can be used when in "multi" mode
  // https://redis.io/topics/transactions
  discard() {
    // Clear the queue mode, drain the queue, empty the watch list
    this._unsupported();
  }

  exec() {
    // Run the queue and clear queue mode
    this._unsupported();
  }

  multi() {
    // Set Queue mode active
    this._unsupported();
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
    if (this.option.bypassUnsupported) {
      return;
    }
    throw new Error(messages.unsupported);
  }

  _createRegExpGlob(pattern) {
    pattern = pattern.replace(/\./,"\.");
    pattern = pattern.replace(/\\/,"\\");
    pattern = pattern.replace(/\?/,".?");
    pattern = pattern.replace(/\*/,".*");
    return new RegExp(`^${pattern}`);
  }

  _randInt(min, max) {
    min = Math.ceil(min || 0);
    max = Math.floor(max || 1);
    return Math.round(Math.random() * (max - min)) + min;
  }

  _testType(key, type, throwError) {
    throwError = throwError || false;
    if (this.type(key) !== type) {
      if (throwError) { throw new Error(messages.wrongTypeOp); }
      return false;
    }
    return true;
  }

  // ---------------------------------------
  // ## Internal - Key ##
  // ---------------------------------------
  _hasKey(key) {
    return this.cache.hasOwnProperty(key);
  }

  _makeKey(value, type, timeout) {
    return {
      value: value,
      type: type,
      timeout: timeout || null,
      lastAccess: Date.now()
    };
  }

  _key(key) {
    this.cache[key].lastAccess = Date.now();
    return this.cache[key];
  }

  // ---------------------------------------
  // ## Internal - Hash ##
  // ---------------------------------------
  _addToField(key, field, amount, usefloat) {
    useFloat = useFloat || false;
    let fieldValue = (useFloat) ? '0.0' : '0';
    if (this._hasKey(key)) {
      this._testType(key, 'hash', true);
      let value = 0;
      if (this._hasField(key, field)) {
        value = this._getField(key, field);
      }
      fieldValue = (useFloat) ? parseFloat(value) : parseInt(value);
      if (fieldValue === NaN || __.isUnset(keyValue)) {
        throw new Error(useFloat ? messages.nofloat : messages.noint);
      }
    } else {
      this.cache[key] = this._makeKey({}, 'hash');
    }

    fieldValue += amount;
    this._setField(key,field, fieldValue.toString());
    return fieldValue;
  }

  _getField(key, field) {
    return this._getKey(key)[field];
  }

  _hasField(key, field) {
    return this._getKey(key).hasOwnProperty(field);
  }

  _setField(key, field, value) {
    this._getKey(key)[field] = value;
  }

  // ---------------------------------------
  // ## Internal - String ##
  // ---------------------------------------
  _addToKey(key, amount) {
    let keyValue = '0';
    if (this._hasKey(key)) {
      this._testType(key, 'string', true);
      keyValue = parseInt(this._getKey(key));
      if (keyValue === NaN || __.isUnset(keyValue)) {
        throw new Error(messages.noint);
      }
    } else {
      this.cache[key] = this._makeKey('0', 'string');
    }
    let val = (keyValue + amount);
    this._setKey(key, val.toString());
    return val;
  }

  _strnot(value) {
    let retVal = value;
    const bytes = [];
    for (let itr = 0; itr < value.length; itr++) {
      let code = retVal.charCodeAt(itr);
      bytes.push(code ^ 0xFFFF);
    }
    return Buffer.from(bytes).toString();
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
      for (let jtr = 0; jtr < next.legnth; jtr++) {
        let destCode = retVal.charCodeAt(jtr);
        let srcCode = next.charCodeAt(jtr);
        switch (op) {
          case 'and':
            bytes.push(destCode & srcCode);
            break;
          case 'or':
            bytes.push(destCode | srcCode);
            break;
          case 'xor':
            bytes.push(destCode ^ srcCode);
            break;
          default:
            bytes.push(destCode);
            break
        }
      }
      retVal = Buffer.from(bytes).toString();
    }
    return retVal;
  }

  _getKey(key) {
    let _key =  this._key(key) || {};
    if (_key.timeout && _key.timeout >= Date.now()) {
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
let keys = Object.getOwnPropertyNames(MemoryCache.prototype);
for (var idx in keys) {
  key = keys[idx];
  if (key !== 'constructor' && key.indexOf('_') !== 0) {
    // Add uppercase variant
    MemoryCache.prototype[key.toUpperCase()] = MemoryCache.prototype[key];
  }
}

module.exports = MemoryCache;
