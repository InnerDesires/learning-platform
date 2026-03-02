import * as migration_20260225_105915 from './20260225_105915';
import * as migration_20260226_140344 from './20260226_140344';
import * as migration_20260227_181154_better_auth from './20260227_181154_better_auth';
import * as migration_20260301_200000_mcp_plugin from './20260301_200000_mcp_plugin';
import * as migration_20260301_205843 from './20260301_205843';
import * as migration_20260302_010632 from './20260302_010632';
import * as migration_20260302_161337 from './20260302_161337';

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
  {
    up: migration_20260301_200000_mcp_plugin.up,
    down: migration_20260301_200000_mcp_plugin.down,
    name: '20260301_200000_mcp_plugin',
  },
  {
    up: migration_20260301_205843.up,
    down: migration_20260301_205843.down,
    name: '20260301_205843',
  },
  {
    up: migration_20260302_010632.up,
    down: migration_20260302_010632.down,
    name: '20260302_010632',
  },
  {
    up: migration_20260302_161337.up,
    down: migration_20260302_161337.down,
    name: '20260302_161337'
  },
];
