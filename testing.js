const MemoryCache = require('.');
const memCache = new MemoryCache();

memCache.createClient();

memCache.multi();
let v = memCache.set('bitop1', '\u0000');
memCache.set('bitop2', '\u0001');
memCache.set('bitop3', '\u0002');
memCache.set('bitop4', '\u0003');
memCache.exec();

const val = memCache.bitop('and', 'bitop', 'bitop3', 'bitop4');
console.log(val);
