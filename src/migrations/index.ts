import * as migration_20260225_105915 from './20260225_105915';
import * as migration_20260226_140344 from './20260226_140344';
import * as migration_20260227_181154_better_auth from './20260227_181154_better_auth';

export const migrations = [
  {
    up: migration_20260225_105915.up,
    down: migration_20260225_105915.down,
    name: '20260225_105915',
  },
  {
    up: migration_20260226_140344.up,
    down: migration_20260226_140344.down,
    name: '20260226_140344',
  },
  {
    up: migration_20260227_181154_better_auth.up,
    down: migration_20260227_181154_better_auth.down,
    name: '20260227_181154_better_auth',
  },
];
