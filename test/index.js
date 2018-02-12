// test/index.js
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

    it('quit', (done) => {
      client.once('end', () => {
        expect(client.connected).to.equal(false);
        done();
      });
      client.quit();
    });

    it('swapdb');
    it('select');
  });

  describe('Hash', () => {
    before(() => {
      client.createClient();
    });

    it('hset (non-existing)', () => {
      let val = client.hset('testkey', 'testfield', 1);
      expect(val).to.equal(1);
    });

    it('hset (existing)', () => {
      let val = client.hset('testkey', 'testfield', 2);
      expect(val).to.equal(0);
    });

    it('hset with callback', (done) => {
      client.hset('testkey', 'testfield2', 1, (err, res) => {
        expect(res).to.equal(1);
        done();
      });
    });

    it('hsetnx (non-existing)', () => {
      let val = client.hsetnx('testkey', 'testfield3', 0);
      expect(val).to.equal(1);
    });

    it('hsetnx (existing)', () => {
      let val = client.hsetnx('testkey', 'testfield3', 'm1');
      expect(val).to.equal(0);
    });

    it('hsetnx with callback', (done) => {
      client.hsetnx('testkey', 'testfield4', 'shit', (err, res) => {
        expect(res).to.equal(1);
        done();
      });
    });

    it('hget (non-existing)', () => {
      let val = client.hget('testkey', 'testfield5');
      expect(val).to.be.equal(null);
    });

    it('hget (existing)', () => {
      let val = client.hget('testkey', 'testfield3');
      expect(val).to.be.equal('0');
    });

    it('hget with callback', (done) => {
      client.hget('testkey', 'testfield4', (err, res) => {
        expect(res).to.be.equal('shit');
        done();
      });
    });

    it('hdel (non-existing)', () => {
      let val = client.hdel('testkey', 'testfield5');
      expect(val).to.be.equal(0);
    });

    it('hdel (existing)', () => {
      let val = client.hdel('testkey', 'testfield');
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
      let val = client.hexists('testkey', 'testfield5');
      expect(val).to.be.equal(0);
    });

    it('hexists (existing)', () => {
      let val = client.hexists('testkey', 'testfield3');
      expect(val).to.be.equal(1);
    });

    it('hexists with callback', (done) => {
      client.hexists('testkey', 'testfield4', (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('hgetall', () => {
      let val = client.hgetall('testkey');
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

    it('hincrby (non-existing)', () => {
      let val = client.hincrby('testkey', 'no-exist', '12');
      expect(val).to.be.equal(12);
      client.hdel('testkey','no-exist');
    });

    it('hincrby (existing)', () => {
      let val = client.hincrby('testkey', 'testfield2', '12');
      expect(val).to.be.equal(13);
    });

    it('hincrby with callback', (done) => {
      client.hincrby('testkey', 'testfield2', '12', (err, res) => {
        expect(res).to.be.equal(25);
        done();
      });
    });

    it('hincrbyfloat (non-existing)', () => {
      let val = client.hincrbyfloat('testkey', 'no-exist', '3.14');
      expect(val).to.be.equal(3.14);
      client.hdel('testkey','no-exist');
    });

    it('hincrbyfloat (existing)', () => {
      let val = client.hincrbyfloat('testkey', 'testfield2', '1.5');
      expect(val).to.be.equal(26.5);
    });

    it('hincrbyfloat with callback', (done) => {
      client.hincrbyfloat('testkey', 'testfield2', '-12.1', (err, res) => {
        expect(res).to.be.equal(14.4);
        done();
      });
    });

    it('hkeys', () => {
      let val = client.hkeys('testkey');
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
      let val = client.hlen('testkey');
      expect(val).to.be.equal(3);
    });

    it('hlen with callback', (done) => {
      client.hlen('testkey', (err, res) => {
        expect(res).to.be.equal(3);
        done();
      });
    });

    it('hmget multi-field (non-exist key)', () => {
      let val = client.hmget('testkey2', 'a', 'b', 'c');
      expect(val).to.include.members([null]);
      expect(val.length).to.be.equal(3);
    });

    it('hmget multi-field', () => {
      let val = client.hmget('testkey', 'testfield2', 'testfield4', 'testfield5');
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

    it('hmset multi-field object (non-exist key)', () => {
      let val = client.hmset('testkey2', { a: 'a', b: 'b', c: 'c'});
      expect(val).to.be.equal('OK');
    });

    it('hmset multi-field object (existing key)', () => {
      let val = client.hmset('testkey2', { a: 'z', d: 'd' });
      expect(val).to.be.equal('OK');
    });

    it('hmset multi-field object with callback', (done) => {
      client.hmset('testkey2', { e: 'e', f: '1234' }, (err, res) => {
        expect(res).to.be.equal('OK');
        done();
      });
    });

    it('hmset field-value pairs', () => {
      let val = client.hmset('testkey2', 'q', '123', 'r', '987');
      expect(val).to.be.equal('OK');
    });

    it('hmset field-value pairs with callback', (done) => {
      client.hmset('testkey2', 'x', 'v', 'y', 'w', (err, res) => {
        expect(res).to.be.equal('OK');
        done();
      })
    });

    it('hmgetall results from hmset', () => {
      let val = client.hkeys('testkey2');
      expect(val).to.include.members(['a', 'b', 'c', 'd', 'e', 'f', 'q', 'r', 'x', 'y']);
      let val2 = client.hvals('testkey2');
      expect(val2).to.include.members(['z', 'b', 'c', 'd', 'e', '1234', '123', '987', 'v', 'w']);
    });

    it('hstrlen (non-existing)', () => {
      let val = client.hstrlen('testkey', 'testfield5');
      expect(val).to.be.equal(0);
    });

    it('hstrlen (existing)', () => {
      let test = client.hstrlen('testkey', 'testfield3');
      expect(test).to.be.equal(1);
    });

    it('hstrlen with callback', (done) => {
      client.hstrlen('testkey', 'testfield4', (err, res) => {
        expect(res).to.be.equal(4);
        done();
      });
    });

    it('hvals', () => {
      let val = client.hvals('testkey');
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
      let val = client.del('testkey2', 'no-exist');
      expect(val).to.be.equal(1);
    });

    it('del with callback', (done) => {
      client.del('no-exist', (err, res) => {
        expect(res).to.be.equal(0);
        done();
      });
    });

    it('dump', () => {
      let val = client.dump('testkey');
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
      let val = client.exists('no-exists', 'testkey');
      expect(val).to.be.equal(1);
    });

    it('exists with callback', (done) => {
      client.exists('no-exists', 'testkey', (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('expire (non-existing)', () => {
      let val = client.expire('newkey', 1);
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
        val = client.hget('newkey', 'val1');
        expect(val).to.be.equal(null);
        done();
      });
    });

    it('expireat (non-existing)', () => {
      let val = client.expireat('newkey', 4500);
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
      let val = client.keys();
      expect(val).to.include.members(['testkey']);
    });

    it('keys (no matches)', () => {
      let val = client.keys('nokey*');
      expect(val).to.be.empty;
    });

    it('keys with callback', (done) => {
      client.keys('test*', (err, res) => {
        expect(res).to.include.members(['testkey']);
        done();
      });
    });

    it('move (non-existing)', () => {
      let val = client.move('test', 1);
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
      let val = client.move('testkey2', 1);
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
      let val = client.persist('newkey');
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
        let val = client.hget('newkey', 'val1');
        expect(val).to.be.equal('test');
        done();
      });
    });

    it('pexpire (non-existing)', () => {
      let val = client.pexpire('newkey2', 1);
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
        val = client.hget('newkey', 'val1');
        expect(val).to.be.equal(null);
        done();
      });
    });

    it('pexpireat (non-existing)', () => {
      let val = client.pexpireat('no-key', 5);
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
      let val = client.pttl('no-key');
      expect(val).to.be.equal(-2);
    });

    it('pttl (existing no expire)', () => {
      client.hset('no-key', 'val1', 'test');
      let val = client.pttl('no-key');
      expect(val).to.be.equal(-1);
    });

    it('pttl (existing)', () => {
      client.pexpireat('no-key', 10400);
      let val = client.pttl('no-key');
      expect(val).to.be.equal(100);
    });

    it('pttl with callback', (done) => {
      client.pttl('no-key', (err, res) => {
        expect(res).to.be.equal(100);
        done();
      });
    });

    it('randomkey', () => {
      let val = client.randomkey();
      expect(val).to.not.be.equal(null);
    });

    it('randomkey with callback', (done) => {
      client.randomkey((err, res) => {
        expect(res).to.not.be.equal(null);
        done();
      });
    });

    it('rename (non-existing)', () => {
      let testfn = () => { client.rename('lame', 'somekey'); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('rename (existing)', () => {
      let val = client.rename('no-key', 'somekey');
      expect(val).to.be.equal('OK');
    });

    it('rename with callback', (done) => {
      client.rename('somekey', 'no-key', (err, res) => {
        expect(res).to.be.equal('OK');
        done();
      });
    });

    it('renamenx (non-existing)', () => {
      let testfn = () => { client.renamenx('lame', 'somekey'); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('renamenx (already existing dest)', () => {
      let val = client.renamenx('no-key', 'testkey');
      expect(val).to.be.equal(0);
    });

    it('renamenx (already existing dest)', () => {
      let val = client.renamenx('no-key', 'somekey');
      expect(val).to.be.equal(1);
    });

    it('renamenx with callback', (done) => {
      client.renamenx('somekey', 'no-key', (err, res) => {
        expect(res).to.be.equal(1);
        done();
      });
    });

    it('restore (already exists)', () => {
      let dump = client.dump('no-key');
      let testfn = () => { client.restore('testkey', null, dump); }
      expect(testfn).to.throw('busy');
    });

    it('restore (bad payload)', () => {
      let dump = 'garbage';
      let testfn = () => { client.restore('somekey', null, dump); }
      expect(testfn).to.throw('payload');
    });

    it('restore', () => {
      let dump = client.dump('no-key');
      let val = client.restore('somekey', 1500, dump);
      expect(val).to.be.equal('OK');
    });

    it('restore (replace existing)', () => {
      let dump = client.dump('no-key');
      let val = client.restore('no-key', 16000, dump, true);
      expect(val).to.be.equal('OK');
    });

    it('restore with callback', (done) => {
      let dump = client.dump('no-key');
      client.restore('somekey', 16000, dump, true, (err, res) => {
        expect(res).to.be.equal('OK');
        done();
      });
    });

    it('touch', () => {
      clock.tick(1000);
      let val = client.touch('no-key', 'somekey', 'bad');
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
      let val = client.ttl('somekey');
      expect(val).to.be.equal(14);
    });

    it('ttl with callback', (done) => {
      client.ttl('somekey', (err, res) => {
        expect(res).to.be.equal(14);
        done();
      });
    });

    it('type (non-existing)', () => {
      let val = client.type('bad');
      expect(val).to.be.equal('none');
    });

    it('type', () => {
      let val = client.type('somekey');
      expect(val).to.be.equal('hash');
    });

    it('type with callback', (done) => {
      client.type('somekey', (err, res) => {
        expect(res).to.be.equal('hash');
        done();
      });
    });

    it('unlink', () => {
      let val = client.unlink('somekey', 'bad');
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
      let testfn = () => { client.lpush('no-key', '1'); }
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
      let val = client.lpushx('bad', '1');
      expect(val).to.be.equal(0);
    });

    it('lpushx with callback', (done) => {
      client.lpushx('listkey', 'zyx', (err, res) => {
        expect(res).to.be.equal(4);
        done();
      });
    });

    it('lindex', () => {
      let val = client.lindex('listkey', 0);
      expect(val).to.be.equal('zyx');
    });

    it('lindex (negative index)', () => {
      let val = client.lindex('listkey', -1);
      expect(val).to.be.equal('1');
    });

    it('lindex with callback', (done) => {
      client.lindex('listkey', 1, (err, res) => {
        expect(res).to.be.equal('abc');
        done();
      });
    });

    it('linsert (non-existing)', () => {
      let val = client.linsert('listkey2', 'before', 1, 'def');
      expect(val).to.be.equal(-1);
    });

    it('linsert', () => {
      let val = client.linsert('listkey', 'before', 1, 'def');
      expect(val).to.be.equal(5);
    });

    it('linsert (out of range)', () => {
      let val = client.linsert('listkey', 'before', 10, 'uvw');
      expect(val).to.be.equal(-1);
    });

    it('linsert with callback', (done) => {
      client.linsert('listkey', 'after', 1, 'uvw', (err, res) => {
        expect(res).to.be.equal(6);
        done();
      });
    });

    it('llen (non-existing)', () => {
      let val = client.llen('listkey2');
      expect(val).to.be.equal(0);
    });

    it('llen', () => {
      let val = client.llen('listkey');
      expect(val).to.be.equal(6);
    });

    it('llen with callback', (done) => {
      client.llen('listkey', (err, res) => {
        expect(res).to.be.equal(6);
        done();
      });
    });
    
    it('lpop');
    it('lpop with callback');
    it('lrange');
    it('lrange with callback');
    it('lrem');
    it('lrem with callback');
    it('lset');
    it('lset with callback');
    it('ltrim');
    it('ltrim with callback');
    it('rpop');
    it('rpop with callback');
    it('rpoplpush');
    it('rpoplpush with callback');
    it('rpush');
    it('rpush with callback');
    it('rpushx');
    it('rpushx with callback');
  });

  describe('Sets', () => {
    it('sadd');
    it('sadd with callback');
    it('scard');
    it('scard with callback');
    it('sdiff');
    it('sdiff with callback');
    it('sdiffstore');
    it('sdiffstore with callback');
    it('sinter');
    it('sinter with callback');
    it('sinterstore');
    it('sinterstore with callback');
    it('sismember');
    it('sismember with callback');
    it('smembers');
    it('smembers with callback');
    it('smove');
    it('smove with callback');
    it('spop');
    it('spop with callback');
    it('srandmember');
    it('srandmember with callback');
    it('srem');
    it('srem with callback');
    it('sunion');
    it('sunion with callback');
    it('sunionstore');
    it('sunionstore with callback');
  });

  describe('Sorted Sets', () => {
    it('zadd');
    it('zadd with callback');
    it('zcard');
    it('zcard with callback');
    it('zcount');
    it('zcount with callback');
    it('zincrby');
    it('zincrby with callback');
    it('zlexcount');
    it('zlexcount with callback');
    it('zrange');
    it('zrange with callback');
    it('zrangebylex');
    it('zrangebylex with callback');
    it('zrangebyscore');
    it('zrangebyscore with callback');
    it('zrank');
    it('zrank with callback');
    it('zrem');
    it('zrem with callback');
    it('zremrangebylex');
    it('zremrangebylex with callback');
    it('zremrangebyrank');
    it('zremrangebyrank with callback');
    it('zremrangebyscore');
    it('zremrangebyscore with callback');
    it('zrevrange');
    it('zrevrange with callback');
    it('zrevrangebylex');
    it('zrevrangebylex with callback');
    it('zrevrangebyscore');
    it('zrevrangebyscore with callback');
    it('zrevrank');
    it('zrevrank with callback');
    it('zscore');
    it('zscore with callback');
  });

  describe('Strings', () => {
    it('append');
    it('append with callback');
    it('bitcount');
    it('bitcount with callback');
    it('bitop');
    it('bitop with callback');
    it('decr');
    it('decr with callback');
    it('decrby');
    it('decrby with callback');
    it('get');
    it('get with callback');
    it('getbit');
    it('getbit with callback');
    it('getrange');
    it('getrange with callback');
    it('getset');
    it('getset with callback');
    it('incr');
    it('incr with callback');
    it('incrby');
    it('incrby with callback');
    it('incrbyfloat');
    it('incrbyfloat with callback');
    it('mget');
    it('mget with callback');
    it('mset');
    it('mset with callback');
    it('msetnx');
    it('msetnx with callback');
    it('psetex');
    it('psetex with callback');
    it('set');
    it('set with callback');
    it('setbit');
    it('setbit with callback');
    it('setex');
    it('setex with callback');
    it('setnx');
    it('setnx with callback');
    it('setrange');
    it('setrange with callback');
    it('strlen');
    it('strlen with callback');
  });

  describe('Transactions', () => {
    it('discard');
    it('discard with callback');
    it('exec');
    it('exec with callback');
    it('multi');
    it('multi with callback');
  });

  describe('Server', () => {
    it('bgsave');
    it('bgsave with callback');
    it('dbsize');
    it('dbsize with callback');
    it('flushall');
    it('flushall with callback');
    it('flushdb');
    it('flushdb with callback');
    it('info');
    it('info with callback');
    it('lastsave');
    it('lastsave with callback');
    it('role');
    it('role with callback');
    it('save');
    it('save with callback');
    it('time');
    it('time with callback');
  });

  describe('Unsupported', () => {
    it('cluster', () => {
      let testfn = () => { client.cluster(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('readonly', () => {
      let testfn = () => { client.readonly(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('readwrite', () => {
      let testfn = () => { client.readwrite(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('geoadd', () => {
      let testfn = () => { client.readwrite(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('geodist', () => {
      let testfn = () => { client.geodist(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('geohash', () => {
      let testfn = () => { client.geohash(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('geopos', () => {
      let testfn = () => { client.geopos(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('georadius', () => {
      let testfn = () => { client.georadius(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('georadiusbymember', () => {
      let testfn = () => { client.georadiusbymember(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('hscan', () => {
      let testfn = () => { client.hscan(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('pfadd', () => {
      let testfn = () => { client.pfadd(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('pfcount', () => {
      let testfn = () => { client.pfcount(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('pfmerge', () => {
      let testfn = () => { client.pfmerge(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('migrate', () => {
      let testfn = () => { client.migrate(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('object', () => {
      let testfn = () => { client.object(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('scan', () => {
      let testfn = () => { client.scan(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('sort', () => {
      let testfn = () => { client.sort(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('wait', () => {
      let testfn = () => { client.wait(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('blpop', () => {
      let testfn = () => { client.blpop(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('brpop', () => {
      let testfn = () => { client.brpop(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('brpoplpush', () => {
      let testfn = () => { client.brpoplpush(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('psubscribe', () => {
      let testfn = () => { client.psubscribe(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('pubsub', () => {
      let testfn = () => { client.pubsub(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('publish', () => {
      let testfn = () => { client.publish(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('punsubscribe', () => {
      let testfn = () => { client.punsubscribe(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('suscribe', () => {
      let testfn = () => { client.suscribe(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('unsubscribe', () => {
      let testfn = () => { client.unsubscribe(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('script', () => {
      let testfn = () => { client.script(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('bgrewriteaof', () => {
      let testfn = () => { client.bgrewriteaof(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('client', () => {
      let testfn = () => { client.client(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('config', () => {
      let testfn = () => { client.config(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('debug', () => {
      let testfn = () => { client.debug(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('monitor', () => {
      let testfn = () => { client.monitor(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('shutdown', () => {
      let testfn = () => { client.shutdown(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('slaveof', () => {
      let testfn = () => { client.slaveof(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('slowlog', () => {
      let testfn = () => { client.slowlog(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('sync', () => {
      let testfn = () => { client.sync(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('sscan', () => {
      let testfn = () => { client.sscan(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('zinterstore', () => {
      let testfn = () => { client.zinterstore(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('zunionstore', () => {
      let testfn = () => { client.zunionstore(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('zscan', () => {
      let testfn = () => { client.zscan(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('bitfield', () => {
      let testfn = () => { client.bitfield(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('unwatch', () => {
      let testfn = () => { client.unwatch(); }
      expect(testfn).to.throw(MemoryCacheError);
    });

    it('watch', () => {
      let testfn = () => { client.watch(); }
      expect(testfn).to.throw(MemoryCacheError);
    });
  });
});
