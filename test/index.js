// test/index.js
const chai = require('chai');
const expect = chai.expect;

// Dependancies
const validator = require('../');

describe('Validation Helper', () => {
  it('validate int (good)', () => {
    expect(validator.validate('1234', 'int')).to.equal(true);
  });
  it('validate int (bad)', () => {
    expect(validator.validate('qwer', 'int')).to.equal(false);
  });
  it('validate float (good)', () => {
    expect(validator.validate('12.34e03', 'float')).to.equal(true);
  });
  it('validate float (bad)', () => {
    expect(validator.validate('qwer', 'float')).to.equal(false);
  });
  it('validate boolean (good)', () => {
    expect(validator.validate('true', 'boolean')).to.equal(true);
  });
  it('validate boolean (bad)', () => {
    expect(validator.validate('qwer', 'boolean')).to.equal(false);
  });
  it('validate email (good)', () => {
    expect(validator.validate('test@example.com', 'email')).to.equal(true);
  });
  it('validate email (bad)', () => {
    expect(validator.validate('qwer', 'email')).to.equal(false);
  });
  it('validate currency (good)', () => {
    expect(validator.validate('$12.34', 'currency')).to.equal(true);
  });
  it('validate currency (bad)', () => {
    expect(validator.validate('qwer', 'currency')).to.equal(false);
  });
  it('validate uuid (good)', () => {
    expect(validator.validate('60212ca3-9208-4d62-a338-68c7e53145e4', 'uuid')).to.equal(true);
  });
  it('validate uuid (bad)', () => {
    expect(validator.validate('qwer', 'uuid')).to.equal(false);
  });
  it('validate url (good)', () => {
    expect(validator.validate('http://example.com/', 'url')).to.equal(true);
  });
  it('validate url (bad)', () => {
    expect(validator.validate('qwer', 'url')).to.equal(false);
  });
  it('validate fqdn (good)', () => {
    expect(validator.validate('example.com', 'fqdn')).to.equal(true);
  });
  it('validate fqdn (bad)', () => {
    expect(validator.validate('qwer', 'fqdn')).to.equal(false);
  });
  it('validate apikey (good)', () => {
    expect(validator.validate('C0GJS8Z-J844TRH-MCW6HHW-WMRMBS4', 'apikey')).to.equal(true);
  });
  it('validate apikey (bad)', () => {
    expect(validator.validate('qwer', 'apikey')).to.equal(false);
  });
  it('validate invalid type', () => {
    expect(validator.validate('qwerty', 'qwerty')).to.equal(true);
  });
  it('convert string to int (good)', () => {
    expect(validator.convert('1', 'int')).to.equal(1);
  });
  it('convert string to int (bad)', () => {
    expect(isNaN(validator.convert('qwerty', 'int'))).to.equal(true);
  });
  it('convert string to float (good)', () => {
    expect(validator.convert('1.23', 'float')).to.equal(1.23);
  });
  it('convert string to float (bad)', () => {
    expect(isNaN(validator.convert('qwerty', 'float'))).to.equal(true);
  });
  it('convert string to boolean-true (good)', () => {
    expect(validator.convert('true', 'boolean')).to.equal(true);
  });
  it('convert string to boolean-false (good)', () => {
    expect(validator.convert('false', 'boolean')).to.equal(false);
  });
  it('convert string to boolean (bad)', () => {
    expect(validator.convert('qwerty', 'boolean')).to.equal(false);
  });
  it('convert invalid type', () => {
    expect(validator.convert('qwerty', 'qwerty')).to.equal('qwerty');
  });
  it('convert null value', () => {
    expect(validator.convert(null, 'qwerty')).to.equal(null);
  });
  it('convert undefined value', () => {
    expect(validator.convert(undefined, 'qwerty')).to.equal(undefined);
  });
});
