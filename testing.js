const MemoryCache = require('.');
const memCache = new MemoryCache();

let val;

memCache.createClient();

memCache.zadd('sortedkey', '2', 'lame', '1.2', 'lame2', '-2', 'other');
memCache.zadd('sortedkey', 3, 'fantastic');
memCache.zadd('sortedkey', 4, 'beautiful');
memCache.zadd('sortedkey', 5, 'good');
memCache.zadd('sortedkey', 6, 'great');
val = memCache.zremrangebylex('sortedkey', '(f', '(gz');

memCache.zadd('sortedkey', 3, 'fantastic');
memCache.zadd('sortedkey', 4, 'beautiful');
memCache.zadd('sortedkey', 5, 'good');
memCache.zadd('sortedkey', 6, 'great');
val = memCache.zremrangebyrank('sortedkey', -2, -1);

memCache.zadd('sortedkey', 3, 'fantastic');
memCache.zadd('sortedkey', 4, 'beautiful');
memCache.zadd('sortedkey', 5, 'good');
memCache.zadd('sortedkey', 6, 'great');
val = memCache.zremrangebyscore('sortedkey', '4', '6');

memCache.geoadd('test', 30.3, 30.3, 'place', 35.5, 35.5, 'place2');
val = memCache.geodist('test', 'place', 'place2', 'km');
console.log(val);
