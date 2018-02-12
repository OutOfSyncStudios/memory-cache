const MemoryCache = require('.');
const memCache = new MemoryCache();

memCache.createClient();

memCache.sadd('testkey', 'key');

const val = memCache.decrby('testkey2', -3, (err, res) => {
 console.log(res);
});
console.log(val);
