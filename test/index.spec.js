// test/index.js

/* eslint id-length: warn */
import { 
  afterAll,
  beforeAll,
  describe, 
  expect, 
  test as it,
} from '@jest/globals';
import lolex from 'lolex';

// Dependencies
import MemoryCache from '../index.js';
import { MemoryCacheError } from '../index.js';

describe('Memory Cache', () => {
  let client;
  beforeAll((done) => {
    client = new MemoryCache({ bypassUnsupported: false });
    done();
  });

  it('constructor', () => {
    expect(client instanceof MemoryCache).toBe(true);
  });

  describe('Core', () => {
    it('createClient', (done) => {
      client.once('ready', () => {
        expect(client.connected).toBe(true);
        done();
      });
      client.createClient();
    });

    it('auth', () => {
      expect(client.auth('password')).toBe('OK');
    });

    it('auth with callback', (done) => {
      client.auth('password', (err, res) => {
        expect(res).toBe('OK');
        done();
      });
    });

    it('echo', () => {
      expect(client.echo('message')).toBe('message');
    });

    it('echo with callback', (done) => {
      client.echo('message', (err, res) => {
        expect(res).toBe('message');
        done();
      });
    });

    it('ping', () => {
      expect(client.ping('message')).toBe('message');
    });

    it('ping (no message)', () => {
      expect(client.ping()).toBe('PONG');
    });

    it('ping with callback', (done) => {
      client.ping('message', (err, res) => {
        expect(res).toBe('message');
        done();
      });
    });

    it('quit', (done) => {
      client.once('end', () => {
        expect(client.connected).toBe(false);
        done();
      });
      client.quit();
    });

    it('end', (done) => {
      client.createClient();
      client.once('end', () => {
        expect(client.connected).toBe(false);
        done();
      });
      client.end();
    });
  });

  describe('Hash', () => {
    beforeAll(() => {
      client.createClient();
    });

    it('hset (non-existing)', () => {
      const val = client.hset('testkey', 'testfield', 1);
      expect(val).toBe(1);
    });

    it('hset (existing)', () => {
      const val = client.hset('testkey', 'testfield', 2);
      expect(val).toBe(0);
    });

    it('hset with callback', (done) => {
      client.hset('testkey', 'testfield2', 1, (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('hsetnx (non-existing key)', () => {
      const val = client.hsetnx('testkeyA', 'testfield', 0);
      expect(val).toBe(1);
    });

    it('hsetnx (non-existing field)', () => {
      const val = client.hsetnx('testkey', 'testfield3', 0);
      expect(val).toBe(1);
    });

    it('hsetnx (existing)', () => {
      const val = client.hsetnx('testkey', 'testfield3', 'm1');
      expect(val).toBe(0);
    });

    it('hsetnx with callback', (done) => {
      client.hsetnx('testkey', 'testfield4', 'shit', (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('hget (non-existing)', () => {
      const val = client.hget('testkey', 'testfield5');
      expect(val).toBe(null);
    });

    it('hget (existing)', () => {
      const val = client.hget('testkey', 'testfield3');
      expect(val).toBe('0');
    });

    it('hget with callback', (done) => {
      client.hget('testkey', 'testfield4', (err, res) => {
        expect(res).toBe('shit');
        done();
      });
    });

    it('hdel (non-existing)', () => {
      const val = client.hdel('testkey', 'testfield5');
      expect(val).toBe(0);
    });

    it('hdel (existing)', () => {
      const val = client.hdel('testkey', 'testfield');
      expect(val).toBe(1);
    });

    it('hdel with multi-callback', (done) => {
      client.hset('testkey', 'multi1', 1);
      client.hset('testkey', 'multi2', 1);
      client.hset('testkey', 'multi3', 1);
      client.hdel('testkey', 'multi1', 'multi2', 'multi3', (err, res) => {
        expect(res).toBe(3);
        done();
      });
    });

    it('hexists (non-existing)', () => {
      const val = client.hexists('testkey', 'testfield5');
      expect(val).toBe(0);
    });

    it('hexists (existing)', () => {
      const val = client.hexists('testkey', 'testfield3');
      expect(val).toBe(1);
    });

    it('hexists with callback', (done) => {
      client.hexists('testkey', 'testfield4', (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('hgetall', () => {
      const val = client.hgetall('testkey');
      expect(val instanceof Object).toBe(true);
      expect(Object.keys(val).includes('testfield2')).toBe(true);
      expect(Object.keys(val).includes('testfield3')).toBe(true);
      expect(Object.keys(val).includes('testfield4')).toBe(true);
      expect(val.testfield2).toBe('1');
      expect(val.testfield4).toBe('shit');
    });

    it('hgetall with callback', (done) => {
      client.hgetall('testkey', (err, res) => {
        expect(res instanceof Object).toBe(true);
        expect(Object.keys(res).includes('testfield2')).toBe(true);
        expect(Object.keys(res).includes('testfield3')).toBe(true);
        expect(Object.keys(res).includes('testfield4')).toBe(true);
        expect(res.testfield2).toBe('1');
        expect(res.testfield4).toBe('shit');
        done();
      });
    });

    it('hincrby (bad key/field)', () => {
      const testfn = () => {
        client.hincrby('testkey', 'testfield4', '12');
      };
      expect(testfn).toThrow('integer');
    });

    it('hincrby (bad value)', () => {
      const testfn = () => {
        client.hincrby('testkey', 'no-exist', 'fwq');
      };
      expect(testfn).toThrow('integer');
    });

    it('hincrby (non-existing key)', () => {
      const val = client.hincrby('testkeyalpha', 'non-exist', '12');
      expect(val).toBe(12);
      client.del('testkeyalpha');
    });

    it('hincrby (non-existing field)', () => {
      const val = client.hincrby('testkey', 'non-exist', '12');
      expect(val).toBe(12);
      client.hdel('testkey', 'no-exist');
    });

    it('hincrby (existing)', () => {
      const val = client.hincrby('testkey', 'testfield2', '12');
      expect(val).toBe(13);
    });

    it('hincrby with callback', (done) => {
      client.hincrby('testkey', 'testfield2', '12', (err, res) => {
        expect(res).toBe(25);
        done();
      });
    });

    it('hincrbyfloat (bad value)', () => {
      const testfn = () => {
        client.hincrbyfloat('testkey', 'no-exist', 'fwq');
      };
      expect(testfn).toThrow('float');
    });

    it('hincrbyfloat (bad key/field)', () => {
      const testfn = () => {
        client.hincrbyfloat('testkey', 'testfield4', '1.5');
      };
      expect(testfn).toThrow('float');
    });

    it('hincrbyfloat (non-existing)', () => {
      const val = client.hincrbyfloat('testkey', 'no-exist', '3.14');
      expect(val).toBe(3.14);
      client.hdel('testkey', 'no-exist');
    });

    it('hincrbyfloat (existing)', () => {
      const val = client.hincrbyfloat('testkey', 'testfield2', '1.5');
      expect(val).toBe(26.5);
    });

    it('hincrbyfloat with callback', (done) => {
      client.hincrbyfloat('testkey', 'testfield2', '-12.1', (err, res) => {
        expect(res).toBe(14.4);
        done();
      });
    });

    it('hkeys', () => {
      const val = client.hkeys('testkey');
      expect(val instanceof Array).toBe(true);
      expect(val).toContain('testfield2');
      expect(val).toContain('testfield3');
      expect(val).toContain('testfield4');
    });

    it('hkeys with callback', (done) => {
      client.hkeys('testkey', (err, res) => {
        expect(res instanceof Array).toBe(true);
        expect(res).toContain('testfield2');
        expect(res).toContain('testfield3');
        expect(res).toContain('testfield4');
        done();
      });
    });

    it('hlen', () => {
      const val = client.hlen('testkey');
      expect(val).toBe(4);
    });

    it('hlen with callback', (done) => {
      client.hlen('testkey', (err, res) => {
        expect(res).toBe(4);
        done();
      });
    });

    it('hmget multi-field (non-exist key)', () => {
      const val = client.hmget('testkey2', 'a', 'b', 'c');
      expect(val).toContain(null);
      expect(val.length).toBe(3);
    });

    it('hmget multi-field', () => {
      const val = client.hmget('testkey', 'testfield2', 'testfield4', 'testfield5');
      expect(val).toContain('14.4');
      expect(val).toContain('shit');
      expect(val).toContain(null);
      expect(val.indexOf(null)).toBe(2);
    });

    it('hmget multi-field with callback', (done) => {
      client.hmget('testkey', 'testfield2', 'testfield4', 'testfield5', (err, res) => {
        expect(res).toContain('14.4');
        expect(res).toContain('shit');
        expect(res).toContain(null);        
        expect(res.indexOf(null)).toBe(2);
        done();
      });
    });

    it('hmset (no params)', () => {
      const testfn = () => {
        client.hmset('testkey2');
      };
      expect(testfn).toThrow('wrong number');
    });

    it('hmset (bad param count multi-field object)', () => {
      const testfn = () => {
        client.hmset('testkey2', { x: '123' }, 'x');
      };
      expect(testfn).toThrow('wrong number');
    });

    it('hmset (bad field-value pairs)', () => {
      const testfn = () => {
        client.hmset('testkey2', 'x', '123', 'r');
      };
      expect(testfn).toThrow('wrong number');
    });

    it('hmset multi-field object (non-exist key)', () => {
      const val = client.hmset('testkey2', { a: 'a', b: 'b', c: 'c' });
      expect(val).toBe('OK');
    });

    it('hmset multi-field object (existing key)', () => {
      const val = client.hmset('testkey2', { a: 'z', d: 'd' });
      expect(val).toBe('OK');
    });

    it('hmset multi-field object with callback', (done) => {
      client.hmset('testkey2', { e: 'e', f: '1234' }, (err, res) => {
        expect(res).toBe('OK');
        done();
      });
    });

    it('hmset field-value pairs', () => {
      const val = client.hmset('testkey2', 'q', '123', 'r', '987');
      expect(val).toBe('OK');
    });

    it('hmset field-value pairs with callback', (done) => {
      client.hmset('testkey2', 'x', 'v', 'y', 'w', (err, res) => {
        expect(res).toBe('OK');
        done();
      });
    });

    it('hmgetall results from hmset', () => {
      const val = client.hkeys('testkey2');
      expect(val).toContain('a', 'b', 'c', 'd', 'e', 'f', 'q', 'r', 'x', 'y');
      const val2 = client.hvals('testkey2');
      expect(val2).toContain('z', 'b', 'c', 'd', 'e', '1234', '123', '987', 'v', 'w');
    });

    it('hstrlen (non-existing)', () => {
      const val = client.hstrlen('testkey', 'testfield5');
      expect(val).toBe(0);
    });

    it('hstrlen (existing)', () => {
      const test = client.hstrlen('testkey', 'testfield3');
      expect(test).toBe(1);
    });

    it('hstrlen with callback', (done) => {
      client.hstrlen('testkey', 'testfield4', (err, res) => {
        expect(res).toBe(4);
        done();
      });
    });

    it('hvals', () => {
      const val = client.hvals('testkey');
      expect(val instanceof Array).toBe(true);
      expect(val).toContain('14.4', 'shit', '0');      
    });

    it('hvals with callback', (done) => {
      client.hvals('testkey', (err, res) => {
        expect(res instanceof Array).toBe(true);
        expect(res).toContain('14.4', 'shit', '0');
        done();
      });
    });
  });

  describe('Key Maintenance', () => {
    let clock;
    beforeAll(() => {
      clock = lolex.install();
    });

    afterAll(() => {
      clock.uninstall();
    });

    it('del', () => {
      const val = client.del('testkey2', 'no-exist');
      expect(val).toBe(1);
    });

    it('del with callback', (done) => {
      client.del('no-exist', (err, res) => {
        expect(res).toBe(0);
        done();
      });
    });

    it('dump', () => {
      const val = client.dump('testkey');
      expect(typeof val).toBe('string');
      expect(typeof JSON.parse(val)).toBe('object');
    });

    it('dump with callback', (done) => {
      client.dump('testkey', (err, res) => {
        expect(typeof res).toBe('string');
        expect(typeof JSON.parse(res)).toBe('object');
        done();
      });
    });

    it('exists', () => {
      const val = client.exists('no-exists', 'testkey');
      expect(val).toBe(1);
    });

    it('exists with callback', (done) => {
      client.exists('no-exists', 'testkey', (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('expire (non-existing)', () => {
      const val = client.expire('newkey', 1);
      expect(val).toBe(0);
    });

    it('expire (existing)', () => {
      client.hset('newkey', 'val1', 'test');
      let val = client.expire('newkey', 1);
      expect(val).toBe(1);
      clock.tick(1500);
      val = client.hget('newkey', 'val1');
      expect(val).toBe(null);
    });

    it('expire with callback', (done) => {
      client.hset('newkey', 'val1', 'test');
      client.expire('newkey', 1, (err, res) => {
        expect(res).toBe(1);
        clock.tick(1500);
        const val = client.hget('newkey', 'val1');
        expect(val).toBe(null);
        done();
      });
    });

    it('expireat (non-existing)', () => {
      const val = client.expireat('newkey', 4500);
      expect(val).toBe(0);
    });

    it('expireat (existing)', () => {
      client.hset('newkey', 'val1', 'test');
      let val = client.expireat('newkey', 4);
      expect(val).toBe(1);
      clock.tick(1500);
      val = client.hget('newkey', 'val1');
      expect(val).toBe(null);
    });

    it('expireat with callback', (done) => {
      client.hset('newkey', 'val1', 'test');
      client.expireat('newkey', 5, (err, res) => {
        expect(res).toBe(1);
        clock.tick(1500);
        res = client.hget('newkey', 'val1');
        expect(res).toBe(null);
        done();
      });
    });

    it('keys (no pattern)', () => {
      const val = client.keys();
      expect(val).toContain('testkey');
    });

    it('keys (no matches)', () => {
      const val = client.keys('nokey*');
      expect(val).toBe.empty;
    });

    it('keys with callback', (done) => {
      client.keys('test*', (err, res) => {
        expect(res).toContain('testkey');
        done();
      });
    });

    it('move (bad dbindex)', () => {
      const testfn = () => {
        client.move('test', 'lame');
      };
      expect(testfn).toThrow('invalid DB index');
    });

    it('move (non-existing)', () => {
      const val = client.move('test', 1);
      expect(val).toBe(0);
    });

    it('move (existing)', () => {
      client.hset('testkey2', 'val', 1);
      let val = client.move('testkey2', 1);
      expect(val).toBe(1);
      val = client.exists('testkey2');
      expect(val).toBe(0);
    });

    it('move (already existing target)', () => {
      client.hset('testkey2', 'val', 1);
      const val = client.move('testkey2', 1);
      expect(val).toBe(0);
    });

    it('move with callback', (done) => {
      client.hset('testkey3', 'val', 1);
      client.move('testkey3', 1, (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('persist (non-existing)', () => {
      const val = client.persist('newkey');
      expect(val).toBe(0);
    });

    it('persist (existing)', () => {
      client.hset('newkey', 'val1', 'test');
      client.expire('newkey', 1);
      let val = client.persist('newkey');
      expect(val).toBe(1);
      clock.tick(1500);
      val = client.hget('newkey', 'val1');
      expect(val).toBe('test');
    });

    it('persist with callback', (done) => {
      client.expire('newkey', 1);
      client.persist('newkey', (err, res) => {
        expect(res).toBe(1);
        clock.tick(1500);
        const val = client.hget('newkey', 'val1');
        expect(val).toBe('test');
        done();
      });
    });

    it('pexpire (non-existing)', () => {
      const val = client.pexpire('newkey2', 1);
      expect(val).toBe(0);
    });

    it('pexpire (existing)', () => {
      client.hset('newkey', 'val1', 'test');
      let val = client.pexpire('newkey', 1);
      expect(val).toBe(1);
      clock.tick(2);
      val = client.hget('newkey', 'val1');
      expect(val).toBe(null);
    });

    it('pexpire with callback', (done) => {
      client.hset('newkey', 'val1', 'test');
      client.pexpire('newkey', 1, (err, res) => {
        expect(res).toBe(1);
        clock.tick(2);
        const val = client.hget('newkey', 'val1');
        expect(val).toBe(null);
        done();
      });
    });

    it('pexpireat (non-existing)', () => {
      const val = client.pexpireat('no-key', 5);
      expect(val).toBe(0);
    });

    it('pexpireat (existing)', () => {
      client.hset('no-key', 'val1', 'test');
      let val = client.pexpireat('no-key', 10000);
      expect(val).toBe(1);
      clock.tick(1096);
      val = client.hget('no-key', 'val1');
      expect(val).toBe(null);
    });

    it('pexpireat with callback', (done) => {
      client.hset('no-key', 'val1', 'test');
      client.pexpireat('no-key', 10200, (err, res) => {
        expect(res).toBe(1);
        clock.tick(200);
        res = client.hget('no-key', 'val1');
        expect(res).toBe(null);
        done();
      });
    });

    it('pttl (non-existing)', () => {
      const val = client.pttl('no-key');
      expect(val).toBe(-2);
    });

    it('pttl (existing no expire)', () => {
      client.hset('no-key', 'val1', 'test');
      const val = client.pttl('no-key');
      expect(val).toBe(-1);
    });

    it('pttl (existing)', () => {
      client.pexpireat('no-key', 10400);
      const val = client.pttl('no-key');
      expect(val).toBe(100);
    });

    it('pttl with callback', (done) => {
      client.pttl('no-key', (err, res) => {
        expect(res).toBe(100);
        done();
      });
    });

    it('randomkey', () => {
      const val = client.randomkey();
      expect(val).not.toBe(null);
    });

    it('randomkey with callback', (done) => {
      client.randomkey((err, res) => {
        expect(res).not.toBe(null);
        done();
      });
    });

    it('rename (non-existing)', () => {
      const testfn = () => {
        client.rename('lame', 'somekey');
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('rename (existing)', () => {
      const val = client.rename('no-key', 'somekey');
      expect(val).toBe('OK');
    });

    it('rename with callback', (done) => {
      client.rename('somekey', 'no-key', (err, res) => {
        expect(res).toBe('OK');
        done();
      });
    });

    it('renamenx (non-existing)', () => {
      const testfn = () => {
        client.renamenx('lame', 'somekey');
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('renamenx (already existing dest)', () => {
      const val = client.renamenx('no-key', 'testkey');
      expect(val).toBe(0);
    });

    it('renamenx (already existing dest)', () => {
      const val = client.renamenx('no-key', 'somekey');
      expect(val).toBe(1);
    });

    it('renamenx with callback', (done) => {
      client.renamenx('somekey', 'no-key', (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('restore (already exists)', () => {
      const dump = client.dump('no-key');
      const testfn = () => {
        client.restore('testkey', null, dump);
      };
      expect(testfn).toThrow('busy');
    });

    it('restore (bad payload)', () => {
      const dump = 'garbage';
      const testfn = () => {
        client.restore('somekey', null, dump);
      };
      expect(testfn).toThrow('payload');
    });

    it('restore', () => {
      const dump = client.dump('no-key');
      const val = client.restore('somekey', 1500, dump);
      expect(val).toBe('OK');
    });

    it('restore (replace existing)', () => {
      const dump = client.dump('no-key');
      const val = client.restore('no-key', 16000, dump, true);
      expect(val).toBe('OK');
    });

    it('restore with callback', (done) => {
      const dump = client.dump('no-key');
      client.restore('somekey', 16000, dump, true, (err, res) => {
        expect(res).toBe('OK');
        done();
      });
    });

    it('touch', () => {
      clock.tick(1000);
      const val = client.touch('no-key', 'somekey', 'bad');
      expect(val).toBe(2);
      expect(client.cache['no-key'].lastAccess).toBe(Date.now());
    });

    it('touch with callback', (done) => {
      clock.tick(1000);
      client.touch('no-key', 'somekey', 'bad', (err, res) => {
        expect(res).toBe(2);
        expect(client.cache['no-key'].lastAccess).toBe(Date.now());
        done();
      });
    });

    it('ttl', () => {
      const val = client.ttl('somekey');
      expect(val).toBe(14);
    });

    it('ttl with callback', (done) => {
      client.ttl('somekey', (err, res) => {
        expect(res).toBe(14);
        done();
      });
    });

    it('type (non-existing)', () => {
      const val = client.type('bad');
      expect(val).toBe('none');
    });

    it('type', () => {
      const val = client.type('somekey');
      expect(val).toBe('hash');
    });

    it('type with callback', (done) => {
      client.type('somekey', (err, res) => {
        expect(res).toBe('hash');
        done();
      });
    });

    it('unlink', () => {
      const val = client.unlink('somekey', 'bad');
      expect(val).toBe(1);
    });

    it('unlink with callback', (done) => {
      client.unlink('somekey', 'bad', (err, res) => {
        expect(res).toBe(0);
        done();
      });
    });
  });

  describe('Lists', () => {
    it('lpush (wrong type)', () => {
      const testfn = () => {
        client.lpush('no-key', '1');
      };
      expect(testfn).toThrow('WRONGTYPE');
    });

    it('lpush', () => {
      let val = client.lpush('listkey', '1');
      expect(val).toBe(1);
      val = client.lpush('listkey', '12');
      expect(val).toBe(2);
    });

    it('lpush with callback', (done) => {
      client.lpush('listkey', 'abc', (err, res) => {
        expect(res).toBe(3);
        done();
      });
    });

    it('lpushx', () => {
      const val = client.lpushx('bad', '1');
      expect(val).toBe(0);
    });

    it('lpushx with callback', (done) => {
      client.lpushx('listkey', 'zyx', (err, res) => {
        expect(res).toBe(4);
        done();
      });
    });

    it('lindex', () => {
      const val = client.lindex('listkey', 0);
      expect(val).toBe('zyx');
    });

    it('lindex (negative index)', () => {
      const val = client.lindex('listkey', -1);
      expect(val).toBe('1');
    });

    it('lindex with callback', (done) => {
      client.lindex('listkey', 1, (err, res) => {
        expect(res).toBe('abc');
        done();
      });
    });

    it('linsert (non-existing)', () => {
      const val = client.linsert('listkey2', 'before', 1, 'def');
      expect(val).toBe(-1);
    });

    it('linsert', () => {
      const val = client.linsert('listkey', 'before', 1, 'def');
      expect(val).toBe(5);
    });

    it('linsert (out of range)', () => {
      const val = client.linsert('listkey', 'before', 10, 'uvw');
      expect(val).toBe(-1);
    });

    it('linsert with callback', (done) => {
      client.linsert('listkey', 'after', 1, 'uvw', (err, res) => {
        expect(res).toBe(6);
        done();
      });
    });

    it('llen (non-existing)', () => {
      const val = client.llen('listkey2');
      expect(val).toBe(0);
    });

    it('llen', () => {
      const val = client.llen('listkey');
      expect(val).toBe(6);
    });

    it('llen with callback', (done) => {
      client.llen('listkey', (err, res) => {
        expect(res).toBe(6);
        done();
      });
    });

    it('lpop (non-existing)', () => {
      const val = client.lpop('bad');
      expect(val).toBe(null);
    });

    it('lpop', () => {
      const val = client.lpop('listkey');
      expect(val).toBe('zyx');
    });

    it('lpop with callback', (done) => {
      client.lpop('listkey', (err, res) => {
        expect(res).toBe('def');
        done();
      });
    });

    it('lrange (non-existing)', () => {
      const val = client.lrange('bad', 1, 1);
      expect(val).toBe.empty;
    });

    it('lrange', () => {
      const val = client.lrange('listkey', -4, -1);
      expect(val.length).toBe(4);
      expect(val).toContain('uvw', '1', '12', 'abc');
    });

    it('lrange with callback', (done) => {
      client.lrange('listkey', -100, 100, (err, res) => {
        expect(res.length).toBe(4);
        expect(res).toContain('uvw', 'abc');
        done();
      });
    });

    it('lrem (non-existing key)', () => {
      const val = client.lrem('bad', 1, 'thing');
      expect(val).toBe(0);
    });

    it('lrem (non-existing value)', () => {
      const val = client.lrem('listkey', -1, 'nope');
      expect(val).toBe(0);
    });

    it('lrem', () => {
      const val = client.lrem('listkey', 10, '12');
      expect(val).toBe(1);
    });

    it('lrem with callback', (done) => {
      client.lrem('listkey', -1, '1', (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('lset (non-existing key)', () => {
      const testfn = () => {
        client.lset('bad', 1, '1');
      };
      expect(testfn).toThrow('no such key');
    });

    it('lset (out-of-range)', () => {
      const testfn = () => {
        client.lset('listkey', 10, '1');
      };
      expect(testfn).toThrow('out of range');
    });

    it('lset (bad index)', () => {
      const testfn = () => {
        client.lset('listkey', 'mm', '1');
      };
      expect(testfn).toThrow('not an integer');
    });

    it('lset', () => {
      const val = client.lset('listkey', 0, 'abc');
      expect(val).toBe('OK');
    });

    it('lset with callback', (done) => {
      client.lset('listkey', 1, 'def', (err, res) => {
        expect(res).toBe('OK');
        done();
      });
    });

    it('rpush (non-existing)', () => {
      const val = client.rpush('listkey3', 'abc');
      expect(val).toBe(1);
    });

    it('rpush', () => {
      let val = client.rpush('listkey', 'ghi');
      expect(val).toBe(3);
      val = client.rpush('listkey', 'jkl');
      expect(val).toBe(4);
    });

    it('rpush with callback', (done) => {
      client.rpush('listkey', 'mno', (err, res) => {
        expect(res).toBe(5);
        done();
      });
    });

    it('rpushx (non-existing)', () => {
      const val = client.rpushx('bad', '1');
      expect(val).toBe(0);
    });

    it('rpushx', () => {
      const val = client.rpushx('listkey', 'pqr');
      expect(val).toBe(6);
    });

    it('rpushx with callback', (done) => {
      client.rpushx('listkey', 'st', (err, res) => {
        expect(res).toBe(7);
        done();
      });
    });

    it('rpop (non-existing)', () => {
      const val = client.rpop('bad');
      expect(val).toBe(null);
    });

    it('rpop', () => {
      const val = client.rpop('listkey');
      expect(val).toBe('st');
    });

    it('rpop with callback', (done) => {
      client.rpop('listkey', (err, res) => {
        expect(res).toBe('pqr');
        done();
      });
    });

    it('rpoplpush (non-existing)', () => {
      const val = client.rpoplpush('bad');
      expect(val).toBe(null);
    });

    it('rpoplpush', () => {
      let val = client.rpoplpush('listkey', 'listkey');
      expect(val).toBe('mno');
      val = client.lindex('listkey', 0);
      expect(val).toBe('mno');
    });

    it('rpoplpush with callback', (done) => {
      client.rpoplpush('listkey', 'listkey', (err, res) => {
        expect(res).toBe('jkl');
        const val = client.lindex('listkey', 0);
        expect(val).toBe('jkl');
        done();
      });
    });

    it('ltrim (index out of range)', () => {
      const testfn = () => {
        client.ltrim('listkey', 1000, 1);
      };
      expect(testfn).toThrow('out of range');
    });

    it('ltrim (non-existing)', () => {
      const val = client.ltrim('bad', 1, 1);
      expect(val).toBe('OK');
    });

    it('ltrim', () => {
      client.rpush('listkey', '111');
      let val = client.ltrim('listkey', -4, -2);
      expect(val).toBe('OK');
      val = client.llen('listkey');
      expect(val).toBe(3);
      expect(client.cache.listkey.value).toContain('abc', 'def', 'ghi');
    });

    it('ltrim with callback', (done) => {
      client.lpush('listkey', '111');
      client.rpush('listkey', '111');
      client.ltrim('listkey', 1, 100, (err, res) => {
        expect(res).toBe('OK');
        const val = client.llen('listkey');
        expect(val).toBe(4);
        expect(client.cache.listkey.value).toContain('abc', 'def', 'ghi');
        done();
      });
    });
  });

  describe('Sets', () => {
    it('sadd', () => {
      const val = client.sadd('setkey', 'abc', 'def', 'abc', 'ghi');
      expect(val).toBe(3);
    });

    it('sadd with callback', (done) => {
      client.sadd('setkey', 'abc', 'xyz', (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('scard (non-existing)', () => {
      const val = client.scard('bad');
      expect(val).toBe(0);
    });

    it('scard', () => {
      const val = client.scard('setkey');
      expect(val).toBe(4);
    });

    it('scard with callback', (done) => {
      client.scard('setkey', (err, res) => {
        expect(res).toBe(4);
        done();
      });
    });

    it('sdiff (non-existing)', () => {
      const val = client.sdiff('setkey2', 'setkey3', 'setkey4');
      expect(val).toBe.empty;
    });

    it('sdiff', () => {
      client.sadd('setkey2', 'def');
      client.sadd('setkey3', 'abc', 'def', 'xyz', 'mno');
      const val = client.sdiff('setkey', 'setkey2', 'setkey3', 'setkey4');
      expect(val.length).toBe(1);
      expect(val).toContain('ghi');
    });

    it('sdiff with callback', (done) => {
      client.sdiff('setkey', 'setkey2', 'setkey3', 'setkey4', (err, res) => {
        expect(res.length).toBe(1);
        expect(res).toContain('ghi');
        done();
      });
    });

    it('sdiffstore', () => {
      const val = client.sdiffstore('newset', 'setkey', 'setkey2', 'setkey3', 'setkey4');
      expect(val).toBe(1);
    });

    it('sdiffstore with callback', (done) => {
      client.sdiffstore('newset', 'setkey', 'setkey2', 'setkey3', 'setkey4', (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('sinter', () => {
      const val = client.sinter('setkey', 'setkey2', 'setkey3');
      expect(val.length).toBe(1);
      expect(val).toContain('def');
    });

    it('sinter with callback', (done) => {
      client.sinter('setkey', 'setkey2', 'setkey3', (err, res) => {
        expect(res.length).toBe(1);
        expect(res).toContain('def');
        done();
      });
    });

    it('sinterstore', () => {
      const val = client.sinterstore('newset', 'setkey', 'setkey2', 'setkey3');
      expect(val).toBe(1);
    });

    it('sinterstore with callback', (done) => {
      client.sdiffstore('newset', 'setkey', 'setkey2', 'setkey3', (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('sunion', () => {
      const val = client.sunion('setkey', 'setkey2', 'setkey3', 'setkey4');
      expect(val.length).toBe(5);
      expect(val).toContain('abc', 'def', 'ghi', 'mno', 'xyz');
    });

    it('sunion with callback', (done) => {
      client.sunion('setkey', 'setkey2', 'setkey3', 'setkey4', (err, res) => {
        expect(res.length).toBe(5);
        expect(res).toContain('abc', 'def', 'ghi', 'mno', 'xyz');
        done();
      });
    });

    it('sunionstore', () => {
      const val = client.sunionstore('newset', 'setkey', 'setkey2', 'setkey3');
      expect(val).toBe(4);
    });

    it('sunionstore with callback', (done) => {
      client.sunionstore('newset', 'setkey', 'setkey2', 'setkey3', 'setkey4', (err, res) => {
        expect(res).toBe(4);
        done();
      });
    });

    it('sismember (non-existing)', () => {
      const val = client.sismember('bad', 'a');
      expect(val).toBe(0);
    });

    it('sismember', () => {
      let val = client.sismember('setkey', 'a');
      expect(val).toBe(0);
      val = client.sismember('setkey', 'abc');
      expect(val).toBe(1);
    });

    it('sismember with callback', (done) => {
      client.sismember('setkey', 'abc', (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('smembers (non-existing)', () => {
      const val = client.smembers('badkey');
      expect(val).toBe.empty;
    });

    it('smembers', () => {
      const val = client.smembers('setkey');
      expect(val.length).toBe(4);
      expect(val).toContain('abc', 'def', 'ghi', 'xyz');
    });

    it('smembers with callback', (done) => {
      client.smembers('setkey', (err, res) => {
        expect(res.length).toBe(4);
        expect(res).toContain('abc', 'def', 'ghi', 'xyz');
        done();
      });
    });

    it('smove (non-existing)', () => {
      const val = client.smove('bad', 'newkey', 'a');
      expect(val).toBe(0);
    });

    it('smove', () => {
      const val = client.smove('setkey', 'newset', 'abc');
      expect(val).toBe(1);
    });

    it('smove with callback', (done) => {
      client.smove('newset', 'setkey', 'abc', (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('spop (bad count)', () => {
      const testfn = () => {
        client.spop('setkey', 'ggg');
      };
      expect(testfn).toThrow('integer');
    });

    it('spop (non-existing)', () => {
      const val = client.spop('bad');
      expect(val).toBe(null);
    });

    it('spop', () => {
      const val = client.spop('newset', 2);
      expect(val.length).toBe(2);
    });

    it('spop with callback', (done) => {
      client.spop('newset', 2, (err, res) => {
        expect(res.length).toBe(1);
        done();
      });
    });

    it('srandmember (bad count)', () => {
      const testfn = () => {
        client.srandmember('setkey', 'ggg');
      };
      expect(testfn).toThrow('integer');
    });

    it('srandmember (non-existing)', () => {
      const val = client.srandmember('bad');
      expect(val).toBe(null);
    });

    it('srandmember (non-existing /w count)', () => {
      const val = client.srandmember('bad', 1);
      expect(val).toBe.empty;
    });

    it('srandmember (no count)', () => {
      const val = client.srandmember('setkey');
      expect(val.length).toBe(1);
    });

    it('srandmember (positive count)', () => {
      const val = client.srandmember('setkey', 10);
      expect(val.length).toBe(4);
    });

    it('srandmember (negative count)', () => {
      const val = client.srandmember('setkey', -10);
      expect(val.length).toBe(10);
    });

    it('srandmember with callback', (done) => {
      client.srandmember('setkey', 1, (err, res) => {
        expect(res.length).toBe(1);
        done();
      });
    });

    it('srem (non-existing)', () => {
      const val = client.srem('bad', 'a', 'b');
      expect(val).toBe(0);
    });

    it('srem', () => {
      const val = client.srem('setkey', 'a', 'xyz');
      expect(val).toBe(1);
    });

    it('srem with callback', (done) => {
      client.srem('setkey', 'ghi', '123', (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });
  });

  describe('Sorted Sets', () => {
    it('zadd (no score)', () => {
      const testfn = () => {
        client.zadd('sortedkey', 'xx');
      };
      expect(testfn).toThrow('wrong number');
    });

    it('zadd (mismatched pairs)', () => {
      const testfn = () => {
        client.zadd('sortedkey', 1.2);
      };
      expect(testfn).toThrow('wrong number');
    });

    it('zadd (bad flags [mutex])', () => {
      const testfn = () => {
        client.zadd('sortedkey', 'nx', 'xx', 1.2, 'value');
      };
      expect(testfn).toThrow('XX and NX');
    });

    it('zadd (bad flags [unknown])', () => {
      const testfn = () => {
        client.zadd('sortedkey', 'ccc', 1.2, 'value');
      };
      expect(testfn).toThrow('syntax');
    });

    it('zadd', () => {
      const val = client.zadd('sortedkey', 1.2, 'lame');
      expect(val).toBe(1);
    });

    it('zadd (incr and ch flags)', () => {
      let val = client.zadd('sortedkey', 'incr', 'ch', 1.2, 'lame');
      expect(val).toBe(1);
      val = client.zscore('sortedkey', 'lame');
      expect(val).toBe(2.4);
    });

    it('zadd (nx flags)', () => {
      const val = client.zadd('sortedkey', 'ch', 'nx', 1.2, 'lame');
      expect(val).toBe(0);
    });

    it('zadd (xx flags)', () => {
      let val = client.zadd('sortedkey', 'ch', 'xx', 2, 'lame');
      expect(val).toBe(1);
      val = client.zscore('sortedkey', 'lame');
      expect(val).toBe(2);
    });

    it('zadd with callback', (done) => {
      client.zadd('sortedkey', 1.2, 'lame2', (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('zcard (non-existing)', () => {
      const val = client.zcard('bad');
      expect(val).toBe(0);
    });

    it('zcard', () => {
      const val = client.zcard('sortedkey');
      expect(val).toBe(2);
    });

    it('zcard with callback', (done) => {
      client.zcard('sortedkey', (err, res) => {
        expect(res).toBe(2);
        done();
      });
    });

    it('zcount (bad range min)', () => {
      const testfn = () => {
        client.zcount('sortedkey', '+ad', '2');
      };
      expect(testfn).toThrow('float');
    });

    it('zcount (bad range max)', () => {
      const testfn = () => {
        client.zcount('sortedkey', '1', '+ad');
      };
      expect(testfn).toThrow('float');
    });

    it('zcount (reversed order)', () => {
      const val = client.zcount('sortedkey', '+inf', '-inf');
      expect(val).toBe(0);
    });

    it('zcount (exclusive range)', () => {
      const val = client.zcount('sortedkey', '(1', '(2');
      expect(val).toBe(1);
    });

    it('zcount (inclusive range)', () => {
      const val = client.zcount('sortedkey', '1', '2');
      expect(val).toBe(2);
    });

    it('zcount with callback', (done) => {
      client.zcount('sortedkey', '1', '(2', (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('zincrby (bad incr)', () => {
      const testfn = () => {
        client.zincrby('sortedkey', 'lame', 'lame2');
      };
      expect(testfn).toThrow('float');
    });

    it('zincrby (non-existing key)', () => {
      let val = client.zincrby('sortedkey3', -2, 'lame');
      expect(val).toBe(-2);
      val = client.zcard('sortedkey3');
      expect(val).toBe(1);
    });

    it('zincrby (non-existing member)', () => {
      let val = client.zincrby('sortedkey', -2, 'other');
      expect(val).toBe(-2);
      val = client.zcard('sortedkey');
      expect(val).toBe(3);
    });

    it('zincrby', () => {
      const val = client.zincrby('sortedkey', -0.5, 'lame2');
      expect(val).toBe(0.7);
    });

    it('zincrby with callback', (done) => {
      client.zincrby('sortedkey', 0.5, 'lame2', (err, res) => {
        expect(res).toBe(1.2);
        done();
      });
    });

    it('zlexcount (bad range start)', () => {
      const testfn = () => {
        client.zlexcount('sortedkey', 'd', '[a');
      };
      expect(testfn).toThrow('not valid string');
    });

    it('zlexcount (bad range end)', () => {
      const testfn = () => {
        client.zlexcount('sortedkey', '[a', 'a');
      };
      expect(testfn).toThrow('not valid string');
    });

    it('zlexcount (reversed order)', () => {
      const val = client.zlexcount('sortedkey', '+', '-');
      expect(val).toBe(0);
    });

    it('zlexcount (all)', () => {
      const val = client.zlexcount('sortedkey', '-', '+');
      expect(val).toBe(3);
    });

    it('zlexcount (exclusive range)', () => {
      const val = client.zlexcount('sortedkey', '(l', '(other');
      expect(val).toBe(2);
    });

    it('zlexcount (inclusive range)', () => {
      const val = client.zlexcount('sortedkey', '[l', '[p');
      expect(val).toBe(3);
    });

    it('zlexcount with callback', (done) => {
      client.zlexcount('sortedkey', '[1', '[p', (err, res) => {
        expect(res).toBe(3);
        done();
      });
    });

    it('zrange (bad parameter count)', () => {
      const testfn = () => {
        client.zrange('sortedkey', 'd', 2, 'lame', 'lame');
      };
      expect(testfn).toThrow('syntax');
    });

    it('zrange (bad range start)', () => {
      const testfn = () => {
        client.zrange('sortedkey', 'd', 2);
      };
      expect(testfn).toThrow('integer');
    });

    it('zrange (bad range end)', () => {
      const testfn = () => {
        client.zrange('sortedkey', 1, 'd');
      };
      expect(testfn).toThrow('integer');
    });

    it('zrange (bad params)', () => {
      const testfn = () => {
        client.zrange('sortedkey', 1, 2, 'lame');
      };
      expect(testfn).toThrow('syntax');
    });

    it('zrange (reverse range)', () => {
      const val = client.zrange('sortedkey', 2, 1);
      expect(val).toBe.empty;
    });

    it('zrange (all)', () => {
      const val = client.zrange('sortedkey', 0, 100);
      expect(val.length).toBe(3);
      expect(val[0]).toBe('other');
      expect(val[2]).toBe('lame');
    });

    it('zrange', () => {
      const val = client.zrange('sortedkey', -3, -2);
      expect(val.length).toBe(2);
      expect(val[0]).toBe('other');
      expect(val[1]).toBe('lame2');
    });

    it('zrange (with scores)', () => {
      const val = client.zrange('sortedkey', -100, 1, 'withscores');
      expect(val.length).toBe(4);
      expect(val[0]).toBe('other');
      expect(val[2]).toBe('lame2');
    });

    it('zrange with callback', (done) => {
      client.zrange('sortedkey', 0, 1, (err, res) => {
        expect(res.length).toBe(2);
        expect(res[0]).toBe('other');
        expect(res[1]).toBe('lame2');
        done();
      });
    });

    it('zrangebylex (bad start range)', () => {
      const testfn = () => {
        client.zrangebylex('sortedkey', 'd', '[a');
      };
      expect(testfn).toThrow('not valid string');
    });

    it('zrangebylex (bad end range)', () => {
      const testfn = () => {
        client.zrangebylex('sortedkey', '[d', 'a');
      };
      expect(testfn).toThrow('not valid string');
    });

    it('zrevrangebylex (bad params count)', () => {
      const testfn = () => {
        client.zrangebylex('sortedkey', '[d', '[a', 'lame');
      };
      expect(testfn).toThrow('syntax');
    });

    it('zrangebylex (bad params)', () => {
      const testfn = () => {
        client.zrangebylex('sortedkey', '[d', '[a', 'lame', 1, 2);
      };
      expect(testfn).toThrow('syntax');
    });

    it('zrangebylex (bad limit -- too few)', () => {
      const testfn = () => {
        client.zrangebylex('sortedkey', '[d', '[a', 'limit');
      };
      expect(testfn).toThrow('syntax');
    });

    it('zrangebylex (bad limit -- too many)', () => {
      const testfn = () => {
        client.zrangebylex('sortedkey', '[d', '[a', 'limit', 1, 2, 'sick');
      };
      expect(testfn).toThrow('syntax');
    });

    it('zrangebylex (bad limit offset)', () => {
      const testfn = () => {
        client.zrangebylex('sortedkey', '[d', '[a', 'limit', 'a', 2);
      };
      expect(testfn).toThrow('integer');
    });

    it('zrangebylex (bad limit count)', () => {
      const testfn = () => {
        client.zrangebylex('sortedkey', '[d', '[a', 'limit', 1, 'a');
      };
      expect(testfn).toThrow('integer');
    });

    it('zrangebylex (reverse order)', () => {
      const val = client.zrangebylex('sortedkey', '+', '-');
      expect(val).toBe.empty;
    });

    it('zrangebylex (all)', () => {
      const val = client.zrangebylex('sortedkey', '-', '+');
      expect(val.length).toBe(3);
      expect(val[0]).toBe('lame');
      expect(val[2]).toBe('other');
    });

    it('zrangebylex (all with limit)', () => {
      const val = client.zrangebylex('sortedkey', '-', '+', 'limit', 1, 2);
      expect(val.length).toBe(2);
      expect(val[0]).toBe('lame2');
      expect(val[1]).toBe('other');
    });

    it('zrangebylex (exclusive range)', () => {
      const val = client.zrangebylex('sortedkey', '(l', '(other');
      expect(val.length).toBe(2);
      expect(val[0]).toBe('lame');
      expect(val[1]).toBe('lame2');
    });

    it('zrangebylex (inclusive range)', () => {
      const val = client.zrangebylex('sortedkey', '[l', '[p');
      expect(val.length).toBe(3);
      expect(val[0]).toBe('lame');
      expect(val[2]).toBe('other');
    });

    it('zrangebylex with callback', (done) => {
      client.zrangebylex('sortedkey', '[l', '[p', (err, res) => {
        expect(res.length).toBe(3);
        expect(res[0]).toBe('lame');
        expect(res[2]).toBe('other');
        done();
      });
    });

    it('zrangebyscore (bad start range)', () => {
      const testfn = () => {
        client.zrangebyscore('sortedkey', 'd', 2);
      };
      expect(testfn).toThrow('float');
    });

    it('zrangebyscore (bad end range)', () => {
      const testfn = () => {
        client.zrangebyscore('sortedkey', 1, 'a');
      };
      expect(testfn).toThrow('float');
    });

    it('zrangebyscore (bad params)', () => {
      const testfn = () => {
        client.zrangebyscore('sortedkey', 1, 2, 'lame');
      };
      expect(testfn).toThrow('syntax');
    });

    it('zrangebyscore (bad limit -- too many)', () => {
      const testfn = () => {
        client.zrangebyscore('sortedkey', 1, 2, 'limit', 1, 2, 'all');
      };
      expect(testfn).toThrow('wrong number');
    });

    it('zrangebyscore (bad limit -- too few)', () => {
      const testfn = () => {
        client.zrangebyscore('sortedkey', 1, 2, 'limit');
      };
      expect(testfn).toThrow('wrong number');
    });

    it('zrangebyscore (bad limit offset)', () => {
      const testfn = () => {
        client.zrangebyscore('sortedkey', 1, 2, 'limit', 'a', 2);
      };
      expect(testfn).toThrow('integer');
    });

    it('zrangebyscore (bad limit count)', () => {
      const testfn = () => {
        client.zrangebyscore('sortedkey', 1, 2, 'limit', 1, 'a');
      };
      expect(testfn).toThrow('integer');
    });

    it('zrangebyscore (reverse order)', () => {
      const val = client.zrangebyscore('sortedkey', '+inf', '-inf');
      expect(val).toBe.empty;
    });

    it('zrangebyscore (all)', () => {
      const val = client.zrangebyscore('sortedkey', '-inf', '+inf');
      expect(val.length).toBe(3);
      expect(val[0]).toBe('other');
      expect(val[2]).toBe('lame');
    });

    it('zrangebyscore (all with limit)', () => {
      const val = client.zrangebyscore('sortedkey', '-inf', '+inf', 'limit', 1, 2);
      expect(val.length).toBe(2);
      expect(val[0]).toBe('lame2');
      expect(val[1]).toBe('lame');
    });

    it('zrangebyscore (all with limit withscores)', () => {
      const val = client.zrangebyscore('sortedkey', '-inf', '+inf', 'withscores', 'limit', 1, 2);
      expect(val.length).toBe(4);
      expect(val[0]).toBe('lame2');
      expect(val[2]).toBe('lame');
    });

    it('zrangebyscore (all withscores)', () => {
      const val = client.zrangebyscore('sortedkey', '-inf', '+inf', 'withscores');
      expect(val.length).toBe(6);
      expect(val[0]).toBe('other');
      expect(val[4]).toBe('lame');
    });

    it('zrangebyscore (exclusive range)', () => {
      const val = client.zrangebyscore('sortedkey', '(1.0', '(2.0');
      expect(val.length).toBe(1);
      expect(val[0]).toBe('lame2');
    });

    it('zrangebyscore (inclusive range)', () => {
      const val = client.zrangebyscore('sortedkey', '1.0', '2.0');
      expect(val.length).toBe(2);
      expect(val[0]).toBe('lame2');
      expect(val[1]).toBe('lame');
    });

    it('zrangebyscore with callback', (done) => {
      client.zrangebyscore('sortedkey', '1.0', '2.0', (err, res) => {
        expect(res.length).toBe(2);
        expect(res[0]).toBe('lame2');
        expect(res[1]).toBe('lame');
        done(0);
      });
    });

    it('zrank (non-existing key)', () => {
      const val = client.zrank('bad', 'll');
      expect(val).toBe(null);
    });

    it('zrank (non-existing member)', () => {
      const val = client.zrank('sortedkey', 'll');
      expect(val).toBe(null);
    });

    it('zrank', () => {
      const val = client.zrank('sortedkey', 'other');
      expect(val).toBe(0);
    });

    it('zrank with callback', (done) => {
      client.zrank('sortedkey', 'lame', (err, res) => {
        expect(res).toBe(2);
        done();
      });
    });

    it('zrevrange (bad parameter count)', () => {
      const testfn = () => {
        client.zrevrange('sortedkey', 'd', 2, 'lame', 'lame');
      };
      expect(testfn).toThrow('syntax');
    });

    it('zrevrange (bad range start)', () => {
      const testfn = () => {
        client.zrevrange('sortedkey', 'd', 2);
      };
      expect(testfn).toThrow('integer');
    });

    it('zrevrange (bad range end)', () => {
      const testfn = () => {
        client.zrevrange('sortedkey', 1, 'd');
      };
      expect(testfn).toThrow('integer');
    });

    it('zrevrange (bad params)', () => {
      const testfn = () => {
        client.zrevrange('sortedkey', 1, 2, 'lame');
      };
      expect(testfn).toThrow('syntax');
    });

    it('zrevrange (reverse range)', () => {
      const val = client.zrevrange('sortedkey', 2, 1);
      expect(val).toBe.empty;
    });

    it('zrevrange (all)', () => {
      const val = client.zrevrange('sortedkey', 0, 100);
      expect(val.length).toBe(3);
      expect(val[0]).toBe('lame');
      expect(val[2]).toBe('other');
    });

    it('zrevrange', () => {
      const val = client.zrevrange('sortedkey', -3, -2);
      expect(val.length).toBe(2);
      expect(val[0]).toBe('lame');
      expect(val[1]).toBe('lame2');
    });

    it('zrevrange (with scores)', () => {
      const val = client.zrevrange('sortedkey', -100, 1, 'withscores');
      expect(val.length).toBe(4);
      expect(val[0]).toBe('lame');
      expect(val[2]).toBe('lame2');
    });

    it('zrevrange with callback', (done) => {
      client.zrevrange('sortedkey', 0, 1, (err, res) => {
        expect(res.length).toBe(2);
        expect(res[0]).toBe('lame');
        expect(res[1]).toBe('lame2');
        done();
      });
    });

    it('zrevrangebylex (bad start range)', () => {
      const testfn = () => {
        client.zrevrangebylex('sortedkey', 'd', '[a');
      };
      expect(testfn).toThrow('not valid string');
    });

    it('zrevrangebylex (bad end range)', () => {
      const testfn = () => {
        client.zrevrangebylex('sortedkey', '[d', 'a');
      };
      expect(testfn).toThrow('not valid string');
    });

    it('zrevrangebylex (bad params count)', () => {
      const testfn = () => {
        client.zrevrangebylex('sortedkey', '[d', '[a', 'lame');
      };
      expect(testfn).toThrow('syntax');
    });

    it('zrevrangebylex (bad params)', () => {
      const testfn = () => {
        client.zrevrangebylex('sortedkey', '[d', '[a', 'lame', 1, 2);
      };
      expect(testfn).toThrow('syntax');
    });

    it('zrevrangebylex (bad limit -- too few)', () => {
      const testfn = () => {
        client.zrevrangebylex('sortedkey', '[d', '[a', 'limit');
      };
      expect(testfn).toThrow('syntax');
    });

    it('zrevrangebylex (bad limit -- too many)', () => {
      const testfn = () => {
        client.zrevrangebylex('sortedkey', '[d', '[a', 'limit', 1, 2, 'sick');
      };
      expect(testfn).toThrow('syntax');
    });

    it('zrevrangebylex (bad limit offset)', () => {
      const testfn = () => {
        client.zrevrangebylex('sortedkey', '[d', '[a', 'limit', 'a', 2);
      };
      expect(testfn).toThrow('integer');
    });

    it('zrevrangebylex (bad limit count)', () => {
      const testfn = () => {
        client.zrevrangebylex('sortedkey', '[d', '[a', 'limit', 1, 'a');
      };
      expect(testfn).toThrow('integer');
    });

    it('zrevrangebylex (reverse order)', () => {
      const val = client.zrevrangebylex('sortedkey', '-', '+');
      expect(val).toBe.empty;
    });

    it('zrevrangebylex (all)', () => {
      const val = client.zrevrangebylex('sortedkey', '+', '-');
      expect(val.length).toBe(3);
      expect(val[0]).toBe('other');
      expect(val[2]).toBe('lame');
    });

    it('zrevrangebylex (all with limit)', () => {
      const val = client.zrevrangebylex('sortedkey', '+', '-', 'limit', 1, 2);
      expect(val.length).toBe(2);
      expect(val[0]).toBe('lame2');
      expect(val[1]).toBe('lame');
    });

    it('zrevrangebylex (exclusive range)', () => {
      const val = client.zrevrangebylex('sortedkey', '(other', '(l');
      expect(val.length).toBe(2);
      expect(val[0]).toBe('lame2');
      expect(val[1]).toBe('lame');
    });

    it('zrevrangebylex (inclusive range)', () => {
      const val = client.zrevrangebylex('sortedkey', '[p', '[l');
      expect(val.length).toBe(3);
      expect(val[0]).toBe('other');
      expect(val[2]).toBe('lame');
    });

    it('zrevrangebylex with callback', (done) => {
      client.zrevrangebylex('sortedkey', '[p', '[l', (err, res) => {
        expect(res.length).toBe(3);
        expect(res[0]).toBe('other');
        expect(res[2]).toBe('lame');
        done();
      });
    });

    it('zrevrangebyscore (bad start range)', () => {
      const testfn = () => {
        client.zrevrangebyscore('sortedkey', 'd', 2);
      };
      expect(testfn).toThrow('float');
    });

    it('zrevrangebyscore (bad end range)', () => {
      const testfn = () => {
        client.zrevrangebyscore('sortedkey', 1, 'a');
      };
      expect(testfn).toThrow('float');
    });

    it('zrevrangebyscore (bad params)', () => {
      const testfn = () => {
        client.zrevrangebyscore('sortedkey', 1, 2, 'lame');
      };
      expect(testfn).toThrow('syntax');
    });

    it('zrevrangebyscore (bad limit -- too many)', () => {
      const testfn = () => {
        client.zrevrangebyscore('sortedkey', 1, 2, 'limit', 1, 2, 'all');
      };
      expect(testfn).toThrow('wrong number');
    });

    it('zrevrangebyscore (bad limit -- too few)', () => {
      const testfn = () => {
        client.zrevrangebyscore('sortedkey', 1, 2, 'limit');
      };
      expect(testfn).toThrow('wrong number');
    });

    it('zrevrangebyscore (bad limit offset)', () => {
      const testfn = () => {
        client.zrevrangebyscore('sortedkey', 1, 2, 'limit', 'a', 2);
      };
      expect(testfn).toThrow('integer');
    });

    it('zrevrangebyscore (bad limit count)', () => {
      const testfn = () => {
        client.zrevrangebyscore('sortedkey', 1, 2, 'limit', 1, 'a');
      };
      expect(testfn).toThrow('integer');
    });

    it('zrevrangebyscore (reverse order)', () => {
      const val = client.zrevrangebyscore('sortedkey', '-inf', '+inf');
      expect(val).toBe.empty;
    });

    it('zrevrangebyscore (all)', () => {
      const val = client.zrevrangebyscore('sortedkey', '+inf', '-inf');
      expect(val.length).toBe(3);
      expect(val[0]).toBe('lame');
      expect(val[2]).toBe('other');
    });

    it('zrevrangebyscore (all with limit)', () => {
      const val = client.zrevrangebyscore('sortedkey', '+inf', '-inf', 'limit', 1, 2);
      expect(val.length).toBe(2);
      expect(val[0]).toBe('lame2');
      expect(val[1]).toBe('other');
    });

    it('zrevrangebyscore (all with limit withscores)', () => {
      const val = client.zrevrangebyscore('sortedkey', '+inf', '-inf', 'withscores', 'limit', 1, 2);
      expect(val.length).toBe(4);
      expect(val[0]).toBe('lame2');
      expect(val[2]).toBe('other');
    });

    it('zrevrangebyscore (all withscores)', () => {
      const val = client.zrevrangebyscore('sortedkey', '+inf', '-inf', 'withscores');
      expect(val.length).toBe(6);
      expect(val[0]).toBe('lame');
      expect(val[4]).toBe('other');
    });

    it('zrevrangebyscore (exclusive range)', () => {
      const val = client.zrevrangebyscore('sortedkey', '(2.0', '(1.0');
      expect(val.length).toBe(1);
      expect(val[0]).toBe('lame2');
    });

    it('zrevrangebyscore (inclusive range)', () => {
      const val = client.zrevrangebyscore('sortedkey', '2.0', '1.0');
      expect(val.length).toBe(2);
      expect(val[0]).toBe('lame');
      expect(val[1]).toBe('lame2');
    });

    it('zrevrangebyscore with callback', (done) => {
      client.zrevrangebyscore('sortedkey', '2.0', '1.0', (err, res) => {
        expect(res.length).toBe(2);
        expect(res[0]).toBe('lame');
        expect(res[1]).toBe('lame2');
        done(0);
      });
    });

    it('zrevrank (non-existing key)', () => {
      const val = client.zrevrank('bad', 'll');
      expect(val).toBe(null);
    });

    it('zrevrank (non-existing member)', () => {
      const val = client.zrevrank('sortedkey', 'll');
      expect(val).toBe(null);
    });

    it('zrevrank', () => {
      const val = client.zrevrank('sortedkey', 'other');
      expect(val).toBe(2);
    });

    it('zrevrank with callback', (done) => {
      client.zrevrank('sortedkey', 'lame', (err, res) => {
        expect(res).toBe(0);
        done();
      });
    });

    it('zscore (non-existing key)', () => {
      const val = client.zscore('bad', 'll');
      expect(val).toBe(null);
    });

    it('zscore (non-existing member)', () => {
      const val = client.zscore('sortedkey', 'll');
      expect(val).toBe(null);
    });

    it('zscore', () => {
      const val = client.zscore('sortedkey', 'other');
      expect(val).toBe(-2);
    });

    it('zscore with callback', (done) => {
      client.zscore('sortedkey', 'lame', (err, res) => {
        expect(res).toBe(2);
        done();
      });
    });

    it('zrem (non-existing key)', () => {
      const val = client.zrem('bad', 'll');
      expect(val).toBe(0);
    });

    it('zrem', () => {
      client.zadd('sortedkey', 3, 'fantastic');
      client.zadd('sortedkey', 4, 'beautiful');
      client.zadd('sortedkey', 5, 'good');
      client.zadd('sortedkey', 6, 'great');
      const val = client.zrem('sortedkey', 'okay', 'fantastic', 'beautiful', 'good', 'great');
      expect(val).toBe(4);
    });

    it('zrem with callback', (done) => {
      client.zadd('sortedkey', 3, 'fantastic');
      client.zadd('sortedkey', 4, 'beautiful');
      client.zadd('sortedkey', 5, 'good');
      client.zadd('sortedkey', 6, 'great');
      client.zrem('sortedkey', 'okay', 'fantastic', 'beautiful', 'good', 'great', (err, res) => {
        expect(res).toBe(4);
        done();
      });
    });

    it('zremrangebylex (bad key type)', () => {
      client.set('strkey', 'lame');
      const testfn = () => {
        client.zremrangebylex('strkey', '(f', '(gz');
      };
      expect(testfn).toThrow('WRONGTYPE');
    });

    it('zremrangebylex', () => {
      client.zadd('sortedkey', 3, 'fantastic');
      client.zadd('sortedkey', 4, 'beautiful');
      client.zadd('sortedkey', 5, 'good');
      client.zadd('sortedkey', 6, 'great');
      const val = client.zremrangebylex('sortedkey', '(f', '(gz');
      expect(val).toBe(3);
    });

    it('zremrangebylex with callback', (done) => {
      client.zadd('sortedkey', 3, 'fantastic');
      client.zadd('sortedkey', 4, 'beautiful');
      client.zadd('sortedkey', 5, 'good');
      client.zadd('sortedkey', 6, 'great');
      client.zremrangebylex('sortedkey', '(f', '(gz', (err, res) => {
        expect(res).toBe(3);
        done();
      });
    });

    it('zremrangebyrank (bad key type)', () => {
      const testfn = () => {
        client.zremrangebyrank('strkey', -2, -1);
      };
      expect(testfn).toThrow('WRONGTYPE');
    });

    it('zremrangebyrank', () => {
      client.zadd('sortedkey', 3, 'fantastic');
      client.zadd('sortedkey', 4, 'beautiful');
      client.zadd('sortedkey', 5, 'good');
      client.zadd('sortedkey', 6, 'great');
      let val = client.zremrangebyrank('sortedkey', -2, -1);
      expect(val).toBe(2);
      val = client.zrange('sortedkey', 0, -1);
      expect(val).not.toContain('good', 'great');
    });

    it('zremrangebyrank with callback', (done) => {
      client.zadd('sortedkey', 3, 'fantastic');
      client.zadd('sortedkey', 4, 'beautiful');
      client.zadd('sortedkey', 5, 'good');
      client.zadd('sortedkey', 6, 'great');
      client.zremrangebyrank('sortedkey', -2, -1, (err, res) => {
        expect(res).toBe(2);
        const val = client.zrange('sortedkey', 0, -1);
        expect(val).not.toContain('good', 'great');
        done();
      });
    });

    it('zremrangebyscore (bad key type)', () => {
      const testfn = () => {
        client.zremrangebyscore('strkey', '4', '6');
      };
      expect(testfn).toThrow('WRONGTYPE');
    });

    it('zremrangebyscore', () => {
      client.zadd('sortedkey', 3, 'fantastic');
      client.zadd('sortedkey', 4, 'beautiful');
      client.zadd('sortedkey', 5, 'good');
      client.zadd('sortedkey', 6, 'great');
      const val = client.zremrangebyscore('sortedkey', '4', '6');
      expect(val).toBe(3);
    });

    it('zremrangebyscore with callback', (done) => {
      client.zadd('sortedkey', 3, 'fantastic');
      client.zadd('sortedkey', 4, 'beautiful');
      client.zadd('sortedkey', 5, 'good');
      client.zadd('sortedkey', 6, 'great');
      client.zremrangebyscore('sortedkey', '4', '6', (err, res) => {
        expect(res).toBe(3);
        done();
      });
    });
  });

  describe('Strings', () => {
    it('set (bad expiration [empty])', () => {
      const testfn = () => {
        client.set('strkey2', 'chuff', 'ex');
      };
      expect(testfn).toThrow('syntax');
    });

    it('set (bad milli expiration [empty])', () => {
      const testfn = () => {
        client.set('strkey2', 'chuff', 'px');
      };
      expect(testfn).toThrow('syntax');
    });

    it('set (bad expiration [mutex])', () => {
      const testfn = () => {
        client.set('strkey2', 'chuff', 'ex', 123, 'px', 123);
      };
      expect(testfn).toThrow('syntax');
    });

    it('set (bad expiration [no int])', () => {
      const testfn = () => {
        client.set('strkey2', 'chuff', 'ex', 'px');
      };
      expect(testfn).toThrow('integer');
    });

    it('set (bad milli expiration [no int])', () => {
      const testfn = () => {
        client.set('strkey2', 'chuff', 'px', 'ex');
      };
      expect(testfn).toThrow('integer');
    });

    it('set (bad flags [mutex])', () => {
      const testfn = () => {
        client.set('strkey2', 'chuff', 'xx', 'nx');
      };
      expect(testfn).toThrow('syntax');
    });

    it('set (bad params)', () => {
      const testfn = () => {
        client.set('strkey2', 'chuff', '1234');
      };
      expect(testfn).toThrow('syntax');
    });

    it('set (basic)', () => {
      const val = client.set('strkey', 'a');
      expect(val).toBe('OK');
    });

    it('set (with expiration)', () => {
      const val = client.set('strkey2', 'chuff', 'ex', 120);
      expect(val).toBe('OK');
    });

    it('set (with millisecond expiration)', () => {
      const val = client.set('strkey2', 'chuff', 'px', 120);
      expect(val).toBe('OK');
    });

    it('set (with xx flag)', () => {
      const val = client.set('strkey3', 'chuff', 'xx');
      expect(val).toBe(null);
    });

    it('set with callback', (done) => {
      client.set('strkey', 'c', (err, res) => {
        expect(res).toBe('OK');
        done();
      });
    });

    it('get (non-existing)', () => {
      const val = client.get('strkey3');
      expect(val).toBe(null);
    });

    it('get', () => {
      const val = client.get('strkey');
      expect(val).toBe('c');
    });

    it('get with callback', (done) => {
      client.get('strkey', (err, res) => {
        expect(res).toBe('c');
        done();
      });
    });

    it('append (non-existing)', () => {
      const val = client.append('strkey3', 'at');
      expect(val).toBe(2);
    });

    it('append', () => {
      const val = client.append('strkey', 'at');
      expect(val).toBe(3);
    });

    it('append with callback', (done) => {
      client.append('strkey3', 'at', (err, res) => {
        expect(res).toBe(4);
        done();
      });
    });

    it('bitcount (bad too many params)', () => {
      const testfn = () => {
        client.bitcount('strkey4', '1', '1', '1');
      };
      expect(testfn).toThrow('syntax');
    });

    it('bitcount (bad too few params)', () => {
      const testfn = () => {
        client.bitcount('strkey4', '1');
      };
      expect(testfn).toThrow('syntax');
    });

    it('bitcount (bad start index)', () => {
      const testfn = () => {
        client.bitcount('strkey4', 'bad', '1');
      };
      expect(testfn).toThrow('integer');
    });

    it('bitcount (bad end index)', () => {
      const testfn = () => {
        client.bitcount('strkey4', '1', 'bad');
      };
      expect(testfn).toThrow('integer');
    });

    it('bitcount (non-existing)', () => {
      const val = client.bitcount('strkey4');
      expect(val).toBe(0);
    });

    it('bitcount', () => {
      const val = client.bitcount('strkey');
      expect(val).toBe(8);
    });

    it('bitcount (with start and end)', () => {
      const val = client.bitcount('strkey', 14, -2);
      expect(val).toBe(4);
    });

    it('bitcount (with start before beginning)', () => {
      const val = client.bitcount('strkey', -100, 100);
      expect(val).toBe(8);
    });

    it('bitcount (with end beyond length)', () => {
      const val = client.bitcount('strkey', 14, 100);
      expect(val).toBe(4);
    });

    it('bitcount with callback', (done) => {
      client.bitcount('strkey', -48, -2, (err, res) => {
        expect(res).toBe(8);
        done();
      });
    });

    it('bitop (no source key)', () => {
      const testfn = () => {
        client.bitop('not', 'bitop');
      };
      expect(testfn).toThrow('wrong number');
    });

    it('bitop (bad operator)', () => {
      const testfn = () => {
        client.bitop('wacky', 'bitop', 'bitop1', 'bitop2');
      };
      expect(testfn).toThrow('syntax');
    });

    it('bitop [not] (bad parameter count)', () => {
      const testfn = () => {
        client.bitop('not', 'bitop', 'bitop1', 'bitop2');
      };
      expect(testfn).toThrow('BITOP NOT');
    });

    it('bitop [not]', () => {
      client.set('bitop0', '\u0000');
      client.set('bitop1', '\u0001');
      client.set('bitop2', '\u0002');
      client.set('bitop3', '\u0003');
      let val = client.bitop('not', 'bitop', 'bitop0');
      expect(val).toBe(1);
      val = client.get('bitop');
      expect(val).toBe('￿');
    });

    it('bit [and]', () => {
      let val = client.bitop('and', 'bitop', 'bitop3', 'bitop2');
      expect(val).toBe(1);
      val = client.get('bitop');
      expect(val).toBe('\u0002');
    });

    it('bit [or]', () => {
      let val = client.bitop('or', 'bitop', 'bitop1', 'bitop3');
      expect(val).toBe(1);
      val = client.get('bitop');
      expect(val).toBe('\u0003');
    });

    it('bit [xor]', () => {
      let val = client.bitop('xor', 'bitop', 'bitop1', 'bitop3');
      expect(val).toBe(1);
      val = client.get('bitop');
      expect(val).toBe('\u0002');
    });

    it('bitop with callback', (done) => {
      client.bitop('xor', 'bitop', 'bitop1', 'bitop3', (err, res) => {
        expect(res).toBe(1);
        const val = client.get('bitop');
        expect(val).toBe('\u0002');
        done();
      });
    });

    it('decr (bad key type)', () => {
      const testfn = () => {
        client.decr('strkey');
      };
      expect(testfn).toThrow('integer');
    });

    it('decr (non-existing)', () => {
      const val = client.decr('numkey');
      expect(val).toBe(-1);
    });

    it('decr', () => {
      const val = client.decr('numkey');
      expect(val).toBe(-2);
    });

    it('decr with callback', (done) => {
      client.decr('numkey', (err, res) => {
        expect(res).toBe(-3);
        done();
      });
    });

    it('decrby (bad value)', () => {
      const testfn = () => {
        client.decrby('numkey3', 'f');
      };
      expect(testfn).toThrow('integer');
    });

    it('decrby (non-existing)', () => {
      const val = client.decrby('numkey2', 2);
      expect(val).toBe(-2);
    });

    it('decrby', () => {
      const val = client.decrby('numkey2', 2);
      expect(val).toBe(-4);
    });

    it('decrby with callback', (done) => {
      client.decrby('numkey2', 2, (err, res) => {
        expect(res).toBe(-6);
        done();
      });
    });

    it('getbit (non-existing)', () => {
      const val = client.getbit('bad', 1);
      expect(val).toBe(0);
    });

    it('getbit (out of range)', () => {
      const val = client.getbit('strkey', 100);
      expect(val).toBe(0);
    });

    it('getbit', () => {
      const val = client.getbit('strkey', 1);
      expect(val).toBe(1);
    });

    it('getbit with callback', (done) => {
      client.getbit('strkey', 1, (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('getrange (non-existing)', () => {
      const val = client.getrange('bad', 1, -1);
      expect(val).toBe('');
    });

    it('getrange (bad range :: end < start)', () => {
      const val = client.getrange('strkey', 1, 0);
      expect(val).toBe('');
    });

    it('getrange', () => {
      const val = client.getrange('strkey', 1, -1);
      expect(val).toBe('at');
    });

    it('getrange with callback', (done) => {
      client.getrange('strkey', -2, -1, (err, res) => {
        expect(res).toBe('at');
        done();
      });
    });

    it('getset (non-existing)', () => {
      const val = client.getset('bad', '1');
      expect(val).toBe(null);
    });

    it('getset', () => {
      const val = client.getset('strkey', 'dog');
      expect(val).toBe('cat');
    });

    it('getset with callback', (done) => {
      client.getset('strkey', 'cat', (err, res) => {
        expect(res).toBe('dog');
        done();
      });
    });

    it('incr (non integer key)', () => {
      const testfn = () => {
        client.incr('strkey');
      };
      expect(testfn).toThrow('integer');
    });

    it('incr (non-existing)', () => {
      const val = client.incr('numkey3');
      expect(val).toBe(1);
    });

    it('incr', () => {
      const val = client.incr('numkey3');
      expect(val).toBe(2);
    });

    it('incr with callback', (done) => {
      client.incr('numkey3', (err, res) => {
        expect(res).toBe(3);
        done();
      });
    });

    it('incrby (bad value)', () => {
      const testfn = () => {
        client.incrby('numkey3', 'f');
      };
      expect(testfn).toThrow('integer');
    });

    it('incrby (non-existing)', () => {
      const val = client.incrby('numkey4', 2);
      expect(val).toBe(2);
    });

    it('incrby', () => {
      const val = client.incrby('numkey4', 2);
      expect(val).toBe(4);
    });

    it('incrby with callback', (done) => {
      client.incrby('numkey4', 2, (err, res) => {
        expect(res).toBe(6);
        done();
      });
    });

    it('incrbyfloat (non float key)', () => {
      const testfn = () => {
        client.incrbyfloat('strkey', 1.11);
      };
      expect(testfn).toThrow('float');
    });

    it('incrbyfloat (bad value)', () => {
      const testfn = () => {
        client.incrbyfloat('numkey5', 'f');
      };
      expect(testfn).toThrow('float');
    });

    it('incrbyfloat (non-exsiting)', () => {
      const val = client.incrbyfloat('numkey5', 1.11);
      expect(val).toBe(1.11);
    });

    it('incrbyfloat', () => {
      const val = client.incrbyfloat('numkey5', 1.11);
      expect(val).toBe(2.22);
    });

    it('incrbyfloat with callback', () => {
      client.incrbyfloat('numkey5', 1.11, (err, res) => {
        expect(res).toBe(3.33);
      });
    });

    it('mget', () => {
      const val = client.mget('numkey', 'numkey2', 'numkey3', 'numkey4', 'numkey5', 'numkey6');
      expect(val.length).toBe(6);
      expect(val).toContain('6', '3.33', '3', '-6', '-3', null);
    });

    it('mget with callback', (done) => {
      client.mget('numkey', 'numkey2', 'numkey3', 'numkey4', 'numkey5', 'numkey6', (err, res) => {
        expect(res.length).toBe(6);
        expect(res).toContain('6', '3.33', '3', '-6', '-3', null);
        done();
      });
    });

    it('mset (wrong arg count - too many)', () => {
      const testfn = () => {
        client.mset('key1', 1, 'key2');
      };
      expect(testfn).toThrow('wrong number');
    });

    it('mset (wrong arg count - too few)', () => {
      const testfn = () => {
        client.mset('key1');
      };
      expect(testfn).toThrow('wrong number');
    });

    it('mset', () => {
      const val = client.mset('strkey', 'cat', 'strkey2', 'dog', 'newstrkey', 'bird');
      expect(val).toBe('OK');
    });

    it('mset with callback', (done) => {
      client.mset('strkey', 'cat', 'strkey2', 'dog', 'newstrkey', 'bird', (err, res) => {
        expect(res).toBe('OK');
        done();
      });
    });

    it('msetnx (wrong arg count - too many)', () => {
      const testfn = () => {
        client.msetnx('key1', 1, 'key2');
      };
      expect(testfn).toThrow('wrong number');
    });

    it('msetnx (wrong arg count - too few)', () => {
      const testfn = () => {
        client.msetnx('key1');
      };
      expect(testfn).toThrow('wrong number');
    });

    it('msetnx (already existing)', () => {
      const val = client.msetnx('strkey', 'cat', 'strkey2', 'dog', 'newstrkey2', 'bird');
      expect(val).toBe(0);
    });

    it('msetnx', () => {
      const val = client.msetnx('newstrkey2', 'bird', 'newstrkey3', 'monkey');
      expect(val).toBe(1);
    });

    it('msetnx with callback', (done) => {
      client.msetnx('newstrkey4', 'raccoon', 'newstrkey5', 'bison', (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('psetex (bad key type)', () => {
      const testfn = () => {
        client.psetex('testkey', 100, 123);
      };
      expect(testfn).toThrow('WRONGTYPE');
    });

    it('psetex', () => {
      const val = client.psetex('expirekey', 200, '123');
      expect(val).toBe('OK');
    });

    it('psetex with callback', (done) => {
      client.psetex('expirekey', 2000, '123', (err, res) => {
        expect(res).toBe('OK');
        done();
      });
    });

    it('setbit (non-existing)', () => {
      let val = client.setbit('newk', 6, 1);
      expect(val).toBe(0);
      val = client.get('newk');
      expect(val).toBe('@');
    });

    it('setbit', () => {
      client.set('strkey', 'cat');
      let val = client.setbit('strkey', 0, 0);
      expect(val).toBe(1);
      val = client.get('strkey');
      expect(val).toBe('bat');
    });

    it('setbit with callback', (done) => {
      client.setbit('strkey', 0, 1, (err, res) => {
        expect(res).toBe(0);
        const val = client.get('strkey');
        expect(val).toBe('cat');
        done();
      });
    });

    it('setex (bad key type)', () => {
      const testfn = () => {
        client.setex('testkey', 100, 123);
      };
      expect(testfn).toThrow('WRONGTYPE');
    });

    it('setex', () => {
      const val = client.setex('expirekey', 20, '567');
      expect(val).toBe('OK');
    });

    it('setex with callback', (done) => {
      client.setex('expirekey', 20, '123', (err, res) => {
        expect(res).toBe('OK');
        done();
      });
    });

    it('setnx (bad key type)', () => {
      const testfn = () => {
        client.setnx('testkey', 123);
      };
      expect(testfn).toThrow('WRONGTYPE');
    });

    it('setnx (existing)', () => {
      const val = client.setnx('expirekey', 123);
      expect(val).toBe(0);
    });

    it('setnx', () => {
      const val = client.setnx('newnew', 123);
      expect(val).toBe(1);
    });

    it('setnx with callback', (done) => {
      client.setnx('newnew1', 123, (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('setrange (non-existing)', () => {
      let val = client.setrange('newk1', 2, 'ok');
      expect(val).toBe(4);
      val = client.get('newk1');
      expect(val).toBe('\u0000\u0000ok');
    });

    it('setrange', () => {
      let val = client.setrange('newk1', 0, 'ok');
      expect(val).toBe(4);
      val = client.get('newk1');
      expect(val).toBe('okok');
    });

    it('setrange with callback', (done) => {
      client.setrange('newk1', 2, 'ay', (err, res) => {
        expect(res).toBe(4);
        const val = client.get('newk1');
        expect(val).toBe('okay');
        done();
      });
    });

    it('strlen (non-existing)', () => {
      const val = client.strlen('bad');
      expect(val).toBe(0);
    });

    it('strlen', () => {
      const val = client.strlen('newnew1');
      expect(val).toBe(3);
    });

    it('strlen with callback', (done) => {
      client.strlen('newnew1', (err, res) => {
        expect(res).toBe(3);
        done();
      });
    });
  });

  describe('Transactions', () => {
    let dbsize;
    beforeAll(() => {
      dbsize = client.dbsize();
    });

    it('multi', () => {
      const val = client.multi();
      expect(val).toBe('OK');
    });

    it('discard', () => {
      const val = client.discard();
      expect(val).toBe('OK');
    });

    it('discard (without multi)', () => {
      const testfn = () => {
        client.discard();
      };
      expect(testfn).toThrow('DISCARD without MULTI');
    });

    it('exec (without multi)', () => {
      const testfn = () => {
        client.exec();
      };
      expect(testfn).toThrow('EXEC without MULTI');
    });

    it('multi (nested multi)', () => {
      const testfn = () => {
        client.multi();
        client.multi();
      };
      expect(testfn).toThrow('MULTI calls');
      client.discard();
    });

    it('multi with callback', (done) => {
      client.multi((err, res) => {
        expect(res).toBe('OK');
        done();
      });
    });

    it('exec', () => {
      let val = client.set('atomic1', 2);
      expect(val).toBe('QUEUED');
      client.set('atomic2', 1);
      val = client.exec();
      expect(val.length).toBe(3);
      expect(val).toContain('OK');
      expect(client.dbsize()).toBe(dbsize + 2);
    });

    it('exec with callback', (done) => {
      client.multi();
      client.exec((err, res) => {
        expect(res).toContain('OK');
        done();
      });
    });

    it('discard with callback', (done) => {
      client.multi();
      client.discard((err, res) => {
        expect(res).toBe('OK');
        done();
      });
    });
  });

  describe('Server', () => {
    let clock;
    beforeAll(() => {
      clock = lolex.install();
    });

    afterAll(() => {
      clock.uninstall();
    });

    it('bgsave', () => {
      const val = client.bgsave();
      expect(val).toBe('OK');
    });

    it('bgsave with callback', (done) => {
      client.bgsave((err, res) => {
        expect(res).toBe('OK');
        done();
      });
    });

    it('dbsize', () => {
      const val = client.dbsize();
      expect(val).toBe(Object.keys(client.cache).length);
    });

    it('dbsize with callback', (done) => {
      client.dbsize((err, res) => {
        expect(res).toBe(Object.keys(client.cache).length);
        done();
      });
    });

    it('info', () => {
      const val = client.info();
      expect(val).toBe('');
    });

    it('info with callback', (done) => {
      client.info(null, (err, res) => {
        expect(res).toBe('');
        done();
      });
    });

    it('lastsave', () => {
      const val = client.lastsave();
      expect(val).toBe(Date.now());
    });

    it('lastsave with callback', (done) => {
      client.lastsave((err, res) => {
        expect(res).toBe(Date.now());
        done();
      });
    });

    it('role', () => {
      const val = client.role();
      expect(val).toContain('master', 0, null);
    });

    it('role with callback', (done) => {
      client.role((err, res) => {
        expect(res).toContain('master', 0, null);
        done();
      });
    });

    it('save', () => {
      const val = client.save();
      expect(val).toBe('OK');
    });

    it('save with callback', (done) => {
      client.save((err, res) => {
        expect(res).toBe('OK');
        done();
      });
    });

    it('time', () => {
      clock.tick(52002);
      const val = client.time();
      expect(val[0]).toBe(52);
      expect(val[1]).toBe(2000);
    });

    it('time with callback', (done) => {
      client.time((err, res) => {
        expect(res[0]).toBe(52);
        expect(res[1]).toBe(2000);
        done();
      });
    });

    it('select (bad index)', () => {
      const testfn = () => {
        client.select('bad');
      };
      expect(testfn).toThrow('invalid DB index');
    });

    it('select', () => {
      const val = client.select(2);
      expect(val).toBe('OK');
      expect(client.currentDBIndex).toBe(2);
    });

    it('select with callback', () => {
      client.select(3, (err, res) => {
        expect(res).toBe('OK');
        expect(client.currentDBIndex).toBe(3);
      });
    });

    it('swapdb (bad source index)', () => {
      const testfn = () => {
        client.swapdb('bad', 1);
      };
      expect(testfn).toThrow('invalid DB index');
    });

    it('swapdb (bad dest index)', () => {
      const testfn = () => {
        client.swapdb(1, 'bad');
      };
      expect(testfn).toThrow('invalid DB index');
    });

    it('swapdb (non-existing source index)', () => {
      const testfn = () => {
        client.swapdb(100, 1);
      };
      expect(testfn).toThrow('invalid DB index');
    });

    it('swapdb (non-existing dest index)', () => {
      const testfn = () => {
        client.swapdb(1, 100);
      };
      expect(testfn).toThrow('invalid DB index');
    });

    it('swapdb', () => {
      client.set('c', 'd');
      const val = client.swapdb(2, 3);
      expect(val).toBe('OK');
      expect(Object.keys(client.databases[2]).length).toBe(1);
    });

    it('swapdb with callback', () => {
      client.swapdb(2, 3, (err, res) => {
        expect(res).toBe('OK');
        expect(Object.keys(client.databases[3]).length).toBe(1);
      });
    });

    it('flushdb', () => {
      client.set('a', 'b');
      const val = client.flushdb();
      expect(val).toBe('OK');
      expect(client.cache).toBe.empty;
    });

    it('flushdb with callback', (done) => {
      client.set('a', 'b');
      client.flushdb((err, res) => {
        expect(res).toBe('OK');
        expect(client.cache).toBe.empty;
        done();
      });
    });

    it('flushall', () => {
      client.select(1);
      client.set('a', 'b');
      const val = client.flushall();
      expect(val).toBe('OK');
      expect(client.currentDBIndex).toBe(0);
      expect(Object.keys(client.databases).length).toBe(1);
      expect(client.cache).toBe.empty;
    });

    it('flushall with callback', (done) => {
      client.select(1);
      client.set('a', 'b');
      client.flushall((err, res) => {
        expect(res).toBe('OK');
        expect(client.currentDBIndex).toBe(0);
        expect(Object.keys(client.databases).length).toBe(1);
        expect(client.cache).toBe.empty;
        done();
      });
    });
  });

  describe('Geo', () => {
    it('geoadd (bad param count -- too few)', () => {
      const testfn = () => {
        client.geoadd('geokey');
      };
      expect(testfn).toThrow('wrong number');
    });

    it('geoadd (bad param count -- too many)', () => {
      const testfn = () => {
        client.geoadd('geokey', 30.3, 30.3, 'place', 12);
      };
      expect(testfn).toThrow('wrong number');
    });

    it('geoadd (bad longitude)', () => {
      const testfn = () => {
        client.geoadd('geokey', 'as', 30.3, 'place');
      };
      expect(testfn).toThrow('float');
    });

    it('geoadd (bad latitude)', () => {
      const testfn = () => {
        client.geoadd('geokey', 30.3, 'as', 'place');
      };
      expect(testfn).toThrow('float');
    });

    it('geoadd', () => {
      const val = client.geoadd('geokey', 30.3, 30.3, 'place', 35.5, 35.5, 'place2');
      expect(val).toBe(2);
    });

    it('geoadd with callback', (done) => {
      client.geoadd('geokey', 33.3, 33.3, 'place3', (err, res) => {
        expect(res).toBe(1);
        done();
      });
    });

    it('geodist (bad param count -- too many)', () => {
      const testfn = () => {
        client.geodist('geokey', 'place', 'place2', 'a', 'b');
      };
      expect(testfn).toThrow('wrong number');
    });

    it('geodist (bad param conversion)', () => {
      const testfn = () => {
        client.geodist('geokey', 'place', 'place2', 'a');
      };
      expect(testfn).toThrow('syntax');
    });

    it('geodist', () => {
      const val = client.geodist('geokey', 'place', 'place2');
      expect(val).toBe(755570);
    });

    it('geodist with km conversion', () => {
      const val = client.geodist('geokey', 'place', 'place2', 'km');
      expect(val).toBe(755.57);
    });

    it('geodist with mi conversion', () => {
      const val = client.geodist('geokey', 'place', 'place2', 'mi');
      expect(val).toBe(469.48943171876243);
    });

    it('geodist with ft conversion', () => {
      const val = client.geodist('geokey', 'place', 'place2', 'ft');
      expect(val).toBe(2478904.2788);
    });

    it('geodist with callback', (done) => {
      client.geodist('geokey', 'place', 'place2', (err, res) => {
        expect(res).toBe(755570);
        done();
      });
    });

    it('geohash (bad param count -- too few)', () => {
      const testfn = () => { client.geohash(); };
      expect(testfn).toThrow('wrong number');
    });

    it('geohash (non-existing key)', () => {
      const val = client.geohash('bad', 'member');
      expect(val.length).toBe(1);
      expect(val).toContain(null);
    });

    it('geohash', () => {
      const val = client.geohash('geokey', 'place', 'member');
      expect(val.length).toBe(2);
      expect(val).toContain(null, 'stms37zy3');
    });

    it('geohash with callback', (done) => {
      client.geohash('geokey', 'place', 'member', (err, res) => {
        expect(res.length).toBe(2);
        expect(res).toContain(null, 'stms37zy3');
        done();
      });
    });

    it('geopos (bad param count -- too few)', () => {
      const testfn = () => { client.geopos(); };
      expect(testfn).toThrow('wrong number');
    });

    it('geopos', () => {
      const val = client.geopos('geokey', 'place', 'member');
      expect(val.length).toBe(2);
      expect(val[1]).toBe(null);
      expect(val[0].length).toBe(2);
      expect(val[0][0]).toBeCloseTo(30.3, 30.3 * 0.005);
      expect(val[0][1]).toBeCloseTo(30.3, 30.3 * 0.005);
    });

    it('geopos with callback', (done) => {
      client.geopos('geokey', 'place', 'member', (err, res) => {
        expect(res.length).toBe(2);
        expect(res[1]).toBe(null);
        expect(res[0].length).toBe(2);
        expect(res[0][0]).toBeCloseTo(30.3, 30.3 * 0.005);
        expect(res[0][1]).toBeCloseTo(30.3, 30.3 * 0.005);
        done();
      });
    });
  });

  describe('Unsupported', () => {
    it('cluster', () => {
      const testfn = () => {
        client.cluster();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('readonly', () => {
      const testfn = () => {
        client.readonly();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('readwrite', () => {
      const testfn = () => {
        client.readwrite();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('georadius', () => {
      const testfn = () => {
        client.georadius();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('georadiusbymember', () => {
      const testfn = () => {
        client.georadiusbymember();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('hscan', () => {
      const testfn = () => {
        client.hscan();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('pfadd', () => {
      const testfn = () => {
        client.pfadd();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('pfcount', () => {
      const testfn = () => {
        client.pfcount();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('pfmerge', () => {
      const testfn = () => {
        client.pfmerge();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('migrate', () => {
      const testfn = () => {
        client.migrate();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('object', () => {
      const testfn = () => {
        client.object();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('bitpos', () => {
      const testfn = () => {
        client.bitpos();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('scan', () => {
      const testfn = () => {
        client.scan();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('sort', () => {
      const testfn = () => {
        client.sort();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('wait', () => {
      const testfn = () => {
        client.wait();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('blpop', () => {
      const testfn = () => {
        client.blpop();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('brpop', () => {
      const testfn = () => {
        client.brpop();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('brpoplpush', () => {
      const testfn = () => {
        client.brpoplpush();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('psubscribe', () => {
      const testfn = () => {
        client.psubscribe();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('pubsub', () => {
      const testfn = () => {
        client.pubsub();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('publish', () => {
      const testfn = () => {
        client.publish();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('punsubscribe', () => {
      const testfn = () => {
        client.punsubscribe();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('suscribe', () => {
      const testfn = () => {
        client.suscribe();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('unsubscribe', () => {
      const testfn = () => {
        client.unsubscribe();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('eval', () => {
      const testfn = () => {
        client.eval();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('evalsha', () => {
      const testfn = () => {
        client.evalsha();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('script', () => {
      const testfn = () => {
        client.script();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('bgrewriteaof', () => {
      const testfn = () => {
        client.bgrewriteaof();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('client', () => {
      const testfn = () => {
        client.client();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('config', () => {
      const testfn = () => {
        client.config();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('command', () => {
      const testfn = () => {
        client.command();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('debug', () => {
      const testfn = () => {
        client.debug();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('monitor', () => {
      const testfn = () => {
        client.monitor();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('shutdown', () => {
      const testfn = () => {
        client.shutdown();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('slaveof', () => {
      const testfn = () => {
        client.slaveof();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('slowlog', () => {
      const testfn = () => {
        client.slowlog();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('sync', () => {
      const testfn = () => {
        client.sync();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('sscan', () => {
      const testfn = () => {
        client.sscan();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('zinterstore', () => {
      const testfn = () => {
        client.zinterstore();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('zunionstore', () => {
      const testfn = () => {
        client.zunionstore();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('zscan', () => {
      const testfn = () => {
        client.zscan();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('bitfield', () => {
      const testfn = () => {
        client.bitfield();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('unwatch', () => {
      const testfn = () => {
        client.unwatch();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });

    it('watch', () => {
      const testfn = () => {
        client.watch();
      };
      expect(testfn).toThrow(MemoryCacheError);
    });
  });

  describe('Internal Methods', () => {
    it('_strbit with bad or missing operator', () => {
      const val = client._strbit('', ['moo', 'cat']);
      expect(val).toBe('moo');
    });

    it('_testType in silent mode', () => {
      client.set('test', '1');
      let val = client._testType('test', 'string', false);
      expect(val).toBe(true);
      val = client._testType('test', 'zset', false);
      expect(val).toBe(false);
    });

    it('_unsupported in bypass mode', () => {
      client.options.bypassUnsupported = true;
      const val = client._unsupported();
      expect(val).toBe(undefined);
    });
  });
});
