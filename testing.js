const MemoryCache = require('.');
const memCache = new MemoryCache();

memCache.createClient();

memCache.sadd('testkey', 'key');

const val = memCache.smove('testkey', 'destkey', 'key');
console.log(val);
// , (err, res) => {
//   console.log(res);
// });

// console.log(val);
