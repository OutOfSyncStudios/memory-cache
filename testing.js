const MemoryCache = require('.');
const memCache = new MemoryCache();

let v;

memCache.createClient();

memCache.zadd('sortedkey', '2', 'lame', '1.2', 'lame2', '-2', 'other');
memCache.zadd('sortedkey', 3, 'fantastic');
memCache.zadd('sortedkey', 4, 'beautiful');
memCache.zadd('sortedkey', 5, 'good');
memCache.zadd('sortedkey', 6, 'great');
v = memCache.zremrangebylex('sortedkey', '(f', '(gz');

memCache.zadd('sortedkey', 3, 'fantastic');
memCache.zadd('sortedkey', 4, 'beautiful');
memCache.zadd('sortedkey', 5, 'good');
memCache.zadd('sortedkey', 6, 'great');
v = memCache.zremrangebyrank('sortedkey', -2, -1);

memCache.zadd('sortedkey', 3, 'fantastic');
memCache.zadd('sortedkey', 4, 'beautiful');
memCache.zadd('sortedkey', 5, 'good');
memCache.zadd('sortedkey', 6, 'great');
v = memCache.zremrangebyscore('sortedkey', '4', '6');

console.log(v);