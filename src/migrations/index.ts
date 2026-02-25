import * as migration_20260225_105915 from './20260225_105915';

export const migrations = [
  {
    up: migration_20260225_105915.up,
    down: migration_20260225_105915.down,
    name: '20260225_105915'
  },
];
