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
});
