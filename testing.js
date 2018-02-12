const MemoryCache = require('.');
const memCache = new MemoryCache();

memCache.createClient();

memCache.hset('test', 'key1', '10');

let val = memCache.hincrby('test', 'key1', '10', (err, res) => {
  console.log(res);
});

console.log(val);
