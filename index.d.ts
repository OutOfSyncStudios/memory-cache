declare module "@outofsync/MemoryCache";

type AnyOrNull = any | null;
type NumOrNull = number | null;
type CallbackFn = (err: Error | string, msg: string) => void;
type StringOrCallback = string | CallbackFn;

export declare class MemoryCacheError extends Error {
  constructor(error: Error | string);
}

interface MemoryCacheOptions {
  debug: boolean;
  bypassUnsupported: boolean;
}

declare class MemoryCache extends Event {
  constructor(options?: MemoryCacheOptions);

  // Connection
  createClient(): MemoryCache;
  quit(): MemoryCache;
  end(): MemoryCache;
  auth(password: StringOrCallback[]): string;
  echo(message: StringOrCallback[]): string;
  ping(message: StringOrCallback[]): string;
  swapdb(dbIndex1: number, dbIndex2: number, callback: CallbackFn): string;
  select(dbIndex: number, callback: CallbackFn): string;

  // Cluster
  cluster(...params: StringOrCallback[]): void;
  readonly(callback: CallbackFn): void;
  readwrite(callback: CallbackFn): void;

  // Geo
  geoadd(key: string, ...params: StringOrCallback[]): NumOrNull;
  geodist(key: string, member1: number, member2: number, ...params: StringOrCallback[]): string | null;
  geohash(key: string, ...members: StringOrCallback[]): string[];
  geopos(key: string, ...members: StringOrCallback[]): Array<any>;
  georadius(...members: StringOrCallback[]): void;
  georadiusbymember(...members: StringOrCallback[]): void;

  // Hash Maps
  hdel(key: string, ...fields: StringOrCallback[]): number;
  hexists(key: string, field: StringOrCallback[]): number;
  hget(key: string, field: StringOrCallback[]): AnyOrNull;
  hgetall(key: StringOrCallback[]): any;
  hincrby(key: string, field: string, value: number, callback: CallbackFn): number;
  hincrbyfloat(key: string, field: string, value: number, callback: CallbackFn): number;
  hkeys(key: StringOrCallback[]): string[];
  hlen(key: StringOrCallback[]): number;
  hmget(key: string, ...fields: StringOrCallback[]): string[];
  hmset(key: string, ...params: StringOrCallback[]): string;
  hscan(key: string, cursor: any, pattern: any, count: number, callback: CallbackFn): void;
  hset(key: string, field: string, value: StringOrCallback[]): number;
  hsetnx(key: string, field: string, value: StringOrCallback[]): number;
  hstrlen(key: string, field: StringOrCallback[]): number;
  hvals(key: StringOrCallback[]): string[];

  // HyperLogLog (Unique Lists)
  pfadd(key: string, ...elements: StringOrCallback[]): void;
  pfcount(...keys: StringOrCallback[]): void;
  pfmerge(destkey: string, ...srckeys: StringOrCallback[]): void;

  // Key
  del(...keys: StringOrCallback[]): number;
  dump(key: StringOrCallback[]): string;
  exists(...keys: StringOrCallback[]): number;
  expire(key: string, seconds: number, callback: CallbackFn): number;
  expireat(key: string, timestamp: number, callback: CallbackFn): number;
  keys(pattern: StringOrCallback[]): string[];
  migrate(...params: StringOrCallback[]): void;
  move(key: string, dbIndex: number, callback: CallbackFn): number;
  object(subcommand: string, ...params: StringOrCallback[]): void;
  persist(key: StringOrCallback[]): number;
  pexpire(key: string, millisecond: number, callback: CallbackFn): number;
  pexpireat(key: string, timestamp: number, callback: CallbackFn): number;
  pttl(key: StringOrCallback[]): number;
  randomkey(callback): string;
  rename(key: string, newkey: StringOrCallback[]): string;
  renamenx(key: string, newkey: StringOrCallback[]): string;
  restore(key: string, ttl: number, value: any, replace: boolean, callback: CallbackFn): string;
  scan(cursor: any, pattern: string, count: number, callback: CallbackFn): void;
  sort(key: string, ...params: StringOrCallback[]): void;
  touch(...keys: StringOrCallback[]): number;
  ttl(key: StringOrCallback[]): number;
  // @ts-ignore
  type(key: StringOrCallback[]): string;
  unlink(...keys: StringOrCallback[]): number;
  wait(numslaves: number, timeout: number, callback: CallbackFn): void;

  // Lists (Array / Queue / Stack)
  blpop(...params: StringOrCallback[]): void
  bepop(...params: StringOrCallback[]): void
  bepoplpush(...params: StringOrCallback[]): void

  lindex(key: string, index: number, callback: CallbackFn): AnyOrNull;
  linsert(key: string, before: boolean | string, pivot: number, value: StringOrCallback[]): number;
  llen(key: StringOrCallback[]): number;
  lpop(key: StringOrCallback[]): AnyOrNull;
  lpush(key: string, value: StringOrCallback[]): number;
  lpushx(key: string, value: StringOrCallback[]): number;
  lrange(key: string, start: number, stop: number, callback: CallbackFn): Array<any>;
  lrem(key: string, count: number, value: StringOrCallback[]): number;
  lset(key: string, index: number, value: StringOrCallback[]): string;
  ltrim(key: string, start: number, stop: number, callback: CallbackFn): Array<any>;

  rpop(key: StringOrCallback[]): AnyOrNull;
  rpoplpush(sourcekey: string, destkey: StringOrCallback[]): AnyOrNull;
  rpush(key: string, value: StringOrCallback[]): number;
  rpushx(key: string, value: StringOrCallback[]): number;

  // Pub/Sub
  psubscribe(...params: StringOrCallback[]): void;
  pubsub(...params: StringOrCallback[]): void;
  publish(...params: StringOrCallback[]): void;
  punsubscribe(...params: StringOrCallback[]): void;
  subscribe(...params: StringOrCallback[]): void;
  unsubscribe(...params: StringOrCallback[]): void;

  // Scripting
  eval(...params: StringOrCallback[]): void;
  evalsha(...params: StringOrCallback[]): void;
  script(...params: StringOrCallback[]): void;

  // Server
  bgrewriteaof(callback: CallbackFn): void;
  bgsave(callback: CallbackFn): string;
  client(...params: StringOrCallback[]): void;
  command(...params: StringOrCallback[]): void;
  config(...params: StringOrCallback[]): void;
  dbsize(callback: CallbackFn): number;
  debug(command: string, ...params: StringOrCallback[]): void;
  flushall(...params: StringOrCallback[]): string;
  flushdb(callback: CallbackFn): string;
  info(section: StringOrCallback[]): string;
  lastsave(callback: CallbackFn): number;
  monitor(callback: CallbackFn): void;
  role(callback: CallbackFn): Array<any>;
  save(callback: CallbackFn): string;
  shutdown(callback: CallbackFn): void;
  slaveof(host: string, port: number): void;
  slowlog(command: string, param: any): void;
  sync(callback: CallbackFn): void;
  time(callback: CallbackFn): number;

  // Sets
  sadd(key: string, ...members: StringOrCallback[]): number;
  scard(key: StringOrCallback[]): number;
  sdiff(key: string, ...keys: StringOrCallback[]): number;
  sdiffstore(destkey: string, key: string, ...keys: StringOrCallback[]): number;
  sinter(key: string, ...keys: StringOrCallback[]): number;
  sinterstore(destkey: string, key: string, ...keys: StringOrCallback[]): number;
  sismember(key: string, member: StringOrCallback[]): number;
  smembers(key: StringOrCallback[]): string[];
  smove(sourcekey: string, destkey: string, member: string, callback): number;
  spop(key: string, count: number, callback: CallbackFn): string[];
  srandmember(key: string, count: number, callback: CallbackFn): string[];
  srem(key: string, ...members: StringOrCallback[]): number;
  sscan(...params: StringOrCallback[]): void;
  sunion(key: string,...keys: StringOrCallback[]): number;
  sunionstore(destkey: string, key: string, ...keys: StringOrCallback[]): number;

  // Sorted Sets
  zadd(key: string, ...params: StringOrCallback[]): number;
  zcard(key: StringOrCallback[]): number;
  zcount(key: string, min: string, max: StringOrCallback[]): number;
  zincrby(key: string, increment: number, member: StringOrCallback[]): number;
  zinterstore(...params: StringOrCallback[]): void;
  zlexcount(key: string, min: string, max: StringOrCallback[]): number;
  zrange(key: string, start: number, stop: number, ...params: StringOrCallback[]): string[];
  zrangebylex(key: string, min: number, max: number, ...params: StringOrCallback[]): string[];
  zrangebyscore(key: string, min: number, max: number, ...params: StringOrCallback[]): string[];
  zrank(key: string, member: number, callback: CallbackFn): NumOrNull;
  zrem(key: string, ...members: StringOrCallback[]): number;
  zremrangebylex(key: string, min: string, max: StringOrCallback[]): number;
  zremrangebyrank(key: string, start: number, stop: number, callback: CallbackFn): number;
  zremrangebyscore(key: string, min: number, max: number, callback: CallbackFn): number;
  zrevrange(key: string, start: number, stop: number, ...params: StringOrCallback[]): string[];
  zrevrangebylex(key: string, max: string, min: string, ...params: StringOrCallback[]): string[];
  zrevrangebyscore(key: string, member: StringOrCallback[]): string[];
  zrevrank(key: string, member: StringOrCallback[]): NumOrNull;
  zscore(key: string, member: StringOrCallback[]): string;
  zunionstore(...params: StringOrCallback[]): void;
  zscan(...params: StringOrCallback[]): void;

  // Strings
  append(key: string, value: StringOrCallback[]): number;
  bitcount(key: string, ...params: StringOrCallback[]): number;
  bitfield(...params: StringOrCallback[]): void;
  bitop(operation: string, destkey: string, ...srckeys: StringOrCallback[]): number;
  bitpos(key: string, bit: number, start: number, end: number, callback: CallbackFn): void;
  decr(key: StringOrCallback[]): number;
  decrby(key: string, amount: number, callback: CallbackFn): number;
  get(key: StringOrCallback[]): string;
  getbit(key: string, offset: number, callback: CallbackFn): number;
  getrange(key: string, start: number, end: number, callback: CallbackFn): string;
  getset(key: string, value: StringOrCallback[]): string;
  incr(key: StringOrCallback[]): number;
  incrby(key: string, amount: number, callback: CallbackFn): number;
  incrbyfloat(key: string, amount: number, callback: CallbackFn): number;
  mget(...keys: StringOrCallback[]): string[];
  mset(...params: StringOrCallback[]): number;
  msetnx(...params: StringOrCallback[]): number;
  psetex(key: string, pttl: number, value: StringOrCallback[]): string;
  set(key: string, value: string, ...params: StringOrCallback[]): string;
  setbit(key: string, offset: number, value: number, callback: CallbackFn): number;
  setex(key: string, ttl: number, value: StringOrCallback[]): number;
  setnx(key: string, value: StringOrCallback[]): number;
  setrange(key: string, offset: number, value: StringOrCallback[]): number;
  strlen(key: StringOrCallback[]): number;

  // Transactions
  discard(callback: CallbackFn, silent: boolean): string;
  exec(callback: CallbackFn): string;
  multi(callback: CallbackFn): string;
  unwatch(callback: CallbackFn): void;
  watch(callback: CallbackFn): void;

  // Async
  createClientAsync(): Promise<MemoryCache>;
  quitAsync(): Promise<MemoryCache>;
  endAsync(): Promise<MemoryCache>;
  authAsync(password: StringOrCallback[]): Promise<string>;
  echoAsync(message: StringOrCallback[]): Promise<string>;
  pingAsync(message: StringOrCallback[]): Promise<string>;
  swapdbAsync(dbIndex1: number, dbIndex2: number, callback: CallbackFn): Promise<string>;
  selectAsync(dbIndex: number, callback: CallbackFn): Promise<string>;
  clusterAsync(...params: StringOrCallback[]): Promise<void>;
  readonlyAsync(callback: CallbackFn): Promise<void>;
  readwriteAsync(callback: CallbackFn): Promise<void>;
  geoaddAsync(key: string, ...params: StringOrCallback[]): Promise<NumOrNull>;
  geodistAsync(key: string, member1: number, member2: number, ...params: StringOrCallback[]): Promise<string | null>;
  geohashAsync(key: string, ...members: StringOrCallback[]): Promise<string[]>;
  geoposAsync(key: string, ...members: StringOrCallback[]): Promise<Array<any>>;
  georadiusAsync(...members: StringOrCallback[]): Promise<void>;
  georadiusbymemberAsync(...members: StringOrCallback[]): Promise<void>;
  hdelAsync(key: string, ...fields: StringOrCallback[]): Promise<number>;
  hexistsAsync(key: string, field: StringOrCallback[]): Promise<number>;
  hgetAsync(key: string, field: StringOrCallback[]): Promise<AnyOrNull>;
  hgetallAsync(key: StringOrCallback[]): Promise<any>;
  hincrbyAsync(key: string, field: string, value: number, callback: CallbackFn): Promise<number>;
  hincrbyfloatAsync(key: string, field: string, value: number, callback: CallbackFn): Promise<number>;
  hkeysAsync(key: StringOrCallback[]): Promise<string[]>;
  hlenAsync(key: StringOrCallback[]): Promise<number>;
  hmgetAsync(key: string, ...fields: StringOrCallback[]): Promise<string[]>;
  hmsetAsync(key: string, ...params: StringOrCallback[]): Promise<string>;
  hscanAsync(key: string, cursor: any, pattern: any, count: number, callback: CallbackFn): Promise<void>;
  hsetAsync(key: string, field: string, value: StringOrCallback[]): Promise<number>;
  hsetnxAsync(key: string, field: string, value: StringOrCallback[]): Promise<number>;
  hstrlenAsync(key: string, field: StringOrCallback[]): Promise<number>;
  hvalsAsync(key: StringOrCallback[]): Promise<string[]>;
  pfaddAsync(key: string, ...elements: StringOrCallback[]): Promise<void>;
  pfcountAsync(...keys: StringOrCallback[]): Promise<void>;
  pfmergeAsync(destkey: string, ...srckeys: StringOrCallback[]): Promise<void>;
  delAsync(...keys: StringOrCallback[]): Promise<number>;
  dumpAsync(key: StringOrCallback[]): Promise<string>;
  existsAsync(...keys: StringOrCallback[]): Promise<number>;
  expireAsync(key: string, seconds: number, callback: CallbackFn): Promise<number>;
  expireatAsync(key: string, timestamp: number, callback: CallbackFn): Promise<number>;
  keysAsync(pattern: StringOrCallback[]): Promise<string[]>;
  migrateAsync(...params: StringOrCallback[]): Promise<void>;
  moveAsync(key: string, dbIndex: number, callback: CallbackFn): Promise<number>;
  objectAsync(subcommand: string, ...params: StringOrCallback[]): Promise<void>;
  persistAsync(key: StringOrCallback[]): Promise<number>;
  pexpireAsync(key: string, millisecond: number, callback: CallbackFn): Promise<number>;
  pexpireatAsync(key: string, timestamp: number, callback: CallbackFn): Promise<number>;
  pttlAsync(key: StringOrCallback[]): Promise<number>;
  randomkeyAsync(callback): Promise<string>;
  renameAsync(key: string, newkey: StringOrCallback[]): Promise<string>;
  renamenxAsync(key: string, newkey: StringOrCallback[]): Promise<string>;
  restoreAsync(key: string, ttl: number, value: any, replace: boolean, callback: CallbackFn): Promise<string>;
  scanAsync(cursor: any, pattern: string, count: number, callback: CallbackFn): Promise<void>;
  sortAsync(key: string, ...params: StringOrCallback[]): Promise<void>;
  touchAsync(...keys: StringOrCallback[]): Promise<number>;
  ttlAsync(key: StringOrCallback[]): Promise<number>;
  typeAsync(key: StringOrCallback[]): Promise<string>;
  unlinkAsync(...keys: StringOrCallback[]): Promise<number>;
  waitAsync(numslaves: number, timeout: number, callback: CallbackFn): Promise<void>;
  blpopAsync(...params: StringOrCallback[]): Promise<void>;
  bepopAsync(...params: StringOrCallback[]): Promise<void>;
  bepoplpushAsync(...params: StringOrCallback[]): Promise<void>;
  lindexAsync(key: string, index: number, callback: CallbackFn): Promise<AnyOrNull>;
  linsertAsync(key: string, before: boolean | string, pivot: number, value: StringOrCallback[]): Promise<number>;
  llenAsync(key: StringOrCallback[]): Promise<number>;
  lpopAsync(key: StringOrCallback[]): Promise<AnyOrNull>;
  lpushAsync(key: string, value: StringOrCallback[]): Promise<number>;
  lpushxAsync(key: string, value: StringOrCallback[]): Promise<number>;
  lrangeAsync(key: string, start: number, stop: number, callback: CallbackFn): Promise<Array<any>>;
  lremAsync(key: string, count: number, value: StringOrCallback[]): Promise<number>;
  lsetAsync(key: string, index: number, value: StringOrCallback[]): Promise<string>;
  ltrimAsync(key: string, start: number, stop: number, callback: CallbackFn): Promise<Array<any>>;
  rpopAsync(key: StringOrCallback[]): Promise<AnyOrNull>;
  rpoplpushAsync(sourcekey: string, destkey: StringOrCallback[]): Promise<AnyOrNull>;
  rpushAsync(key: string, value: StringOrCallback[]): Promise<number>;
  rpushxAsync(key: string, value: StringOrCallback[]): Promise<number>;
  psubscribeAsync(...params: StringOrCallback[]): Promise<void>;
  pubsubAsync(...params: StringOrCallback[]): Promise<void>;
  publishAsync(...params: StringOrCallback[]): Promise<void>;
  punsubscribeAsync(...params: StringOrCallback[]): Promise<void>;
  subscribeAsync(...params: StringOrCallback[]): Promise<void>;
  unsubscribeAsync(...params: StringOrCallback[]): Promise<void>;
  evalAsync(...params: StringOrCallback[]): Promise<void>;
  evalshaAsync(...params: StringOrCallback[]): Promise<void>;
  scriptAsync(...params: StringOrCallback[]): Promise<void>;
  bgrewriteaofAsync(callback: CallbackFn): Promise<void>;
  bgsaveAsync(callback: CallbackFn): Promise<string>;
  clientAsync(...params: StringOrCallback[]): Promise<void>;
  commandAsync(...params: StringOrCallback[]): Promise<void>;
  configAsync(...params: StringOrCallback[]): Promise<void>;
  dbsizeAsync(callback: CallbackFn): Promise<number>;
  debugAsync(command: string, ...params: StringOrCallback[]): Promise<void>;
  flushallAsync(...params: StringOrCallback[]): Promise<string>;
  flushdbAsync(callback: CallbackFn): Promise<string>;
  infoAsync(section: StringOrCallback[]): Promise<string>;
  lastsaveAsync(callback: CallbackFn): Promise<number>;
  monitorAsync(callback: CallbackFn): Promise<void>;
  roleAsync(callback: CallbackFn): Promise<Array<any>>;
  saveAsync(callback: CallbackFn): Promise<string>;
  shutdownAsync(callback: CallbackFn): Promise<void>;
  slaveofAsync(host: string, port: number): Promise<void>;
  slowlogAsync(command: string, param: any): Promise<void>;
  syncAsync(callback: CallbackFn): Promise<void>;
  timeAsync(callback: CallbackFn): Promise<number>;
  saddAsync(key: string, ...members: StringOrCallback[]): Promise<number>;
  scardAsync(key: StringOrCallback[]): Promise<number>;
  sdiffAsync(key: string, ...keys: StringOrCallback[]): Promise<number>;
  sdiffstoreAsync(destkey: string, key: string, ...keys: StringOrCallback[]): Promise<number>;
  sinterAsync(key: string, ...keys: StringOrCallback[]): Promise<number>;
  sinterstoreAsync(destkey: string, key: string, ...keys: StringOrCallback[]): Promise<number>;
  sismemberAsync(key: string, member: StringOrCallback[]): Promise<number>;
  smembersAsync(key: StringOrCallback[]): Promise<string[]>;
  smoveAsync(sourcekey: string, destkey: string, member: string, callback): Promise<number>;
  spopAsync(key: string, count: number, callback: CallbackFn): Promise<string[]>;
  srandmemberAsync(key: string, count: number, callback: CallbackFn): Promise<string[]>;
  sremAsync(key: string, ...members: StringOrCallback[]): Promise<number>;
  sscanAsync(...params: StringOrCallback[]): Promise<void>;
  sunionAsync(key: string,...keys: StringOrCallback[]): Promise<number>;
  sunionstoreAsync(destkey: string, key: string, ...keys: StringOrCallback[]): Promise<number>;
  zaddAsync(key: string, ...params: StringOrCallback[]): Promise<number>;
  zcardAsync(key: StringOrCallback[]): Promise<number>;
  zcountAsync(key: string, min: string, max: StringOrCallback[]): Promise<number>;
  zincrbyAsync(key: string, increment: number, member: StringOrCallback[]): Promise<number>;
  zinterstoreAsync(...params: StringOrCallback[]): Promise<void>;
  zlexcountAsync(key: string, min: string, max: StringOrCallback[]): Promise<number>;
  zrangeAsync(key: string, start: number, stop: number, ...params: StringOrCallback[]): Promise<string[]>;
  zrangebylexAsync(key: string, min: number, max: number, ...params: StringOrCallback[]): Promise<string[]>;
  zrangebyscoreAsync(key: string, min: number, max: number, ...params: StringOrCallback[]): Promise<string[]>;
  zrankAsync(key: string, member: number, callback: CallbackFn): Promise<NumOrNull>;
  zremAsync(key: string, ...members: StringOrCallback[]): Promise<number>;
  zremrangebylexAsync(key: string, min: string, max: StringOrCallback[]): Promise<number>;
  zremrangebyrankAsync(key: string, start: number, stop: number, callback: CallbackFn): Promise<number>;
  zremrangebyscoreAsync(key: string, min: number, max: number, callback: CallbackFn): Promise<number>;
  zrevrangeAsync(key: string, start: number, stop: number, ...params: StringOrCallback[]): Promise<string[]>;
  zrevrangebylexAsync(key: string, max: string, min: string, ...params: StringOrCallback[]): Promise<string[]>;
  zrevrangebyscoreAsync(key: string, member: StringOrCallback[]): Promise<string[]>;
  zrevrankAsync(key: string, member: StringOrCallback[]): Promise<NumOrNull>;
  zscoreAsync(key: string, member: StringOrCallback[]): Promise<string>;
  zunionstoreAsync(...params: StringOrCallback[]): Promise<void>;
  zscanAsync(...params: StringOrCallback[]): Promise<void>;
  appendAsync(key: string, value: StringOrCallback[]): Promise<number>;
  bitcountAsync(key: string, ...params: StringOrCallback[]): Promise<number>;
  bitfieldAsync(...params: StringOrCallback[]): Promise<void>;
  bitopAsync(operation: string, destkey: string, ...srckeys: StringOrCallback[]): Promise<number>;
  bitposAsync(key: string, bit: number, start: number, end: number, callback: CallbackFn): Promise<void>;
  decrAsync(key: StringOrCallback[]): Promise<number>;
  decrbyAsync(key: string, amount: number, callback: CallbackFn): Promise<number>;
  getAsync(key: StringOrCallback[]): Promise<string>;
  getbitAsync(key: string, offset: number, callback: CallbackFn): Promise<number>;
  getrangeAsync(key: string, start: number, end: number, callback: CallbackFn): Promise<string>;
  getsetAsync(key: string, value: StringOrCallback[]): Promise<string>;
  incrAsync(key: StringOrCallback[]): Promise<number>;
  incrbyAsync(key: string, amount: number, callback: CallbackFn): Promise<number>;
  incrbyfloatAsync(key: string, amount: number, callback: CallbackFn): Promise<number>;
  mgetAsync(...keys: StringOrCallback[]): Promise<string[]>;
  msetAsync(...params: StringOrCallback[]): Promise<number>;
  msetnxAsync(...params: StringOrCallback[]): Promise<number>;
  psetexAsync(key: string, pttl: number, value: StringOrCallback[]): Promise<string>;
  setAsync(key: string, value: string, ...params: StringOrCallback[]): Promise<string>;
  setbitAsync(key: string, offset: number, value: number, callback: CallbackFn): Promise<number>;
  setexAsync(key: string, ttl: number, value: StringOrCallback[]): Promise<number>;
  setnxAsync(key: string, value: StringOrCallback[]): Promise<number>;
  setrangeAsync(key: string, offset: number, value: StringOrCallback[]): Promise<number>;
  strlenAsync(key: StringOrCallback[]): Promise<number>;
  discardAsync(callback: CallbackFn, silent: boolean): Promise<string>;
  execAsync(callback: CallbackFn): Promise<string>;
  multiAsync(callback: CallbackFn): Promise<string>;
  unwatchAsync(callback: CallbackFn): Promise<void>;
  watchAsync(callback: CallbackFn): Promise<void>;
}

declare const obj: MemoryCache;
export default obj;