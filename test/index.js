// test/index.js
const chai = require('chai');
const expect = chai.expect;

// Dependancies
const MemoryCache = require('../');

describe('Memory Cache', () => {
  let client;
  before((done) => {
    client = new MemoryCache({ bypassUnsupported: true });
    done();
  });

  it('constructor', () => {
    expect(client).to.be.instanceof(MemoryCache);
  });

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
});
