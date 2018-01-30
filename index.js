// validation-helper.js

const __ = require('@mediaxpost/lodashext');

const messages = {
  ok: 'OK',
  pong: 'PONG',
  noint: 'ERR value is not an integer or out of range',
  nokey: 'ERR no such key',
  busykey: 'ERR target key name is busy',
  syntax: 'ERR syntax error',
  unsupported: 'MemoryCache does not support that operation',
  wrongTypeOp: 'WRONGTYPE Operation against a key holding the wrong kind of value',
  wrongPayload: 'DUMP payload version or checksum are wrong'
};

class MemoryCache {
  constructor(options) {
    this.cache = Object.create(null);
    this.hitCount = 0;
    this.missCount = 0;
    this.size = 0;
    this.isConnected = false;
    this.options = __.merge(Object.assign({
      debug: false,
      bypassUnsupported: false
    }), options || {});
  }

  // ---------------------------------------
  // Connection
  // ---------------------------------------
  connect() {
    this.isConnected = true;
    return this;
  }

  quit() {
    this.isConnected = false;
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
    return message.ok;
  }

  select(dbIndex) {
    return message.ok
  }

  // ---------------------------------------
  // Keys
  // ---------------------------------------
  del(...keys) {
    let keyCount = 0;
    for (let c = 0; c < keys.length; c++) {
      const key = keys[c];
      if (this.cache.hasOwnProperty(key)) {
        this.size--;
        delete this.cache[key];
        keyCount++;
      }
    }
    return keyCount;
  }

  dump(key) {
    if (this.cache.hasOwnProperty(key)) {
      return JSON.stringify(this.cache[key]);
    }
    return null;
  }

  exists(...keys) {
    let existCount = 0;
    for (let c = 0; c < keys.length; c++) {
      const key = keys[c];
      if (this.cache.hasOwnProperty(key)) { existCount++; }
    }
    return existCount;
  }

  expire(key, seconds) {
    let retVal = 0;
    if (this.cache.hasOwnProperty(key)) {
      this.cache[c].timeout = Date.now() + (parseInt(seconds) * 1000);
      retVal = 1;
    }
    return retVal;
  }

  expireat(key, timestamp) {
    let retVal = 0;
    if (parseInt(timestamp).toString().length <= 11) {
      timestamp = parseInt(timestamp) * 1000;
    }
    if (this.cache.hasOwnProperty(key)) {
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
      if (this.cache.hasOwnProperty(key)) {
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
    if (this.cache.hasOwnProperty(key)) {
      if (__.hasValue(this.cache[c].timeout) {
        this.cache[c].timeout = null;
        retVal = 1;
      }
    }
    return retVal;
  }

  pexpire(key, milliseconds) {
    let retVal = 0;
    if (this.cache.hasOwnProperty(key)) {
      this.cache[c].timeout = Date.now() + (parseInt(milliseconds));
      retVal = 1;
    }
    return retVal;
  }

  pexpireat(key, timestamp) {
    return this.expireat(key, timestamp);
  }

  pttl(key) {
    let retVal = -2;
    if (this.cache.hasOwnProperty(key)) {
      if (__.hasValue(this.cache[c].timeout) {
        retVal = this.cache[c].timeout - Date.now();
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
    if (this.cache.hasOwnProperty(key)) {
      this.cache[newkey] = Object.assign(this.cache[key]);
      delete this.cache[key];
      return messages.ok;
    }
    throw new Error(messages.nokey);
  }

  renamenx(key, newkey) {
    let retVal = 0;
    if (this.cache.hasOwnProperty(key)) {
      if (!this.cache.hasOwnProperty(newkey)) {
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
    if (this.cache.hasOwnProperty(key) && !replace) {
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
      if (this.cache.hasOwnProperty(key)) {
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
    if (this.cache.hasOwnProperty(key)) {
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
  // ## String Oprations ##
  // ---------------------------------------
  append(key, value) {
    let retValue = value.length || 0;
    let keyValue = '';
    if (this.cache.hasOwnProperty(key)) {
      if (this.type(key) !== 'string') {
        throw new Error(messages.wrongTypeOp);
      }
      keyValue = this.cache[key].value;
    } else {
      this.cache[key] = this._makeKey('', 'string');
    }
    this.cache[key].value = `${keyValue}${value}`;
    return retValue;
  }

  bitcount(key, start, end) {
    let retValue = 0;
    let keyValue = '';
    if (this.cache.hasOwnProperty(key)) {
      if (this.type(key) !== 'string') {
        throw new Error(messages.wrongTypeOp);
      }
      keyValue = this.cache[key].value;
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
    this._unsupported();
  }

  bitpos(key, bit, start, end) {
    this._unsupported();
  }

  _addToKey(key, amount) {
    let keyValue = '0';
    if (this.cache.hasOwnProperty(key)) {
      if (this.type(key) !== 'string') {
        throw new Error(messages.wrongTypeOp);
      }
      keyValue = parseInt(this.cache[key].value);
      if (keyValue === NaN || __.isUnset(keyValue)) {
        throw new Error(messages.noint);
      }
    } else {
      this.cache[key] = this._makeKey('0', 'string');
    }
    let val = (keyValue + amount);
    this.cache[key].value = val.toString();
    return val;
  }

  decr(key) {
    return this._addToKey(key, -1);
  }

  decrby(key, amount) {
    return this._addToKey(key, -amount);
  }

  get(key) {
    let retVal = null;
    if (this.cache.hasOwnProperty(key)) {
      if (this.type(key) !== 'string') {
        throw new Error(messages.wrongTypeOp);
      }
      retVal = this.cache[key].value;
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
    if (this.cache.hasOwnProperty(key)) {
      if (this.type(key) !== 'string') {
        throw new Error(messages.wrongTypeOp);
      }
      keyValue = parseFloat(this.cache[key].value);
      if (keyValue === NaN || __.isUnset(keyValue)) {
        throw new Error(messages.noint);
      }
    } else {
      this.cache[key] = this._makeKey('0.0', 'string');
    }
    let val = (keyValue - amount);
    this.cache[key].value = val.toString();
    return val;
  }

  mget(key) {

  }

  mset(key) {

  }

  msetnx(...keys) {

  }

  psetex(key, value, pttl) {

  }

  set(key, value, ttl, pttl, notexist, onlyexist) {
    let retVal = null;
    pttl = pttl || (ttl * 1000) || null;
    if (__.hasValue(ttl) && __.hasValue(pttl)) {
      throw new Error(messages.syntax);
    }
    if (this.cache.hasOwnProperty(key)) {
      if (this.type(key) !== 'string') {
        throw new Error(messages.wrongTypeOp);
      }
      if (notexist) {
        return retVal;
      }
    } else {
      if (onlyexist) {
        return retVal;
      }
    }
    this.cache[key] = this._makeKey(value, 'string', pttl);
  }

  hget() {}
  hgetall() {}
  hset() {}
  hdel() {}

  flushdb() {}


  dbsize() {}

  // ---------------------------------------
  // ## Internal ##
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

  _makeKey(value, type, timeout) {
    return {
      value: value,
      type: type,
      timeout: timeout || null,
      lastAccess: Date.now()
    };
  }
}

module.exports = MemoryCache;
