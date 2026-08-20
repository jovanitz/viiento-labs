import { bisonAgendaContract } from '../testing/bison-agenda-contract';
import { bisonStoreContract } from '../testing/bison-store-contract';
import { createInMemoryBisonStore } from './in-memory-bison-store';

bisonStoreContract('in-memory', () => createInMemoryBisonStore());
bisonAgendaContract('in-memory', () => createInMemoryBisonStore());
