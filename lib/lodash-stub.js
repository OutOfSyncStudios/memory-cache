/* eslint-disable object-shorthand */

import difference from 'lodash.difference';
import flatten from 'lodash.flatten';
import fromPairs from 'lodash.frompairs';
import intersection from 'lodash.intersection';
import isNil from 'lodash.isnil';
import isUndefined from 'lodash.isundefined';
import _keys from 'lodash.keys';
import merge from 'lodash.merge';
import mergeWith from 'lodash.mergewith';
import padStart from 'lodash.padstart';
import padEnd from 'lodash.padend';
import pick from 'lodash.pick';
import reverse from 'lodash.reverse';
import sample from 'lodash.sample';
import sampleSize from 'lodash.samplesize';
import size from 'lodash.size';
import sortBy from 'lodash.sortby';
import toPairs from 'lodash.topairs';
import union from 'lodash.union';

const __ = {
  difference,
  flatten,
  fromPairs,
  intersection,
  isNil,
  isUndefined,
  keys: _keys,
  merge,
  mergeWith,
  padStart,
  padEnd,
  pick,
  reverse,
  sample,
  sampleSize,
  size,
  sortBy,
  toPairs,
  union,
};

export default __;
