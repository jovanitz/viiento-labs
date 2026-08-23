import { bisonAgendaContract } from '../testing/bison-agenda-contract';
import { bisonFormatsContract } from '../testing/bison-formats-contract';
import { bisonIdentityContract } from '../testing/bison-identity-contract';
import { bisonStoreContract } from '../testing/bison-store-contract';
import { createInMemoryBisonStore } from './in-memory-bison-store';

bisonStoreContract('in-memory', () => createInMemoryBisonStore());
bisonAgendaContract('in-memory', () => createInMemoryBisonStore());
bisonFormatsContract('in-memory', () => createInMemoryBisonStore());
bisonIdentityContract('in-memory', () => createInMemoryBisonStore());
