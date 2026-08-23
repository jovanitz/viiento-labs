import 'fake-indexeddb/auto';
import { createInMemoryKvCache } from '@acme/application';
import { kvCacheContract } from '../testing/kv-cache-contract';
import { createDexieKvCache } from './dexie-kv-cache';

let run = 0;

kvCacheContract('in-memory', () => createInMemoryKvCache());
// Fresh database name per case — IndexedDB (fake or real) persists across
// instances, and the contract assumes an empty cache.
kvCacheContract('dexie', () => createDexieKvCache(`kv-spec-${++run}`));
