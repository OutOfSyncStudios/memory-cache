// test/index.js

/* eslint id-length: warn */

const chai = require('chai');
const lolex = require('lolex');
const expect = chai.expect;
// Dependencies
const MemoryCache = require('../');
const MemoryCacheError = require('../').MemoryCacheError;

describe('Memory Cache', () => {
  let client;
  before((done) => {
    client = new MemoryCache({ bypassUnsupported: false });
    done();
  });

  it('constructor', () => {
    expect(client).to.be.instanceof(MemoryCache);
  });

  describe('Core', () => {
    it('createClient', (done) => {
      client.once('ready', () => {
        expect(client.connected).to.equal(true);
        done();
      });
      client.createClient();
    });

    it('auth', () => {
      expect(client.auth('password')).to.equal('OK');
    });

    it('auth with callback', (done) => {
      client.auth('password', (err, res) => {
        expect(res).to.equal('OK');
        done();
      });
    });

    it('echo', () => {
      expect(client.echo('message')).to.equal('message');
    });

    it('echo with callback', (done) => {
      client.echo('message', (err, res) => {
        expect(res).to.equal('message');
        done();
      });
    });

    it('ping', () => {
      expect(client.ping('message')).to.equal('message');
    });

    it('ping (no message)', () => {
      expect(client.ping()).to.equal('PONG');
    });

    it('ping with callback', (done) => {
      client.ping('message', (err, res) => {
        expect(res).to.equal('message');
        done();
      });
    });

    it('quit', (done) => {
      client.once('end', () => {
        expect(client.connected).to.equal(false);
        done();
      });
      client.quit();
    });

    it('end', (done) => {
      client.createClient();
      client.once('end', () => {
        expect(client.connected).to.equal(false);
        done();
      });
      client.end();
    });
  });

  describe('Hash', () => {
    before(() => {
      client.createClient();
    });

    it('hset (non-existing)', () => {
      const val = client.hset('testkey', 'testfield', 1);
      expect(val).to.equal(1);
    });

    it('hset (existing)', () => {
      const val = client.hset('testkey', 'testfield', 2);
      expect(val).to.equal(0);
    });

    it('hset with callback', (done) => {
      client.hset('testkey', 'testfield2', 1, (err, res) => {
        expect(res).to.equal(1);
        done();
      });
    });

    it('hsetnx (non-existing key)', () => {
      const val = client.hsetnx('testkeyA', 'testfield', 0);
      expect(val).to.equal(1);
    });

    it('hsetnx (non-existing field)', () => {
      const val = client.hsetnx('testkey', 'testfield3', 0);
      expect(val).to.equal(1);
    });

    it('hsetnx (existing)', () => {
      const val = client.hsetnx('testkey', 'testfield3', 'm1');
      expect(val).to.equal(0);
    });

    it('hsetnx with callback', (done) => {
      client.hsetnx('testkey', 'testfield4', 'shit', (err, res) => {
        expect(res).to.equal(1);
        done();
      });
    });

    it('hget (non-existing)', () => {
      const val = client.hget('testkey', 'testfield5');
      expect(val).to.be.equal(null);
    });

    it('hget (existing)', () => {
      const val = client.hget('testkey', 'testfield3');
      expect(val).to.be.equal('0');
    });

    it('hget with callback', (done) => {
      client.hget('testkey', 'testfield4', (err, res) => {
        expect(res).to.be.equal('shit');
        done();
      });
    });

    it('hdel (non-existing)', () => {
      const val = client.hdel('testkey', 'testfield5');
      expect(val).to.be.equal(0);
    });

    it('hdel (existing)', () => {
      const val = client.hdel('testkey', 'testfield');
      expect(val).to.be.equal(1);
    });

    it('hdel with multi-callback', (done) => {
      client.hset('testkey', 'multi1', 1);
      client.hset('testkey', 'multi2', 1);
      client.hset('testkey', 'multi3', 1);
      client.hdel('testkey', 'multi1', 'multi2', 'multi3', (err, res) => {
        expect(res).to.be.equal(3);
        done();
      });
    });

    it('hexists (non-existing)', () => {
      const val = client.hexists('testkey', 'testfield5');
      expect(val).to.be.equal(0);
    });

    it('hexists (existing)', () => {
      const val = client.hexists('testkey', 'testfield3');
      expect(val).to.be.equal(1);
    });

    it('hexists with callback', (done) => {
      client.hexists('testkey', 'testfield4', (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('hgetall', () => {
      const val = client.hgetall('testkey');
      expect(val).to.be.instanceof(Object);
      expect(Object.keys(val).includes('testfield2')).to.be.equal(true);
      expect(Object.keys(val).includes('testfield3')).to.be.equal(true);
      expect(Object.keys(val).includes('testfield4')).to.be.equal(true);
      expect(val.testfield2).to.be.equal('1');
      expect(val.testfield4).to.be.equal('shit');
    });

    it('hgetall with callback', (done) => {
      client.hgetall('testkey', (err, res) => {
        expect(res).to.be.instanceof(Object);
        expect(Object.keys(res).includes('testfield2')).to.be.equal(true);
        expect(Object.keys(res).includes('testfield3')).to.be.equal(true);
        expect(Object.keys(res).includes('testfield4')).to.be.equal(true);
        expect(res.testfield2).to.be.equal('1');
        expect(res.testfield4).to.be.equal('shit');
        done();
      });
    });

    it('hincrby (bad key/field)', () => {
      let testfn = () => { client.hincrby('testkey', 'testfield4', '12'); }
      expect(testfn).to.throw('integer');
    });

    it('hincrby (bad value)', () => {
      let testfn = () => { client.hincrby('testkey', 'no-exist', 'fwq'); }
      expect(testfn).to.throw('integer');
    });

    it('hincrby (non-existing key)', () => {
      const val = client.hincrby('testkeyalpha', 'non-exist', '12');
      expect(val).to.be.equal(12);
      client.del('testkeyalpha');
    });

    it('hincrby (non-existing field)', () => {
      const val = client.hincrby('testkey', 'non-exist', '12');
      expect(val).to.be.equal(12);
      client.hdel('testkey', 'no-exist');
    });

    it('hincrby (existing)', () => {
      const val = client.hincrby('testkey', 'testfield2', '12');
      expect(val).to.be.equal(13);
    });

    it('hincrby with callback', (done) => {
      client.hincrby('testkey', 'testfield2', '12', (err, res) => {
        expect(res).to.be.equal(25);
        done();
      });
    });

    it('hincrbyfloat (bad value)', () => {
      let testfn = () => { client.hincrbyfloat('testkey', 'no-exist', 'fwq'); }
      expect(testfn).to.throw('float');
    });

    it('hincrbyfloat (bad key/field)', () => {
      let testfn = () => { client.hincrbyfloat('testkey', 'testfield4', '1.5'); }
      expect(testfn).to.throw('float');
    });

    it('hincrbyfloat (non-existing)', () => {
      const val = client.hincrbyfloat('testkey', 'no-exist', '3.14');
      expect(val).to.be.equal(3.14);
      client.hdel('testkey', 'no-exist');
    });

    it('hincrbyfloat (existing)', () => {
      const val = client.hincrbyfloat('testkey', 'testfield2', '1.5');
      expect(val).to.be.equal(26.5);
    });

    it('hincrbyfloat with callback', (done) => {
      client.hincrbyfloat('testkey', 'testfield2', '-12.1', (err, res) => {
        expect(res).to.be.equal(14.4);
        done();
      });
    });

    it('hkeys', () => {
      const val = client.hkeys('testkey');
      expect(val).to.be.instanceof(Array);
      expect(val).to.include.members(['testfield2', 'testfield3', 'testfield4']);
    });

    it('hkeys with callback', (done) => {
      client.hkeys('testkey', (err, res) => {
        expect(res).to.be.instanceof(Array);
        expect(res).to.include.members(['testfield2', 'testfield3', 'testfield4']);
        done();
      });
    });

    it('hlen', () => {
      const val = client.hlen('testkey');
      expect(val).to.be.equal(4);
    });

    it('hlen with callback', (done) => {
      client.hlen('testkey', (err, res) => {
        expect(res).to.be.equal(4);
        done();
      });
    });

    it('hmget multi-field (non-exist key)', () => {
      const val = client.hmget('testkey2', 'a', 'b', 'c');
      expect(val).to.include.members([null]);
      expect(val.length).to.be.equal(3);
    });

    it('hmget multi-field', () => {
      const val = client.hmget('testkey', 'testfield2', 'testfield4', 'testfield5');
      expect(val).to.include.members(['14.4', 'shit', null]);
      expect(val.indexOf(null)).to.be.equal(2);
    });

    it('hmget multi-field with callback', (done) => {
      client.hmget('testkey', 'testfield2', 'testfield4', 'testfield5', (err, res) => {
        expect(res).to.include.members(['14.4', 'shit', null]);
        expect(res.indexOf(null)).to.be.equal(2);
        done();
      });
    });

    it('hmset (no params)', () => {
      const testfn = () => { client.hmset('testkey2'); }
      expect(testfn).to.throw('wrong number');
    });

    it('hmset (bad param count multi-field object)', () => {
      const testfn = () => { client.hmset('testkey2', { x: '123' }, 'x'); }
      expect(testfn).to.throw('wrong number');
    });

    it('hmset (bad field-value pairs)', () => {
      const testfn = () => { client.hmset('testkey2', 'x', '123', 'r'); }
      expect(testfn).to.throw('wrong number');
    });

    it('hmset multi-field object (non-exist key)', () => {
      const val = client.hmset('testkey2', { a: 'a', b: 'b', c: 'c' });
      expect(val).to.be.equal('OK');
    });

    it('hmset multi-field object (existing key)', () => {
      const val = client.hmset('testkey2', { a: 'z', d: 'd' });
      expect(val).to.be.equal('OK');
    });

    it('hmset multi-field object with callback', (done) => {
      client.hmset('testkey2', { e: 'e', f: '1234' }, (err, res) => {
        expect(res).to.be.equal('OK');
        done();
      });
    });

    it('hmset field-value pairs', () => {
      const val = client.hmset('testkey2', 'q', '123', 'r', '987');
      expect(val).to.be.equal('OK');
    });

    it('hmset field-value pairs with callback', (done) => {
      client.hmset('testkey2', 'x', 'v', 'y', 'w', (err, res) => {
        expect(res).to.be.equal('OK');
        done();
      });
    });

    it('hmgetall results from hmset', () => {
      const val = client.hkeys('testkey2');
      expect(val).to.include.members(['a', 'b', 'c', 'd', 'e', 'f', 'q', 'r', 'x', 'y']);
      const val2 = client.hvals('testkey2');
      expect(val2).to.include.members(['z', 'b', 'c', 'd', 'e', '1234', '123', '987', 'v', 'w']);
    });

    it('hstrlen (non-existing)', () => {
      const val = client.hstrlen('testkey', 'testfield5');
      expect(val).to.be.equal(0);
    });

    it('hstrlen (existing)', () => {
      const test = client.hstrlen('testkey', 'testfield3');
      expect(test).to.be.equal(1);
    });

    it('hstrlen with callback', (done) => {
      client.hstrlen('testkey', 'testfield4', (err, res) => {
        expect(res).to.be.equal(4);
        done();
      });
    });

    it('hvals', () => {
      const val = client.hvals('testkey');
      expect(val).to.be.instanceof(Array);
      expect(val).to.include.members(['14.4', 'shit', '0']);
    });

    it('hvals with callback', (done) => {
      client.hvals('testkey', (err, res) => {
        expect(res).to.be.instanceof(Array);
        expect(res).to.include.members(['14.4', 'shit', '0']);
        done();
      });
    });
  });

  describe('Key Maintenance', () => {
    let clock;
    before(() => {
      clock = lolex.install();
    });

    after(() => {
      clock.uninstall();
    });

    it('del', () => {
      const val = client.del('testkey2', 'no-exist');
      expect(val).to.be.equal(1);
    });

    it('del with callback', (done) => {
      client.del('no-exist', (err, res) => {
        expect(res).to.be.equal(0);
        done();
      });
    });

    it('dump', () => {
      const val = client.dump('testkey');
      expect(val).to.be.a('string');
      expect(JSON.parse(val)).to.be.an('object');
    });

    it('dump with callback', (done) => {
      client.dump('testkey', (err, res) => {
        expect(res).to.be.a('string');
        expect(JSON.parse(res)).to.be.an('object');
        done();
      });
    });

    it('exists', () => {
      const val = client.exists('no-exists', 'testkey');
      expect(val).to.be.equal(1);
    });

    it('exists with callback', (done) => {
      client.exists('no-exists', 'testkey', (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('expire (non-existing)', () => {
      const val = client.expire('newkey', 1);
      expect(val).to.be.equal(0);
    });

    it('expire (existing)', () => {
      client.hset('newkey', 'val1', 'test');
      let val = client.expire('newkey', 1);
      expect(val).to.be.equal(1);
      clock.tick(1500);
      val = client.hget('newkey', 'val1');
      expect(val).to.be.equal(null);
    });

    it('expire with callback', (done) => {
      client.hset('newkey', 'val1', 'test');
      client.expire('newkey', 1, (err, res) => {
        expect(res).to.be.equal(1);
        clock.tick(1500);
        const val = client.hget('newkey', 'val1');
        expect(val).to.be.equal(null);
        done();
      });
    });

    it('expireat (non-existing)', () => {
      const val = client.expireat('newkey', 4500);
      expect(val).to.be.equal(0);
    });

    it('expireat (existing)', () => {
      client.hset('newkey', 'val1', 'test');
      let val = client.expireat('newkey', 4);
      expect(val).to.be.equal(1);
      clock.tick(1500);
      val = client.hget('newkey', 'val1');
      expect(val).to.be.equal(null);
    });

    it('expireat with callback', (done) => {
      client.hset('newkey', 'val1', 'test');
      client.expireat('newkey', 5, (err, res) => {
        expect(res).to.be.equal(1);
        clock.tick(1500);
        res = client.hget('newkey', 'val1');
        expect(res).to.be.equal(null);
        done();
      });
    });

    it('keys (no pattern)', () => {
      const val = client.keys();
      expect(val).to.include.members(['testkey']);
    });

    it('keys (no matches)', () => {
      const val = client.keys('nokey*');
      expect(val).to.be.empty;
    });

    it('keys with callback', (done) => {
      client.keys('test*', (err, res) => {
        expect(res).to.include.members(['testkey']);
        done();
      });
    });

    it('move (bad dbindex)', () => {
      const testfn = () => { client.move('test', 'lame'); }
      expect(testfn).to.throw('invalid DB index');
    });

    it('move (non-existing)', () => {
      const val = client.move('test', 1);
      expect(val).to.be.equal(0);
    });

    it('move (existing)', () => {
      client.hset('testkey2', 'val', 1);
      let val = client.move('testkey2', 1);
      expect(val).to.be.equal(1);
      val = client.exists('testkey2');
      expect(val).to.be.equal(0);
    });

    it('move (already existing target)', () => {
      client.hset('testkey2', 'val', 1);
      const val = client.move('testkey2', 1);
      expect(val).to.be.equal(0);
    });

    it('move with callback', (done) => {
      client.hset('testkey3', 'val', 1);
      client.move('testkey3', 1, (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('persist (non-existing)', () => {
      const val = client.persist('newkey');
      expect(val).to.be.equal(0);
    });

    it('persist (existing)', () => {
      client.hset('newkey', 'val1', 'test');
      client.expire('newkey', 1);
      let val = client.persist('newkey');
      expect(val).to.be.equal(1);
      clock.tick(1500);
      val = client.hget('newkey', 'val1');
      expect(val).to.be.equal('test');
    });

    it('persist with callback', (done) => {
      client.expire('newkey', 1);
      client.persist('newkey', (err, res) => {
        expect(res).to.be.equal(1);
        clock.tick(1500);
        const val = client.hget('newkey', 'val1');
        expect(val).to.be.equal('test');
        done();
      });
    });

    it('pexpire (non-existing)', () => {
      const val = client.pexpire('newkey2', 1);
      expect(val).to.be.equal(0);
    });

    it('pexpire (existing)', () => {
      client.hset('newkey', 'val1', 'test');
      let val = client.pexpire('newkey', 1);
      expect(val).to.be.equal(1);
      clock.tick(2);
      val = client.hget('newkey', 'val1');
      expect(val).to.be.equal(null);
    });

    it('pexpire with callback', (done) => {
      client.hset('newkey', 'val1', 'test');
      client.pexpire('newkey', 1, (err, res) => {
        expect(res).to.be.equal(1);
        clock.tick(2);
        const val = client.hget('newkey', 'val1');
        expect(val).to.be.equal(null);
        done();
      });
    });

    it('pexpireat (non-existing)', () => {
      const val = client.pexpireat('no-key', 5);
      expect(val).to.be.equal(0);
    });

    it('pexpireat (existing)', () => {
      client.hset('no-key', 'val1', 'test');
      let val = client.pexpireat('no-key', 10000);
      expect(val).to.be.equal(1);
      clock.tick(1096);
      val = client.hget('no-key', 'val1');
      expect(val).to.be.equal(null);
    });

    it('pexpireat with callback', (done) => {
      client.hset('no-key', 'val1', 'test');
      client.pexpireat('no-key', 10200, (err, res) => {
        expect(res).to.be.equal(1);
        clock.tick(200);
        res = client.hget('no-key', 'val1');
        expect(res).to.be.equal(null);
        done();
      });
    });

    it('pttl (non-existing)', () => {
      const val = client.pttl('no-key');
      expect(val).to.be.equal(-2);
    });

    it('pttl (existing no expire)', () => {
      client.hset('no-key', 'val1', 'test');
      const val = client.pttl('no-key');
      expect(val).to.be.equal(-1);
    });

    it('pttl (existing)', () => {
      client.pexpireat('no-key', 10400);
      const val = client.pttl('no-key');
      expect(val).to.be.equal(100);
    });

    it('pttl with callback', (done) => {
      client.pttl('no-key', (err, res) => {
        expect(res).to.be.equal(100);
        done();
      });
    });

    it('randomkey', () => {
      const val = client.randomkey();
      expect(val).to.not.be.equal(null);
    });

    it('randomkey with callback', (done) => {
      client.randomkey((err, res) => {
        expect(res).to.not.be.equal(null);
        done();
      });
    });

    it('rename (non-existing)', () => {
      const testfn = () => { client.rename('lame', 'somekey'); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('rename (existing)', () => {
      const val = client.rename('no-key', 'somekey');
      expect(val).to.be.equal('OK');
    });

    it('rename with callback', (done) => {
      client.rename('somekey', 'no-key', (err, res) => {
        expect(res).to.be.equal('OK');
        done();
      });
    });

    it('renamenx (non-existing)', () => {
      const testfn = () => { client.renamenx('lame', 'somekey'); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('renamenx (already existing dest)', () => {
      const val = client.renamenx('no-key', 'testkey');
      expect(val).to.be.equal(0);
    });

    it('renamenx (already existing dest)', () => {
      const val = client.renamenx('no-key', 'somekey');
      expect(val).to.be.equal(1);
    });

    it('renamenx with callback', (done) => {
      client.renamenx('somekey', 'no-key', (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('restore (already exists)', () => {
      const dump = client.dump('no-key');
      const testfn = () => { client.restore('testkey', null, dump); };
      expect(testfn).to.throw('busy');
    });

    it('restore (bad payload)', () => {
      const dump = 'garbage';
      const testfn = () => { client.restore('somekey', null, dump); };
      expect(testfn).to.throw('payload');
    });

    it('restore', () => {
      const dump = client.dump('no-key');
      const val = client.restore('somekey', 1500, dump);
      expect(val).to.be.equal('OK');
    });

    it('restore (replace existing)', () => {
      const dump = client.dump('no-key');
      const val = client.restore('no-key', 16000, dump, true);
      expect(val).to.be.equal('OK');
    });

    it('restore with callback', (done) => {
      const dump = client.dump('no-key');
      client.restore('somekey', 16000, dump, true, (err, res) => {
        expect(res).to.be.equal('OK');
        done();
      });
    });

    it('touch', () => {
      clock.tick(1000);
      const val = client.touch('no-key', 'somekey', 'bad');
      expect(val).to.be.equal(2);
      expect(client.cache['no-key'].lastAccess).to.be.equal(Date.now());
    });

    it('touch with callback', (done) => {
      clock.tick(1000);
      client.touch('no-key', 'somekey', 'bad', (err, res) => {
        expect(res).to.be.equal(2);
        expect(client.cache['no-key'].lastAccess).to.be.equal(Date.now());
        done();
      });
    });

    it('ttl', () => {
      const val = client.ttl('somekey');
      expect(val).to.be.equal(14);
    });

    it('ttl with callback', (done) => {
      client.ttl('somekey', (err, res) => {
        expect(res).to.be.equal(14);
        done();
      });
    });

    it('type (non-existing)', () => {
      const val = client.type('bad');
      expect(val).to.be.equal('none');
    });

    it('type', () => {
      const val = client.type('somekey');
      expect(val).to.be.equal('hash');
    });

    it('type with callback', (done) => {
      client.type('somekey', (err, res) => {
        expect(res).to.be.equal('hash');
        done();
      });
    });

    it('unlink', () => {
      const val = client.unlink('somekey', 'bad');
      expect(val).to.be.equal(1);
    });

    it('unlink with callback', (done) => {
      client.unlink('somekey', 'bad', (err, res) => {
        expect(res).to.be.equal(0);
        done();
      });
    });
  });

  describe('Lists', () => {
    it('lpush (wrong type)', () => {
      const testfn = () => { client.lpush('no-key', '1'); };
      expect(testfn).to.throw('WRONGTYPE');
    });

    it('lpush', () => {
      let val = client.lpush('listkey', '1');
      expect(val).to.be.equal(1);
      val = client.lpush('listkey', '12');
      expect(val).to.be.equal(2);
    });

    it('lpush with callback', (done) => {
      client.lpush('listkey', 'abc', (err, res) => {
        expect(res).to.be.equal(3);
        done();
      });
    });

    it('lpushx', () => {
      const val = client.lpushx('bad', '1');
      expect(val).to.be.equal(0);
    });

    it('lpushx with callback', (done) => {
      client.lpushx('listkey', 'zyx', (err, res) => {
        expect(res).to.be.equal(4);
        done();
      });
    });

    it('lindex', () => {
      const val = client.lindex('listkey', 0);
      expect(val).to.be.equal('zyx');
    });

    it('lindex (negative index)', () => {
      const val = client.lindex('listkey', -1);
      expect(val).to.be.equal('1');
    });

    it('lindex with callback', (done) => {
      client.lindex('listkey', 1, (err, res) => {
        expect(res).to.be.equal('abc');
        done();
      });
    });

    it('linsert (non-existing)', () => {
      const val = client.linsert('listkey2', 'before', 1, 'def');
      expect(val).to.be.equal(-1);
    });

    it('linsert', () => {
      const val = client.linsert('listkey', 'before', 1, 'def');
      expect(val).to.be.equal(5);
    });

    it('linsert (out of range)', () => {
      const val = client.linsert('listkey', 'before', 10, 'uvw');
      expect(val).to.be.equal(-1);
    });

    it('linsert with callback', (done) => {
      client.linsert('listkey', 'after', 1, 'uvw', (err, res) => {
        expect(res).to.be.equal(6);
        done();
      });
    });

    it('llen (non-existing)', () => {
      const val = client.llen('listkey2');
      expect(val).to.be.equal(0);
    });

    it('llen', () => {
      const val = client.llen('listkey');
      expect(val).to.be.equal(6);
    });

    it('llen with callback', (done) => {
      client.llen('listkey', (err, res) => {
        expect(res).to.be.equal(6);
        done();
      });
    });

    it('lpop (non-existing)', () => {
      let val = client.lpop('bad');
      expect(val).to.be.equal(null);
    });

    it('lpop', () => {
      let val = client.lpop('listkey');
      expect(val).to.be.equal('zyx');
    });

    it('lpop with callback', (done) => {
      client.lpop('listkey', (err, res) => {
        expect(res).to.be.equal('def');
        done();
      });
    });

    it('lrange (non-existing)', () => {
      let val = client.lrange('bad', 1, 1);
      expect(val).to.be.empty;
    });

    it('lrange', () => {
      let val = client.lrange('listkey', -4, -1);
      expect(val.length).to.be.equal(4);
      expect(val).to.include.members(['uvw', '1', '12', 'abc']);
    });

    it('lrange with callback', (done) => {
      client.lrange('listkey', -100, 100, (err, res) => {
        expect(res.length).to.be.equal(4);
        expect(res).to.include.members(['uvw','abc']);
        done();
      });
    });

    it('lrem (non-existing key)', () => {
      let val = client.lrem('bad', 1, 'thing');
      expect(val).to.be.equal(0);
    });

    it('lrem (non-existing value)', () => {
      let val = client.lrem('listkey', -1, 'nope');
      expect(val).to.be.equal(0);
    });

    it('lrem', () => {
      let val = client.lrem('listkey', 10, '12');
      expect(val).to.be.equal(1);
    });

    it('lrem with callback', (done) => {
      client.lrem('listkey', -1, '1', (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('lset (non-existing key)', () => {
      let testfn = () => { client.lset('bad', 1, '1'); }
      expect(testfn).to.throw('no such key');
    });

    it('lset (out-of-range)', () => {
      let testfn = () => { client.lset('listkey', 10, '1'); }
      expect(testfn).to.throw('out of range');
    });

    it('lset (bad index)', () => {
      let testfn = () => { client.lset('listkey', 'mm', '1'); }
      expect(testfn).to.throw('not an integer');
    });

    it('lset', () => {
      let val = client.lset('listkey', 0, 'abc');
      expect(val).to.be.equal('OK');
    });

    it('lset with callback', (done) => {
      client.lset('listkey', 1, 'def', (err, res) => {
        expect(res).to.be.equal('OK');
        done();
      });
    });

    it('rpush (non-existing)', () => {
      let val = client.rpush('listkey3', 'abc');
      expect(val).to.be.equal(1);
    });

    it('rpush', () => {
      let val = client.rpush('listkey', 'ghi');
      expect(val).to.be.equal(3);
      val = client.rpush('listkey', 'jkl');
      expect(val).to.be.equal(4);
    });

    it('rpush with callback', (done) => {
      client.rpush('listkey', 'mno', (err, res) => {
        expect(res).to.be.equal(5);
        done();
      });
    });

    it('rpushx (non-existing)', () => {
      let val = client.rpushx('bad', '1');
      expect(val).to.be.equal(0);
    });

    it('rpushx', () => {
      let val = client.rpushx('listkey', 'pqr');
      expect(val).to.be.equal(6);
    });

    it('rpushx with callback', (done) => {
      client.rpushx('listkey', 'st', (err, res) => {
        expect(res).to.be.equal(7);
        done();
      });
    });

    it('rpop (non-existing)', () => {
      let val = client.rpop('bad');
      expect(val).to.be.equal(null);
    });

    it('rpop', () => {
      let val = client.rpop('listkey');
      expect(val).to.be.equal('st');
    });

    it('rpop with callback', (done) => {
      client.rpop('listkey', (err, res) => {
        expect(res).to.be.equal('pqr');
        done();
      });
    });

    it('rpoplpush (non-existing)', () => {
      let val = client.rpoplpush('bad');
      expect(val).to.be.equal(null);
    });

    it('rpoplpush', () => {
      let val = client.rpoplpush('listkey', 'listkey');
      expect(val).to.be.equal('mno');
      val = client.lindex('listkey', 0);
      expect(val).to.be.equal('mno');
    });

    it('rpoplpush with callback', (done) => {
      client.rpoplpush('listkey', 'listkey', (err, res) => {
        expect(res).to.be.equal('jkl');
        let val = client.lindex('listkey', 0);
        expect(val).to.be.equal('jkl');
        done();
      });
    });

    it('ltrim (index out of range)', () => {
      let testfn = () => { client.ltrim('listkey', 1000, 1); }
      expect(testfn).to.throw('out of range');
    });

    it('ltrim (non-existing)', () => {
      let val = client.ltrim('bad', 1, 1);
      expect(val).to.be.equal('OK');
    });

    it('ltrim', () => {
      client.rpush('listkey', '111');
      let val = client.ltrim('listkey', -4, -2);
      expect(val).to.be.equal('OK');
      val = client.llen('listkey');
      expect(val).to.be.equal(3);
      expect(client.cache['listkey'].value).to.include.members(['abc', 'def', 'ghi']);
    });

    it('ltrim with callback', (done) => {
      client.lpush('listkey', '111');
      client.rpush('listkey', '111');
      client.ltrim('listkey', 1, 100, (err, res) => {
        expect(res).to.be.equal('OK');
        let val = client.llen('listkey');
        expect(val).to.be.equal(4);
        expect(client.cache['listkey'].value).to.include.members(['abc', 'def', 'ghi']);
        done();
      });
    });
  });

  describe('Sets', () => {
    it('sadd', () => {
      let val = client.sadd('setkey', 'abc', 'def', 'abc', 'ghi');
      expect(val).to.be.equal(3);
    });

    it('sadd with callback', (done) => {
      client.sadd('setkey', 'abc', 'xyz', (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('scard (non-existing)', () => {
      let val = client.scard('bad');
      expect(val).to.be.equal(0);
    });

    it('scard', () => {
      let val = client.scard('setkey');
      expect(val).to.be.equal(4);
    });

    it('scard with callback', (done) => {
      client.scard('setkey', (err, res) => {
        expect(res).to.be.equal(4);
        done();
      });
    });

    it('sdiff (non-existing)', () => {
      let val = client.sdiff('setkey2', 'setkey3', 'setkey4');
      expect(val).to.be.empty;
    });

    it('sdiff', () => {
      client.sadd('setkey2', 'def');
      client.sadd('setkey3', 'abc', 'def', 'xyz', 'mno');
      let val = client.sdiff('setkey', 'setkey2', 'setkey3', 'setkey4');
      expect(val.length).to.be.equal(1);
      expect(val).to.include.members(['ghi']);
    });

    it('sdiff with callback', (done) => {
      client.sdiff('setkey', 'setkey2', 'setkey3', 'setkey4', (err, res) => {
        expect(res.length).to.be.equal(1);
        expect(res).to.include.members(['ghi']);
        done();
      });
    });

    it('sdiffstore', () => {
      let val = client.sdiffstore('newset', 'setkey', 'setkey2', 'setkey3', 'setkey4');
      expect(val).to.be.equal(1);
    });

    it('sdiffstore with callback', (done) => {
      let val = client.sdiffstore('newset', 'setkey', 'setkey2', 'setkey3', 'setkey4', (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('sinter', () => {
      let val = client.sinter('setkey', 'setkey2', 'setkey3');
      expect(val.length).to.be.equal(1);
      expect(val).to.include.members(['def']);
    });

    it('sinter with callback', (done) => {
      client.sinter('setkey', 'setkey2', 'setkey3', (err, res) => {
        expect(res.length).to.be.equal(1);
        expect(res).to.include.members(['def']);
        done();
      });
    });

    it('sinterstore', () => {
      let val = client.sinterstore('newset', 'setkey', 'setkey2', 'setkey3');
      expect(val).to.be.equal(1);
    });

    it('sinterstore with callback', (done) => {
      let val = client.sdiffstore('newset', 'setkey', 'setkey2', 'setkey3', (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('sunion', () => {
      let val = client.sunion('setkey', 'setkey2', 'setkey3', 'setkey4');
      expect(val.length).to.be.equal(5);
      expect(val).to.include.members(['abc', 'def', 'ghi', 'mno', 'xyz']);
    });

    it('sunion with callback', (done) => {
      client.sunion('setkey', 'setkey2', 'setkey3', 'setkey4', (err, res) => {
        expect(res.length).to.be.equal(5);
        expect(res).to.include.members(['abc', 'def', 'ghi', 'mno', 'xyz']);
        done();
      });
    });

    it('sunionstore', () => {
      let val = client.sunionstore('newset', 'setkey', 'setkey2', 'setkey3');
      expect(val).to.be.equal(4);
    });

    it('sunionstore with callback', (done) => {
      client.sunionstore('newset', 'setkey', 'setkey2', 'setkey3', 'setkey4', (err, res) => {
        expect(res).to.be.equal(4);
        done();
      });
    });

    it('sismember (non-existing)', () => {
      let val = client.sismember('bad', 'a');
      expect(val).to.be.equal(0);
    });

    it('sismember', () => {
      let val = client.sismember('setkey', 'a');
      expect(val).to.be.equal(0);
      val = client.sismember('setkey', 'abc');
      expect(val).to.be.equal(1);
    });

    it('sismember with callback', (done) => {
      client.sismember('setkey', 'abc', (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('smembers (non-existing)', () => {
      let val = client.smembers('badkey');
      expect(val).to.be.empty;
    });

    it('smembers', () => {
      let val = client.smembers('setkey');
      expect(val.length).to.be.equal(4);
      expect(val).to.include.members(['abc', 'def', 'ghi', 'xyz']);
    });

    it('smembers with callback', (done) => {
      client.smembers('setkey', (err, res) => {
        expect(res.length).to.be.equal(4);
        expect(res).to.include.members(['abc', 'def', 'ghi', 'xyz']);
        done();
      });
    });

    it('smove (non-existing)', () => {
      let val = client.smove('bad', 'newkey', 'a');
      expect(val).to.be.equal(0);
    });

    it('smove', () => {
      let val = client.smove('setkey', 'newset', 'abc');
      expect(val).to.be.equal(1);
    });

    it('smove with callback', (done) => {
      client.smove('newset', 'setkey', 'abc', (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('spop (bad count)', () => {
      let testfn = () => { client.spop('setkey', 'ggg'); }
      expect(testfn).to.throw('integer');
    });

    it('spop (non-existing)', () => {
      let val = client.spop('bad');
      expect(val).to.be.equal(null);
    });

    it('spop', () => {
      let val = client.spop('newset', 2);
      expect(val.length).to.be.equal(2);
    });

    it('spop with callback', (done) => {
      client.spop('newset', 2, (err, res) => {
        expect(res.length).to.be.equal(1);
        done();
      });
    });

    it('srandmember (bad count)', () => {
      let testfn = () => { client.srandmember('setkey', 'ggg'); }
      expect(testfn).to.throw('integer');
    });

    it('srandmember (non-existing)', () => {
      let val = client.srandmember('bad');
      expect(val).to.be.equal(null);
    });

    it('srandmember (non-existing /w count)', () => {
      let val = client.srandmember('bad', 1);
      expect(val).to.be.empty;
    });

    it('srandmember (no count)', () => {
      let val = client.srandmember('setkey');
      expect(val.length).to.be.equal(1);
    });

    it('srandmember (positive count)', () => {
      let val = client.srandmember('setkey', 10);
      expect(val.length).to.be.equal(4);
    });

    it('srandmember (negative count)', () => {
      let val = client.srandmember('setkey', -10);
      expect(val.length).to.be.equal(10);
    });

    it('srandmember with callback', (done) => {
      client.srandmember('setkey', 1, (err, res) => {
        expect(res.length).to.be.equal(1);
        done();
      })
    });

    it('srem (non-existing)', () => {
      let val = client.srem('bad', 'a', 'b');
      expect(val).to.be.equal(0);
    });

    it('srem', () => {
      let val = client.srem('setkey', 'a', 'xyz');
      expect(val).to.be.equal(1);
    });

    it('srem with callback', (done) => {
      client.srem('setkey', 'ghi', '123', (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });
  });

  describe('Sorted Sets', () => {
    it('zadd (no score)', () => {
      let testfn = () => { client.zadd('sortedkey', 'xx'); }
      expect(testfn).to.throw('wrong number');
    });

    it('zadd (mismatched pairs)', () => {
      let testfn = () => { client.zadd('sortedkey', 1.2); }
      expect(testfn).to.throw('wrong number');
    });

    it('zadd (bad flags [mutex])', () => {
      let testfn = () => { client.zadd('sortedkey', 'nx', 'xx', 1.2, 'value'); }
      expect(testfn).to.throw('XX and NX');
    });

    it('zadd (bad flags [unknown])', () => {
      let testfn = () => { client.zadd('sortedkey', 'ccc', 1.2, 'value'); }
      expect(testfn).to.throw('syntax');
    });

    it('zadd', () => {
      let val = client.zadd('sortedkey', 1.2, 'lame');
      expect(val).to.be.equal(1);
    });

    it('zadd (incr and ch flags)', () => {
      let val = client.zadd('sortedkey', 'incr', 'ch', 1.2, 'lame');
      expect(val).to.be.equal(1);
      val = client.zscore('sortedkey', 'lame');
      expect(val).to.be.equal(2.4);
    });

    it('zadd (nx flags)', () => {
      let val = client.zadd('sortedkey', 'ch', 'nx', 1.2, 'lame');
      expect(val).to.be.equal(0);
    });

    it('zadd (xx flags)', () => {
      let val = client.zadd('sortedkey', 'ch', 'xx', 2.0, 'lame');
      expect(val).to.be.equal(1);
      val = client.zscore('sortedkey', 'lame');
      expect(val).to.be.equal(2.0);
    });

    it('zadd with callback', (done) => {
      client.zadd('sortedkey', 1.2, 'lame2', (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('zcard (non-existing)', () => {
      let val = client.zcard('bad');
      expect(val).to.be.equal(0);
    });

    it('zcard', () => {
      let val = client.zcard('sortedkey');
      expect(val).to.be.equal(2);
    });

    it('zcard with callback', (done) => {
      client.zcard('sortedkey', (err, res) => {
        expect(res).to.be.equal(2);
        done();
      });
    });

    it('zcount (bad range min)', () => {
      let testfn = () => { client.zcount('sortedkey', '+ad', '2'); }
      expect(testfn).to.throw('float');
    });

    it('zcount (bad range max)', () => {
      let testfn = () => { client.zcount('sortedkey', '1', '+ad'); }
      expect(testfn).to.throw('float');
    });

    it('zcount (reversed order)', () => {
      let val = client.zcount('sortedkey', '+inf', '-inf');
      expect(val).to.be.equal(0);
    });

    it('zcount (exclusive range)', () => {
      let val = client.zcount('sortedkey', '(1', '(2');
      expect(val).to.be.equal(1);
    });

    it('zcount (inclusive range)', () => {
      let val = client.zcount('sortedkey', '1', '2');
      expect(val).to.be.equal(2);
    });

    it('zcount with callback', (done) => {
      client.zcount('sortedkey', '1', '(2', (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('zincrby (bad incr)', () => {
      let testfn = () => { client.zincrby('sortedkey', 'lame', 'lame2'); }
      expect(testfn).to.throw('float');
    });

    it('zincrby (non-existing key)', () => {
      let val = client.zincrby('sortedkey3', -2.0, 'lame');
      expect(val).to.be.equal(-2.0);
      val = client.zcard('sortedkey3');
      expect(val).to.be.equal(1);
    });

    it('zincrby (non-existing member)', () => {
      let val = client.zincrby('sortedkey', -2.0, 'other');
      expect(val).to.be.equal(-2.0);
      val = client.zcard('sortedkey');
      expect(val).to.be.equal(3);
    });

    it('zincrby', () => {
      let val = client.zincrby('sortedkey', -0.5, 'lame2');
      expect(val).to.be.equal(0.7);
    });

    it('zincrby with callback', (done) => {
      client.zincrby('sortedkey', 0.5, 'lame2', (err, res) => {
        expect(res).to.be.equal(1.2);
        done();
      });
    });

    it('zlexcount (bad range start)', () => {
      let testfn = () => { client.zlexcount('sortedkey', 'd', '[a'); }
      expect(testfn).to.throw('not valid string');
    });

    it('zlexcount (bad range end)', () => {
      let testfn = () => { client.zlexcount('sortedkey', '[a', 'a'); }
      expect(testfn).to.throw('not valid string');
    });

    it('zlexcount (reversed order)', () => {
      let val = client.zlexcount('sortedkey', '+', '-');
      expect(val).to.be.equal(0);
    });

    it('zlexcount (all)', () => {
      let val = client.zlexcount('sortedkey', '-', '+');
      expect(val).to.be.equal(3);
    });

    it('zlexcount (exclusive range)', () => {
      let val = client.zlexcount('sortedkey', '(l', '(other');
      expect(val).to.be.equal(2);
    });

    it('zlexcount (inclusive range)', () => {
      let val = client.zlexcount('sortedkey', '[l', '[p');
      expect(val).to.be.equal(3);
    });

    it('zlexcount with callback', (done) => {
      client.zlexcount('sortedkey', '[1', '[p', (err, res) => {
        expect(res).to.be.equal(3);
        done();
      });
    });

    it('zrange (bad parameter count)', () => {
      let testfn = () => { client.zrange('sortedkey', 'd', 2, 'lame', 'lame'); }
      expect(testfn).to.throw('syntax');
    });

    it('zrange (bad range start)', () => {
      let testfn = () => { client.zrange('sortedkey', 'd', 2); }
      expect(testfn).to.throw('integer');
    });

    it('zrange (bad range end)', () => {
      let testfn = () => { client.zrange('sortedkey', 1, 'd'); }
      expect(testfn).to.throw('integer');
    });

    it('zrange (bad params)', () => {
      let testfn = () => { client.zrange('sortedkey', 1, 2, 'lame'); }
      expect(testfn).to.throw('syntax');
    });

    it('zrange (reverse range)', () => {
      let val = client.zrange('sortedkey', 2, 1);
      expect(val).to.be.empty;
    });

    it('zrange (all)', () => {
      let val = client.zrange('sortedkey', 0, 100);
      expect(val.length).to.be.equal(3);
      expect(val[0]).to.be.equal('other');
      expect(val[2]).to.be.equal('lame');
    });

    it('zrange', () => {
      let val = client.zrange('sortedkey', -3, -2);
      expect(val.length).to.be.equal(2);
      expect(val[0]).to.be.equal('other');
      expect(val[1]).to.be.equal('lame2');
    });

    it('zrange (with scores)', () => {
      let val = client.zrange('sortedkey', -100, 1, "withscores");
      expect(val.length).to.be.equal(4);
      expect(val[0]).to.be.equal('other');
      expect(val[2]).to.be.equal('lame2');
    });

    it('zrange with callback', (done) => {
      client.zrange('sortedkey', 0, 1, (err, res) => {
        expect(res.length).to.be.equal(2);
        expect(res[0]).to.be.equal('other');
        expect(res[1]).to.be.equal('lame2');
        done();
      });
    });

    it('zrangebylex (bad start range)', () => {
      let testfn = () => { client.zrangebylex('sortedkey', 'd', '[a'); }
      expect(testfn).to.throw('not valid string');
    });

    it('zrangebylex (bad end range)', () => {
      let testfn = () => { client.zrangebylex('sortedkey', '[d', 'a'); }
      expect(testfn).to.throw('not valid string');
    });

    it('zrevrangebylex (bad params count)', () => {
      let testfn = () => { client.zrangebylex('sortedkey', '[d', '[a', 'lame'); }
      expect(testfn).to.throw('syntax');
    });

    it('zrangebylex (bad params)', () => {
      let testfn = () => { client.zrangebylex('sortedkey', '[d', '[a', 'lame', 1, 2); }
      expect(testfn).to.throw('syntax');
    });

    it('zrangebylex (bad limit -- too few)', () => {
      let testfn = () => { client.zrangebylex('sortedkey', '[d', '[a', 'limit'); }
      expect(testfn).to.throw('syntax');
    });

    it('zrangebylex (bad limit -- too many)', () => {
      let testfn = () => { client.zrangebylex('sortedkey', '[d', '[a', 'limit', 1, 2, 'sick'); }
      expect(testfn).to.throw('syntax');
    });

    it('zrangebylex (bad limit offset)', () => {
      let testfn = () => { client.zrangebylex('sortedkey', '[d', '[a', 'limit', 'a', 2); }
      expect(testfn).to.throw('integer');
    });

    it('zrangebylex (bad limit count)', () => {
      let testfn = () => { client.zrangebylex('sortedkey', '[d', '[a', 'limit', 1, 'a'); }
      expect(testfn).to.throw('integer');
    });

    it('zrangebylex (reverse order)', () => {
      let val = client.zrangebylex('sortedkey', '+', '-');
      expect(val).to.be.empty;
    });

    it('zrangebylex (all)', () => {
      let val = client.zrangebylex('sortedkey', '-', '+');
      expect(val.length).to.be.equal(3);
      expect(val[0]).to.be.equal('lame');
      expect(val[2]).to.be.equal('other');
    });

    it('zrangebylex (all with limit)', () => {
      let val = client.zrangebylex('sortedkey', '-', '+', 'limit', 1, 2);
      expect(val.length).to.be.equal(2);
      expect(val[0]).to.be.equal('lame2');
      expect(val[1]).to.be.equal('other');
    });

    it('zrangebylex (exclusive range)', () => {
      let val = client.zrangebylex('sortedkey', '(l', '(other');
      expect(val.length).to.be.equal(2);
      expect(val[0]).to.be.equal('lame');
      expect(val[1]).to.be.equal('lame2');
    });

    it('zrangebylex (inclusive range)', () => {
      let val = client.zrangebylex('sortedkey', '[l', '[p');
      expect(val.length).to.be.equal(3);
      expect(val[0]).to.be.equal('lame');
      expect(val[2]).to.be.equal('other');
    });

    it('zrangebylex with callback', (done) => {
      client.zrangebylex('sortedkey', '[l', '[p', (err, res) => {
        expect(res.length).to.be.equal(3);
        expect(res[0]).to.be.equal('lame');
        expect(res[2]).to.be.equal('other');
        done();
      });
    });

    it('zrangebyscore (bad start range)', () => {
      let testfn = () => { client.zrangebyscore('sortedkey', 'd', 2.0); }
      expect(testfn).to.throw('float');
    });

    it('zrangebyscore (bad end range)', () => {
      let testfn = () => { client.zrangebyscore('sortedkey', 1.0, 'a'); }
      expect(testfn).to.throw('float');
    });

    it('zrangebyscore (bad params)', () => {
      let testfn = () => { client.zrangebyscore('sortedkey', 1.0, 2.0, 'lame'); }
      expect(testfn).to.throw('syntax');
    });

    it('zrangebyscore (bad limit -- too many)', () => {
      let testfn = () => { client.zrangebyscore('sortedkey', 1.0, 2.0, 'limit', 1, 2, 'all'); }
      expect(testfn).to.throw('wrong number');
    });

    it('zrangebyscore (bad limit -- too few)', () => {
      let testfn = () => { client.zrangebyscore('sortedkey', 1.0, 2.0, 'limit'); }
      expect(testfn).to.throw('wrong number');
    });

    it('zrangebyscore (bad limit offset)', () => {
      let testfn = () => { client.zrangebyscore('sortedkey', 1.0, 2.0, 'limit', 'a', 2); }
      expect(testfn).to.throw('integer');
    });

    it('zrangebyscore (bad limit count)', () => {
      let testfn = () => { client.zrangebyscore('sortedkey', 1.0, 2.0, 'limit', 1, 'a'); }
      expect(testfn).to.throw('integer');
    });

    it('zrangebyscore (reverse order)', () => {
      let val = client.zrangebyscore('sortedkey', '+inf', '-inf');
      expect(val).to.be.empty;
    });

    it('zrangebyscore (all)', () => {
      let val = client.zrangebyscore('sortedkey', '-inf', '+inf');
      expect(val.length).to.be.equal(3);
      expect(val[0]).to.be.equal('other');
      expect(val[2]).to.be.equal('lame');
    });

    it('zrangebyscore (all with limit)', () => {
      let val = client.zrangebyscore('sortedkey', '-inf', '+inf', 'limit', 1, 2);
      expect(val.length).to.be.equal(2);
      expect(val[0]).to.be.equal('lame2');
      expect(val[1]).to.be.equal('lame');
    });

    it('zrangebyscore (all with limit withscores)', () => {
      let val = client.zrangebyscore('sortedkey', '-inf', '+inf', 'withscores', 'limit', 1, 2);
      expect(val.length).to.be.equal(4);
      expect(val[0]).to.be.equal('lame2');
      expect(val[2]).to.be.equal('lame');
    });

    it('zrangebyscore (all withscores)', () => {
      let val = client.zrangebyscore('sortedkey', '-inf', '+inf', 'withscores');
      expect(val.length).to.be.equal(6);
      expect(val[0]).to.be.equal('other');
      expect(val[4]).to.be.equal('lame');
    });

    it('zrangebyscore (exclusive range)', () => {
      let val = client.zrangebyscore('sortedkey', '(1.0', '(2.0');
      expect(val.length).to.be.equal(1);
      expect(val[0]).to.be.equal('lame2');
    });

    it('zrangebyscore (inclusive range)', () => {
      let val = client.zrangebyscore('sortedkey', '1.0', '2.0');
      expect(val.length).to.be.equal(2);
      expect(val[0]).to.be.equal('lame2');
      expect(val[1]).to.be.equal('lame');
    });

    it('zrangebyscore with callback', (done) => {
      client.zrangebyscore('sortedkey', '1.0', '2.0', (err, res) => {
        expect(res.length).to.be.equal(2);
        expect(res[0]).to.be.equal('lame2');
        expect(res[1]).to.be.equal('lame');
        done(0);
      });
    });

    it('zrank (non-existing key)', () => {
      let val = client.zrank('bad', 'll');
      expect(val).to.be.equal(null);
    });

    it('zrank (non-existing member)', () => {
      let val = client.zrank('sortedkey', 'll');
      expect(val).to.be.equal(null);
    });

    it('zrank', () => {
      let val = client.zrank('sortedkey', 'other');
      expect(val).to.be.equal(0);
    });

    it('zrank with callback', (done) => {
      client.zrank('sortedkey', 'lame', (err, res) => {
        expect(res).to.be.equal(2);
        done();
      });
    });

    it('zrevrange (bad parameter count)', () => {
      let testfn = () => { client.zrevrange('sortedkey', 'd', 2, 'lame', 'lame'); }
      expect(testfn).to.throw('syntax');
    });

    it('zrevrange (bad range start)', () => {
      let testfn = () => { client.zrevrange('sortedkey', 'd', 2); }
      expect(testfn).to.throw('integer');
    });

    it('zrevrange (bad range end)', () => {
      let testfn = () => { client.zrevrange('sortedkey', 1, 'd'); }
      expect(testfn).to.throw('integer');
    });

    it('zrevrange (bad params)', () => {
      let testfn = () => { client.zrevrange('sortedkey', 1, 2, 'lame'); }
      expect(testfn).to.throw('syntax');
    });

    it('zrevrange (reverse range)', () => {
      let val = client.zrevrange('sortedkey', 2, 1);
      expect(val).to.be.empty;
    });

    it('zrevrange (all)', () => {
      let val = client.zrevrange('sortedkey', 0, 100);
      expect(val.length).to.be.equal(3);
      expect(val[0]).to.be.equal('lame');
      expect(val[2]).to.be.equal('other');
    });

    it('zrevrange', () => {
      let val = client.zrevrange('sortedkey', -3, -2);
      expect(val.length).to.be.equal(2);
      expect(val[0]).to.be.equal('lame');
      expect(val[1]).to.be.equal('lame2');
    });

    it('zrevrange (with scores)', () => {
      let val = client.zrevrange('sortedkey', -100, 1, "withscores");
      expect(val.length).to.be.equal(4);
      expect(val[0]).to.be.equal('lame');
      expect(val[2]).to.be.equal('lame2');
    });

    it('zrevrange with callback', (done) => {
      client.zrevrange('sortedkey', 0, 1, (err, res) => {
        expect(res.length).to.be.equal(2);
        expect(res[0]).to.be.equal('lame');
        expect(res[1]).to.be.equal('lame2');
        done();
      });
    });

    it('zrevrangebylex (bad start range)', () => {
      let testfn = () => { client.zrevrangebylex('sortedkey', 'd', '[a'); }
      expect(testfn).to.throw('not valid string');
    });

    it('zrevrangebylex (bad end range)', () => {
      let testfn = () => { client.zrevrangebylex('sortedkey', '[d', 'a'); }
      expect(testfn).to.throw('not valid string');
    });

    it('zrevrangebylex (bad params count)', () => {
      let testfn = () => { client.zrevrangebylex('sortedkey', '[d', '[a', 'lame'); }
      expect(testfn).to.throw('syntax');
    });

    it('zrevrangebylex (bad params)', () => {
      let testfn = () => { client.zrevrangebylex('sortedkey', '[d', '[a', 'lame', 1, 2); }
      expect(testfn).to.throw('syntax');
    });

    it('zrevrangebylex (bad limit -- too few)', () => {
      let testfn = () => { client.zrevrangebylex('sortedkey', '[d', '[a', 'limit'); }
      expect(testfn).to.throw('syntax');
    });

    it('zrevrangebylex (bad limit -- too many)', () => {
      let testfn = () => { client.zrevrangebylex('sortedkey', '[d', '[a', 'limit', 1, 2, 'sick'); }
      expect(testfn).to.throw('syntax');
    });

    it('zrevrangebylex (bad limit offset)', () => {
      let testfn = () => { client.zrevrangebylex('sortedkey', '[d', '[a', 'limit', 'a', 2); }
      expect(testfn).to.throw('integer');
    });

    it('zrevrangebylex (bad limit count)', () => {
      let testfn = () => { client.zrevrangebylex('sortedkey', '[d', '[a', 'limit', 1, 'a'); }
      expect(testfn).to.throw('integer');
    });

    it('zrevrangebylex (reverse order)', () => {
      let val = client.zrevrangebylex('sortedkey', '-', '+');
      expect(val).to.be.empty;
    });

    it('zrevrangebylex (all)', () => {
      let val = client.zrevrangebylex('sortedkey', '+', '-');
      expect(val.length).to.be.equal(3);
      expect(val[0]).to.be.equal('other');
      expect(val[2]).to.be.equal('lame');
    });

    it('zrevrangebylex (all with limit)', () => {
      let val = client.zrevrangebylex('sortedkey', '+', '-', 'limit', 1, 2);
      expect(val.length).to.be.equal(2);
      expect(val[0]).to.be.equal('lame2');
      expect(val[1]).to.be.equal('lame');
    });

    it('zrevrangebylex (exclusive range)', () => {
      let val = client.zrevrangebylex('sortedkey', '(other', '(l');
      expect(val.length).to.be.equal(2);
      expect(val[0]).to.be.equal('lame2');
      expect(val[1]).to.be.equal('lame');
    });

    it('zrevrangebylex (inclusive range)', () => {
      let val = client.zrevrangebylex('sortedkey', '[p', '[l');
      expect(val.length).to.be.equal(3);
      expect(val[0]).to.be.equal('other');
      expect(val[2]).to.be.equal('lame');
    });

    it('zrevrangebylex with callback', (done) => {
      client.zrevrangebylex('sortedkey', '[p', '[l', (err, res) => {
        expect(res.length).to.be.equal(3);
        expect(res[0]).to.be.equal('other');
        expect(res[2]).to.be.equal('lame');
        done();
      });
    });

    it('zrevrangebyscore (bad start range)', () => {
      let testfn = () => { client.zrevrangebyscore('sortedkey', 'd', 2.0); }
      expect(testfn).to.throw('float');
    });

    it('zrevrangebyscore (bad end range)', () => {
      let testfn = () => { client.zrevrangebyscore('sortedkey', 1.0, 'a'); }
      expect(testfn).to.throw('float');
    });

    it('zrevrangebyscore (bad params)', () => {
      let testfn = () => { client.zrevrangebyscore('sortedkey', 1.0, 2.0, 'lame'); }
      expect(testfn).to.throw('syntax');
    });

    it('zrevrangebyscore (bad limit -- too many)', () => {
      let testfn = () => { client.zrevrangebyscore('sortedkey', 1.0, 2.0, 'limit', 1, 2, 'all'); }
      expect(testfn).to.throw('wrong number');
    });

    it('zrevrangebyscore (bad limit -- too few)', () => {
      let testfn = () => { client.zrevrangebyscore('sortedkey', 1.0, 2.0, 'limit'); }
      expect(testfn).to.throw('wrong number');
    });

    it('zrevrangebyscore (bad limit offset)', () => {
      let testfn = () => { client.zrevrangebyscore('sortedkey', 1.0, 2.0, 'limit', 'a', 2); }
      expect(testfn).to.throw('integer');
    });

    it('zrevrangebyscore (bad limit count)', () => {
      let testfn = () => { client.zrevrangebyscore('sortedkey', 1.0, 2.0, 'limit', 1, 'a'); }
      expect(testfn).to.throw('integer');
    });

    it('zrevrangebyscore (reverse order)', () => {
      let val = client.zrevrangebyscore('sortedkey', '-inf', '+inf');
      expect(val).to.be.empty;
    });

    it('zrevrangebyscore (all)', () => {
      let val = client.zrevrangebyscore('sortedkey', '+inf', '-inf');
      expect(val.length).to.be.equal(3);
      expect(val[0]).to.be.equal('lame');
      expect(val[2]).to.be.equal('other');
    });

    it('zrevrangebyscore (all with limit)', () => {
      let val = client.zrevrangebyscore('sortedkey', '+inf', '-inf', 'limit', 1, 2);
      expect(val.length).to.be.equal(2);
      expect(val[0]).to.be.equal('lame2');
      expect(val[1]).to.be.equal('other');
    });

    it('zrevrangebyscore (all with limit withscores)', () => {
      let val = client.zrevrangebyscore('sortedkey', '+inf', '-inf', 'withscores', 'limit', 1, 2);
      expect(val.length).to.be.equal(4);
      expect(val[0]).to.be.equal('lame2');
      expect(val[2]).to.be.equal('other');
    });

    it('zrevrangebyscore (all withscores)', () => {
      let val = client.zrevrangebyscore('sortedkey', '+inf', '-inf', 'withscores');
      expect(val.length).to.be.equal(6);
      expect(val[0]).to.be.equal('lame');
      expect(val[4]).to.be.equal('other');
    });

    it('zrevrangebyscore (exclusive range)', () => {
      let val = client.zrevrangebyscore('sortedkey', '(2.0', '(1.0');
      expect(val.length).to.be.equal(1);
      expect(val[0]).to.be.equal('lame2');
    });

    it('zrevrangebyscore (inclusive range)', () => {
      let val = client.zrevrangebyscore('sortedkey', '2.0', '1.0');
      expect(val.length).to.be.equal(2);
      expect(val[0]).to.be.equal('lame');
      expect(val[1]).to.be.equal('lame2');
    });

    it('zrevrangebyscore with callback', (done) => {
      client.zrevrangebyscore('sortedkey', '2.0', '1.0', (err, res) => {
        expect(res.length).to.be.equal(2);
        expect(res[0]).to.be.equal('lame');
        expect(res[1]).to.be.equal('lame2');
        done(0);
      });
    });

    it('zrevrank (non-existing key)', () => {
      let val = client.zrevrank('bad', 'll');
      expect(val).to.be.equal(null);
    });

    it('zrevrank (non-existing member)', () => {
      let val = client.zrevrank('sortedkey', 'll');
      expect(val).to.be.equal(null);
    });

    it('zrevrank', () => {
      let val = client.zrevrank('sortedkey', 'other');
      expect(val).to.be.equal(2);
    });

    it('zrevrank with callback', (done) => {
      client.zrevrank('sortedkey', 'lame', (err, res) => {
        expect(res).to.be.equal(0);
        done();
      });
    });

    it('zscore (non-existing key)', () => {
      let val = client.zscore('bad', 'll');
      expect(val).to.be.equal(null);
    });

    it('zscore (non-existing member)', () => {
      let val = client.zscore('sortedkey', 'll');
      expect(val).to.be.equal(null);
    });

    it('zscore', () => {
      let val = client.zscore('sortedkey', 'other');
      expect(val).to.be.equal(-2);
    });

    it('zscore with callback', (done) => {
      client.zscore('sortedkey', 'lame', (err, res) => {
        expect(res).to.be.equal(2);
        done();
      });
    });

    it('zrem (non-existing key)', () => {
      let val = client.zrem('bad', 'll');
      expect(val).to.be.equal(0);
    });

    it('zrem', () => {
      client.zadd('sortedkey', 3, 'fantastic');
      client.zadd('sortedkey', 4, 'beautiful');
      client.zadd('sortedkey', 5, 'good');
      client.zadd('sortedkey', 6, 'great');
      let val = client.zrem('sortedkey', 'okay', 'fantastic', 'beautiful', 'good', 'great');
      expect(val).to.be.equal(4);
    });

    it('zrem with callback', (done) => {
      client.zadd('sortedkey', 3, 'fantastic');
      client.zadd('sortedkey', 4, 'beautiful');
      client.zadd('sortedkey', 5, 'good');
      client.zadd('sortedkey', 6, 'great');
      client.zrem('sortedkey', 'okay', 'fantastic', 'beautiful', 'good', 'great', (err, res) => {
        expect(res).to.be.equal(4);
        done();
      });
    });

    it('zremrangebylex (bad key type)', () => {
      client.set('strkey', 'lame');
      let testfn = () => { client.zremrangebylex('strkey', '(f', '(gz'); }
      expect(testfn).to.throw('WRONGTYPE');
    });

    it('zremrangebylex', () => {
      client.zadd('sortedkey', 3, 'fantastic');
      client.zadd('sortedkey', 4, 'beautiful');
      client.zadd('sortedkey', 5, 'good');
      client.zadd('sortedkey', 6, 'great');
      let val = client.zremrangebylex('sortedkey', '(f', '(gz');
      expect(val).to.be.equal(3);
    });

    it('zremrangebylex with callback', (done) => {
      client.zadd('sortedkey', 3, 'fantastic');
      client.zadd('sortedkey', 4, 'beautiful');
      client.zadd('sortedkey', 5, 'good');
      client.zadd('sortedkey', 6, 'great');
      let val = client.zremrangebylex('sortedkey', '(f', '(gz', (err, res) => {
        expect(res).to.be.equal(3);
        done();
      });
    });

    it('zremrangebyrank (bad key type)', () => {
      let testfn = () => { client.zremrangebyrank('strkey', -2, -1); }
      expect(testfn).to.throw('WRONGTYPE');
    });

    it('zremrangebyrank', () => {
      client.zadd('sortedkey', 3, 'fantastic');
      client.zadd('sortedkey', 4, 'beautiful');
      client.zadd('sortedkey', 5, 'good');
      client.zadd('sortedkey', 6, 'great');
      let val = client.zremrangebyrank('sortedkey', -2, -1);
      expect(val).to.be.equal(2);
      val = client.zrange('sortedkey', 0, -1);
      expect(val).to.not.include.members(['good', 'great']);
    });

    it('zremrangebyrank with callback', (done) => {
      client.zadd('sortedkey', 3, 'fantastic');
      client.zadd('sortedkey', 4, 'beautiful');
      client.zadd('sortedkey', 5, 'good');
      client.zadd('sortedkey', 6, 'great');
      client.zremrangebyrank('sortedkey', -2, -1, (err, res) => {
        expect(res).to.be.equal(2);
        val = client.zrange('sortedkey', 0, -1);
        expect(val).to.not.include.members(['good', 'great']);
        done();
      });
    });

    it('zremrangebyscore (bad key type)', () => {
      let testfn = () => { client.zremrangebyscore('strkey', '4', '6'); }
      expect(testfn).to.throw('WRONGTYPE');
    });

    it('zremrangebyscore', () => {
      client.zadd('sortedkey', 3, 'fantastic');
      client.zadd('sortedkey', 4, 'beautiful');
      client.zadd('sortedkey', 5, 'good');
      client.zadd('sortedkey', 6, 'great');
      let val = client.zremrangebyscore('sortedkey', '4', '6');
      expect(val).to.be.equal(3);
    });

    it('zremrangebyscore with callback', (done) => {
      client.zadd('sortedkey', 3, 'fantastic');
      client.zadd('sortedkey', 4, 'beautiful');
      client.zadd('sortedkey', 5, 'good');
      client.zadd('sortedkey', 6, 'great');
      client.zremrangebyscore('sortedkey', '4', '6', (err, res) => {
        expect(res).to.be.equal(3);
        done();
      });
    });
  });

  describe('Strings', () => {
    it('set (bad expiration [empty])', () => {
      let testfn = () => { client.set('strkey2', 'chuff', 'ex'); }
      expect(testfn).to.throw('syntax');
    });

    it('set (bad milli expiration [empty])', () => {
      let testfn = () => { client.set('strkey2', 'chuff', 'px'); }
      expect(testfn).to.throw('syntax');
    });

    it('set (bad expiration [mutex])', () => {
      let testfn = () => { client.set('strkey2', 'chuff', 'ex', 123, 'px', 123); }
      expect(testfn).to.throw('syntax');
    });

    it('set (bad expiration [no int])', () => {
      let testfn = () => { client.set('strkey2', 'chuff', 'ex', 'px'); }
      expect(testfn).to.throw('integer');
    });

    it('set (bad milli expiration [no int])', () => {
      let testfn = () => { client.set('strkey2', 'chuff', 'px', 'ex'); }
      expect(testfn).to.throw('integer');
    });

    it('set (bad flags [mutex])', () => {
      let testfn = () => { client.set('strkey2', 'chuff', 'xx', 'nx'); }
      expect(testfn).to.throw('syntax');
    });

    it('set (bad params)', () => {
      let testfn = () => { client.set('strkey2', 'chuff', '1234'); }
      expect(testfn).to.throw('syntax');
    });

    it('set (basic)', () => {
      let val = client.set('strkey', 'a');
      expect(val).to.be.equal('OK');
    });

    it('set (with expiration)', () => {
      let val = client.set('strkey2', 'chuff', 'ex', 120);
      expect(val).to.be.equal('OK');
    });

    it('set (with millisecond expiration)', () => {
      let val = client.set('strkey2', 'chuff', 'px', 120);
      expect(val).to.be.equal('OK');
    });

    it('set (with xx flag)', () => {
      let val = client.set('strkey3', 'chuff', 'xx');
      expect(val).to.be.equal(null);
    });

    it('set with callback', (done) => {
      client.set('strkey', 'c', (err, res) => {
        expect(res).to.be.equal('OK');
        done();
      });
    });

    it('get (non-existing)', () => {
      let val = client.get('strkey3');
      expect(val).to.be.equal(null);
    });

    it('get', () => {
      let val = client.get('strkey');
      expect(val).to.be.equal('c');
    });

    it('get with callback', (done) => {
      client.get('strkey', (err, res) => {
        expect(res).to.be.equal('c');
        done();
      });
    });

    it('append (non-existing)', () => {
      val = client.append('strkey3', 'at');
      expect(val).to.be.equal(2);
    });

    it('append', () => {
      val = client.append('strkey', 'at');
      expect(val).to.be.equal(3);
    });

    it('append with callback', (done) => {
      client.append('strkey3', 'at', (err, res) => {
        expect(res).to.be.equal(4);
        done();
      });
    });

    it('bitcount (bad too many params)', () => {
      let testfn = () => { client.bitcount('strkey4', '1', '1', '1'); }
      expect(testfn).to.throw('syntax');
    });

    it('bitcount (bad too few params)', () => {
      let testfn = () => { client.bitcount('strkey4', '1'); }
      expect(testfn).to.throw('syntax');
    });

    it('bitcount (bad start index)', () => {
      let testfn = () => { client.bitcount('strkey4', 'bad', '1'); }
      expect(testfn).to.throw('integer');
    });

    it('bitcount (bad end index)', () => {
      let testfn = () => { client.bitcount('strkey4', '1', 'bad'); }
      expect(testfn).to.throw('integer');
    });

    it('bitcount (non-existing)', () => {
      let val = client.bitcount('strkey4');
      expect(val).to.be.equal(0);
    });

    it('bitcount', () => {
      let val = client.bitcount('strkey');
      expect(val).to.be.equal(8);
    });

    it('bitcount (with start and end)', () => {
      let val = client.bitcount('strkey', 14, -2);
      expect(val).to.be.equal(4);
    });

    it('bitcount (with start before beginning)', () => {
      let val = client.bitcount('strkey', -100, 100);
      expect(val).to.be.equal(8);
    });

    it('bitcount (with end beyond length)', () => {
      let val = client.bitcount('strkey', 14, 100);
      expect(val).to.be.equal(4);
    });

    it('bitcount with callback', (done) => {
      client.bitcount('strkey', -48, -2, (err, res) => {
        expect(res).to.be.equal(8);
        done();
      });
    });

    it('bitop (no source key)', () => {
      let testfn = () => { client.bitop('not', 'bitop'); }
      expect(testfn).to.throw('wrong number');
    });

    it('bitop (bad operator)', () => {
      let testfn = () => { client.bitop('wacky', 'bitop', 'bitop1', 'bitop2'); }
      expect(testfn).to.throw('syntax');
    });

    it('bitop [not] (bad parameter count)', () => {
      let testfn = () => { client.bitop('not', 'bitop', 'bitop1', 'bitop2'); }
      expect(testfn).to.throw('BITOP NOT');
    });

    it('bitop [not]', () => {
      client.set('bitop0', '\u0000');
      client.set('bitop1', '\u0001');
      client.set('bitop2', '\u0002');
      client.set('bitop3', '\u0003');
      let val = client.bitop('not', 'bitop', 'bitop0');
      expect(val).to.be.equal(1);
      val = client.get('bitop');
      expect(val).to.be.equal('\uffff');
    });

    it('bit [and]', () => {
      let val = client.bitop('and', 'bitop', 'bitop3', 'bitop2');
      expect(val).to.be.equal(1);
      val = client.get('bitop');
      expect(val).to.be.equal('\u0002');
    });

    it('bit [or]', () => {
      let val = client.bitop('or', 'bitop', 'bitop1', 'bitop3');
      expect(val).to.be.equal(1);
      val = client.get('bitop');
      expect(val).to.be.equal('\u0003');
    })

    it('bit [xor]', () => {
      let val = client.bitop('xor', 'bitop', 'bitop1', 'bitop3');
      expect(val).to.be.equal(1);
      val = client.get('bitop');
      expect(val).to.be.equal('\u0002');
    })

    it('bitop with callback', (done) => {
      client.bitop('xor', 'bitop', 'bitop1', 'bitop3', (err, res) => {
        expect(res).to.be.equal(1);
        let val = client.get('bitop');
        expect(val).to.be.equal('\u0002');
        done();
      });
    });

    it('decr (bad key type)', () => {
      let testfn = () => { client.decr('strkey'); }
      expect(testfn).to.throw('integer');
    });

    it('decr (non-existing)', () => {
      let val = client.decr('numkey');
      expect(val).to.be.equal(-1);
    });

    it('decr', () => {
      let val = client.decr('numkey');
      expect(val).to.be.equal(-2);
    });

    it('decr with callback', (done) => {
      client.decr('numkey', (err, res) => {
        expect(res).to.be.equal(-3);
        done();
      });
    });

    it('decrby (bad value)', () => {
      let testfn = () => { client.decrby('numkey3', 'f'); }
      expect(testfn).to.throw('integer');
    });

    it('decrby (non-existing)', () => {
      let val = client.decrby('numkey2', 2);
      expect(val).to.be.equal(-2);
    });

    it('decrby', () => {
      let val = client.decrby('numkey2', 2);
      expect(val).to.be.equal(-4);
    });

    it('decrby with callback', (done) => {
      client.decrby('numkey2', 2, (err, res) => {
        expect(res).to.be.equal(-6);
        done();
      });
    });

    it('getbit (non-existing)', () => {
      let val = client.getbit('bad', 1);
      expect(val).to.be.equal(0);
    });

    it('getbit (out of range)', () => {
      let val = client.getbit('strkey', 100);
      expect(val).to.be.equal(0);
    });

    it('getbit', () => {
      let val = client.getbit('strkey', 1);
      expect(val).to.be.equal(1);
    });

    it('getbit with callback', (done) => {
      client.getbit('strkey', 1, (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('getrange (non-existing)', () => {
      let val = client.getrange('bad', 1, -1);
      expect(val).to.be.equal('');
    });

    it('getrange (bad range :: end < start)', () => {
      let val = client.getrange('strkey', 1, 0);
      expect(val).to.be.equal('');
    });

    it('getrange', () => {
      let val = client.getrange('strkey', 1, -1);
      expect(val).to.be.equal('at');
    });

    it('getrange with callback', (done) => {
      client.getrange('strkey', -2, -1, (err, res) => {
        expect(res).to.be.equal('at');
        done();
      })
    });

    it('getset (non-existing)', () => {
      let val = client.getset('bad', '1');
      expect(val).to.be.equal(null);
    });

    it('getset', () => {
      let val = client.getset('strkey', 'dog');
      expect(val).to.be.equal('cat');
    });

    it('getset with callback', (done) => {
      client.getset('strkey', 'cat', (err, res) => {
        expect(res).to.be.equal('dog');
        done();
      });
    });

    it('incr (non integer key)', () => {
      let testfn = () => { client.incr('strkey'); }
      expect(testfn).to.throw('integer');
    });

    it('incr (non-existing)', () => {
      let val = client.incr('numkey3');
      expect(val).to.be.equal(1);
    });

    it('incr', () => {
      let val = client.incr('numkey3');
      expect(val).to.be.equal(2);
    });

    it('incr with callback', (done) => {
      client.incr('numkey3', (err, res) => {
        expect(res).to.be.equal(3);
        done();
      });
    });

    it('incrby (bad value)', () => {
      let testfn = () => { client.incrby('numkey3', 'f'); }
      expect(testfn).to.throw('integer');
    });

    it('incrby (non-existing)', () => {
      let val = client.incrby('numkey4', 2);
      expect(val).to.be.equal(2);
    });

    it('incrby', () => {
      let val = client.incrby('numkey4', 2);
      expect(val).to.be.equal(4);
    });

    it('incrby with callback', (done) => {
      client.incrby('numkey4', 2, (err, res) => {
        expect(res).to.be.equal(6);
        done();
      });
    });

    it('incrbyfloat (non float key)', () => {
      let testfn = () => { client.incrbyfloat('strkey', 1.11); }
      expect(testfn).to.throw('float');
    });

    it('incrbyfloat (bad value)', () => {
      let testfn = () => { client.incrbyfloat('numkey5', 'f'); }
      expect(testfn).to.throw('float');
    });

    it('incrbyfloat (non-exsiting)', () => {
      let val = client.incrbyfloat('numkey5', 1.11);
      expect(val).to.be.equal(1.11);
    });

    it('incrbyfloat', () => {
      let val = client.incrbyfloat('numkey5', 1.11);
      expect(val).to.be.equal(2.22);
    });

    it('incrbyfloat with callback', () => {
      client.incrbyfloat('numkey5', 1.11, (err, res) => {
        expect(res).to.be.equal(3.33);
      });
    });

    it('mget', () => {
      let val = client.mget('numkey', 'numkey2', 'numkey3', 'numkey4', 'numkey5', 'numkey6');
      expect(val.length).to.be.equal(6);
      expect(val).to.include.members(['6', '3.33', '3', '-6', '-3', null]);
    });

    it('mget with callback', (done) => {
      client.mget('numkey', 'numkey2', 'numkey3', 'numkey4', 'numkey5', 'numkey6', (err, res) => {
        expect(res.length).to.be.equal(6);
        expect(res).to.include.members(['6', '3.33', '3', '-6', '-3', null]);
        done();
      });
    });

    it('mset (wrong arg count - too many)', () => {
      let testfn = () => { client.mset('key1', 1, 'key2'); }
      expect(testfn).to.throw('wrong number');
    });

    it('mset (wrong arg count - too few)', () => {
      let testfn = () => { client.mset('key1'); }
      expect(testfn).to.throw('wrong number');
    });

    it('mset', () => {
      let val = client.mset('strkey', 'cat', 'strkey2', 'dog', 'newstrkey', 'bird');
      expect(val).to.be.equal('OK');
    });

    it('mset with callback', (done) => {
      client.mset('strkey', 'cat', 'strkey2', 'dog', 'newstrkey', 'bird', (err, res) => {
        expect(res).to.be.equal('OK');
        done();
      });
    });

    it('msetnx (wrong arg count - too many)', () => {
      let testfn = () => { client.msetnx('key1', 1, 'key2'); }
      expect(testfn).to.throw('wrong number');
    });

    it('msetnx (wrong arg count - too few)', () => {
      let testfn = () => { client.msetnx('key1'); }
      expect(testfn).to.throw('wrong number');
    });

    it('msetnx (already existing)', () => {
      let val = client.msetnx('strkey', 'cat', 'strkey2', 'dog', 'newstrkey2', 'bird');
      expect(val).to.be.equal(0);
    });

    it('msetnx', () => {
      let val = client.msetnx('newstrkey2', 'bird', 'newstrkey3', 'monkey');
      expect(val).to.be.equal(1);
    });

    it('msetnx with callback', (done) => {
      let val = client.msetnx('newstrkey4', 'racooon', 'newstrkey5', 'bison', (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('psetex (bad key type)', () => {
      let testfn = () => { client.psetex('testkey', 100, 123); }
      expect(testfn).to.throw('WRONGTYPE');
    });

    it('psetex', () => {
      let val = client.psetex('expirekey', 200, '123');
      expect(val).to.be.equal('OK');
    });

    it('psetex with callback', (done) => {
      client.psetex('expirekey', 2000, '123', (err, res) => {
        expect(res).to.be.equal('OK');
        done();
      });
    });

    it('setbit (non-existing)', () => {
      let val = client.setbit('newk', 6, 1);
      expect(val).to.be.equal(0);
      val = client.get('newk');
      expect(val).to.be.equal('@');
    });

    it('setbit', () => {
      client.set('strkey', 'cat');
      let val = client.setbit('strkey', 0, 0);
      expect(val).to.be.equal(1);
      val = client.get('strkey');
      expect(val).to.be.equal('bat');
    });

    it('setbit with callback', (done) => {
      client.setbit('strkey', 0, 1, (err, res) => {
        expect(res).to.be.equal(0);
        let val = client.get('strkey');
        expect(val).to.be.equal('cat');
        done();
      });
    });

    it('setex (bad key type)', () => {
      let testfn = () => { client.setex('testkey', 100, 123); }
      expect(testfn).to.throw('WRONGTYPE');
    });

    it('setex', () => {
      let val = client.setex('expirekey', 20, '567');
      expect(val).to.be.equal('OK');
    });

    it('setex with callback', (done) => {
      client.setex('expirekey', 20, '123', (err, res) => {
        expect(res).to.be.equal('OK');
        done();
      });
    });

    it('setnx (bad key type)', () => {
      let testfn = () => { client.setnx('testkey', 123); }
      expect(testfn).to.throw('WRONGTYPE');
    });

    it('setnx (existing)', () => {
      let val = client.setnx('expirekey', 123);
      expect(val).to.be.equal(0);
    });

    it('setnx', () => {
      let val = client.setnx('newnew', 123);
      expect(val).to.be.equal(1);
    });

    it('setnx with callback', (done) => {
      client.setnx('newnew1', 123, (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('setrange (non-existing)', () => {
      let val = client.setrange('newk1', 2, 'ok');
      expect(val).to.be.equal(4);
      val = client.get('newk1');
      expect(val).to.be.equal('\u0000\u0000ok');
    });

    it('setrange', () => {
      let val = client.setrange('newk1', 0, 'ok');
      expect(val).to.be.equal(4);
      val = client.get('newk1');
      expect(val).to.be.equal('okok');
    });

    it('setrange with callback', (done) => {
      client.setrange('newk1', 2, 'ay', (err, res) => {
        expect(res).to.be.equal(4);
        let val = client.get('newk1');
        expect(val).to.be.equal('okay');
        done();
      });
    });

    it('strlen (non-existing)', () => {
      let val = client.strlen('bad');
      expect(val).to.be.equal(0);
    });

    it('strlen', () => {
      let val = client.strlen('newnew1');
      expect(val).to.be.equal(3);
    });

    it('strlen with callback', (done) => {
      client.strlen('newnew1', (err, res) => {
        expect(res).to.be.equal(3);
        done();
      });
    });
  });

  describe('Transactions', () => {
    let dbsize;
    before(() => {
      dbsize = client.dbsize();
    });

    it('multi', () => {
      let val = client.multi();
      expect(val).to.be.equal('OK');
    });

    it('discard', () => {
      let val = client.discard();
      expect(val).to.be.equal('OK');
    });

    it('discard (without multi)', () => {
      let testfn = () => { client.discard(); }
      expect(testfn).to.throw('DISCARD without MULTI');
    });

    it('exec (without multi)', () => {
      let testfn = () => { client.exec(); }
      expect(testfn).to.throw('EXEC without MULTI');
    });

    it('multi (nested multi)', () => {
      let testfn = () => { client.multi(); client.multi(); }
      expect(testfn).to.throw('MULTI calls');
      client.discard();
    });

    it('multi with callback', (done) => {
      client.multi((err, res) => {
        expect(res).to.be.equal('OK');
        done();
      });
    });

    it('exec', () => {
      let val = client.set('atomic1', 2);
      expect(val).to.be.equal('QUEUED');
      client.set('atomic2', 1);
      val = client.exec();
      expect(val.length).to.be.equal(3);
      expect(val).to.include.members(['OK']);
      expect(client.dbsize()).to.be.equal(dbsize + 2);
    });

    it('exec with callback', (done) => {
      client.multi();
      client.exec((err, res) => {
        expect(res).to.include.members(['OK']);
        done();
      });
    });

    it('discard with callback', (done) => {
      client.multi();
      client.discard((err, res) => {
        expect(res).to.be.equal('OK');
        done();
      });
    });
  });

  describe('Server', () => {
    let clock;
    before(() => {
      clock = lolex.install();
    });

    after(() => {
      clock.uninstall();
    });

    it('bgsave', () => {
      let val = client.bgsave();
      expect(val).to.equal('OK');
    });

    it('bgsave with callback', (done) => {
      client.bgsave((err, res) => {
        expect(res).to.equal('OK');
        done();
      });
    });

    it('dbsize', () => {
      let val = client.dbsize();
      expect(val).to.equal(Object.keys(client.cache).length);
    });

    it('dbsize with callback', (done) => {
      client.dbsize((err, res) => {
        expect(res).to.equal(Object.keys(client.cache).length);
        done();
      });
    });

    it('info', () => {
      let val = client.info();
      expect(val).to.be.equal('');
    });

    it('info with callback', (done) => {
      client.info(null, (err, res) => {
        expect(res).to.be.equal('');
        done();
      });
    });

    it('lastsave', () => {
      let val = client.lastsave();
      expect(val).to.be.equal(Date.now());
    });

    it('lastsave with callback', (done) => {
      client.lastsave((err, res) => {
        expect(res).to.be.equal(Date.now());
        done();
      });
    });

    it('role', () => {
      let val = client.role();
      expect(val).to.include.members(['master', 0, null]);
    });

    it('role with callback', (done) => {
      client.role((err, res) => {
        expect(res).to.include.members(['master', 0, null]);
        done();
      });
    });

    it('save', () => {
      let val = client.save();
      expect(val).to.equal('OK');
    });

    it('save with callback', (done) => {
      client.save((err, res) => {
        expect(res).to.equal('OK');
        done();
      });
    });

    it('time', () => {
      clock.tick(52002)
      let val = client.time();
      expect(val[0]).to.be.equal(52);
      expect(val[1]).to.be.equal(2000);
    });

    it('time with callback', (done) => {
      client.time((err, res) => {
        expect(res[0]).to.be.equal(52);
        expect(res[1]).to.be.equal(2000);
        done();
      });
    });

    it('select (bad index)', () => {
      let testfn = () => { client.select('bad'); }
      expect(testfn).to.throw('invalid DB index');
    });

    it('select', () => {
      let val = client.select(2);
      expect(val).to.be.equal('OK');
      expect(client.currentDBIndex).to.be.equal(2);
    });

    it('select with callback', () => {
      client.select(3, (err, res) => {
        expect(res).to.be.equal('OK');
        expect(client.currentDBIndex).to.be.equal(3);
      });
    })

    it('swapdb (bad source index)', () => {
      let testfn = () => { client.swapdb('bad', 1); }
      expect(testfn).to.throw('invalid DB index');
    });

    it('swapdb (bad dest index)', () => {
      let testfn = () => { client.swapdb(1, 'bad'); }
      expect(testfn).to.throw('invalid DB index');
    });

    it('swapdb (non-existing source index)', () => {
      let testfn = () => { client.swapdb(100, 1); }
      expect(testfn).to.throw('invalid DB index');
    });

    it('swapdb (non-existing dest index)', () => {
      let testfn = () => { client.swapdb(1, 100); }
      expect(testfn).to.throw('invalid DB index');
    });

    it('swapdb', () => {
      client.set('c', 'd');
      let val = client.swapdb(2, 3);
      expect(val).to.be.equal('OK');
      expect(Object.keys(client.databases[2]).length).to.be.equal(1);
    });

    it('swapdb with callback', () => {
      client.swapdb(2, 3, (err, res) => {
        expect(res).to.be.equal('OK');
        expect(Object.keys(client.databases[3]).length).to.be.equal(1);
      });
    });

    it('flushdb', () => {
      client.set('a', 'b');
      let val = client.flushdb();
      expect(val).to.be.equal('OK');
      expect(client.cache).to.be.empty;
    });

    it('flushdb with callback', (done) => {
      client.set('a', 'b');
      client.flushdb((err, res) => {
        expect(res).to.be.equal('OK');
        expect(client.cache).to.be.empty;
        done();
      });
    });

    it('flushall', () => {
      client.select(1);
      client.set('a', 'b');
      let val = client.flushall();
      expect(val).to.be.equal('OK');
      expect(client.currentDBIndex).to.be.equal(0);
      expect(Object.keys(client.databases).length).to.be.equal(1);
      expect(client.cache).to.be.empty;
    });

    it('flushall with callback', (done) => {
      client.select(1);
      client.set('a', 'b');
      client.flushall((err, res) => {
        expect(res).to.be.equal('OK');
        expect(client.currentDBIndex).to.be.equal(0);
        expect(Object.keys(client.databases).length).to.be.equal(1);
        expect(client.cache).to.be.empty;
        done();
      });
    });
  });

  describe('Unsupported', () => {
    it('cluster', () => {
      const testfn = () => { client.cluster(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('readonly', () => {
      const testfn = () => { client.readonly(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('readwrite', () => {
      const testfn = () => { client.readwrite(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('geoadd', () => {
      const testfn = () => { client.geoadd(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('geodist', () => {
      const testfn = () => { client.geodist(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('geohash', () => {
      const testfn = () => { client.geohash(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('geopos', () => {
      const testfn = () => { client.geopos(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('georadius', () => {
      const testfn = () => { client.georadius(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('georadiusbymember', () => {
      const testfn = () => { client.georadiusbymember(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('hscan', () => {
      const testfn = () => { client.hscan(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('pfadd', () => {
      const testfn = () => { client.pfadd(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('pfcount', () => {
      const testfn = () => { client.pfcount(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('pfmerge', () => {
      const testfn = () => { client.pfmerge(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('migrate', () => {
      const testfn = () => { client.migrate(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('object', () => {
      const testfn = () => { client.object(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('bitpos', () => {
      const testfn = () => { client.bitpos(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('scan', () => {
      const testfn = () => { client.scan(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('sort', () => {
      const testfn = () => { client.sort(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('wait', () => {
      const testfn = () => { client.wait(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('blpop', () => {
      const testfn = () => { client.blpop(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('brpop', () => {
      const testfn = () => { client.brpop(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('brpoplpush', () => {
      const testfn = () => { client.brpoplpush(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('psubscribe', () => {
      const testfn = () => { client.psubscribe(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('pubsub', () => {
      const testfn = () => { client.pubsub(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('publish', () => {
      const testfn = () => { client.publish(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('punsubscribe', () => {
      const testfn = () => { client.punsubscribe(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('suscribe', () => {
      const testfn = () => { client.suscribe(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('unsubscribe', () => {
      const testfn = () => { client.unsubscribe(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('eval', () => {
      const testfn = () => { client.eval(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('evalsha', () => {
      const testfn = () => { client.evalsha(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('script', () => {
      const testfn = () => { client.script(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('bgrewriteaof', () => {
      const testfn = () => { client.bgrewriteaof(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('client', () => {
      const testfn = () => { client.client(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('config', () => {
      const testfn = () => { client.config(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('command', () => {
      const testfn = () => { client.command(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('debug', () => {
      const testfn = () => { client.debug(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('monitor', () => {
      const testfn = () => { client.monitor(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('shutdown', () => {
      const testfn = () => { client.shutdown(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('slaveof', () => {
      const testfn = () => { client.slaveof(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('slowlog', () => {
      const testfn = () => { client.slowlog(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('sync', () => {
      const testfn = () => { client.sync(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('sscan', () => {
      const testfn = () => { client.sscan(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('zinterstore', () => {
      const testfn = () => { client.zinterstore(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('zunionstore', () => {
      const testfn = () => { client.zunionstore(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('zscan', () => {
      const testfn = () => { client.zscan(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('bitfield', () => {
      const testfn = () => { client.bitfield(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('unwatch', () => {
      const testfn = () => { client.unwatch(); };
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('watch', () => {
      const testfn = () => { client.watch(); };
      expect(testfn).to.throw(MemoryCacheError);
    });
  });

  describe('Internal Methods', () => {
    it('_strbit with bad or missing operator', () => {
      let val = client._strbit('', ['moo', 'cat']);
      expect(val).to.be.equal('moo');
    });

    it('_testType in silent mode', () => {
      client.set('test', '1');
      let val = client._testType('test', 'string', false);
      expect(val).to.be.equal(true);
      val = client._testType('test', 'zset', false);
      expect(val).to.be.equal(false);
    });

    it('_unsupported in bypass mode', () => {
      client.options.bypassUnsupported = true;
      let val = client._unsupported();
      expect(val).to.be.equal(undefined);
    });
  });
});
