import * as migration_20260225_105915 from './20260225_105915';
import * as migration_20260226_140344 from './20260226_140344';
import * as migration_20260227_181154_better_auth from './20260227_181154_better_auth';
import * as migration_20260301_200000_mcp_plugin from './20260301_200000_mcp_plugin';
import * as migration_20260301_205843 from './20260301_205843';
import * as migration_20260302_010632 from './20260302_010632';
import * as migration_20260302_124504 from './20260302_124504';
import * as migration_20260302_161337 from './20260302_161337';
import * as migration_20260303_120000_mcp_courses from './20260303_120000_mcp_courses';
import * as migration_20260708_121614_add_youtube_to_media_block from './20260708_121614_add_youtube_to_media_block';
import * as migration_20260720_230559_search_pages from './20260720_230559_search_pages';
import * as migration_20260721_120000_step_duration from './20260721_120000_step_duration';
import * as migration_20260721_140000_add_user_social_links from './20260721_140000_add_user_social_links';
import * as migration_20260721_150000_add_user_about from './20260721_150000_add_user_about';
import * as migration_20260721_233000_reconcile_schema_drift from './20260721_233000_reconcile_schema_drift';
import * as migration_20260722_090000_add_user_hide_profile_comments from './20260722_090000_add_user_hide_profile_comments';
import * as migration_20260724_120000_archive_block_collections from './20260724_120000_archive_block_collections';
import * as migration_20260724_140000_xp_events from './20260724_140000_xp_events';
import * as migration_20260724_160000_home_calendar_global from './20260724_160000_home_calendar_global';
import * as migration_20260724_170000_audit_access_and_indexes from './20260724_170000_audit_access_and_indexes';

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
    up: migration_20260302_124504.up,
    down: migration_20260302_124504.down,
    name: '20260302_124504',
  },
  {
    up: migration_20260302_161337.up,
    down: migration_20260302_161337.down,
    name: '20260302_161337',
  },
  {
    up: migration_20260303_120000_mcp_courses.up,
    down: migration_20260303_120000_mcp_courses.down,
    name: '20260303_120000_mcp_courses',
  },
  {
    up: migration_20260708_121614_add_youtube_to_media_block.up,
    down: migration_20260708_121614_add_youtube_to_media_block.down,
    name: '20260708_121614_add_youtube_to_media_block',
  },
  {
    up: migration_20260720_230559_search_pages.up,
    down: migration_20260720_230559_search_pages.down,
    name: '20260720_230559_search_pages',
  },
  {
    up: migration_20260721_120000_step_duration.up,
    down: migration_20260721_120000_step_duration.down,
    name: '20260721_120000_step_duration',
  },
  {
    up: migration_20260721_140000_add_user_social_links.up,
    down: migration_20260721_140000_add_user_social_links.down,
    name: '20260721_140000_add_user_social_links'
  },
  {
    up: migration_20260721_150000_add_user_about.up,
    down: migration_20260721_150000_add_user_about.down,
    name: '20260721_150000_add_user_about',
  },
  {
    up: migration_20260721_233000_reconcile_schema_drift.up,
    down: migration_20260721_233000_reconcile_schema_drift.down,
    name: '20260721_233000_reconcile_schema_drift',
  },
  {
    up: migration_20260722_090000_add_user_hide_profile_comments.up,
    down: migration_20260722_090000_add_user_hide_profile_comments.down,
    name: '20260722_090000_add_user_hide_profile_comments',
  },
  {
    up: migration_20260724_120000_archive_block_collections.up,
    down: migration_20260724_120000_archive_block_collections.down,
    name: '20260724_120000_archive_block_collections',
  },
  {
    up: migration_20260724_140000_xp_events.up,
    down: migration_20260724_140000_xp_events.down,
    name: '20260724_140000_xp_events',
  },
  {
    up: migration_20260724_160000_home_calendar_global.up,
    down: migration_20260724_160000_home_calendar_global.down,
    name: '20260724_160000_home_calendar_global',
  },
  {
    up: migration_20260724_170000_audit_access_and_indexes.up,
    down: migration_20260724_170000_audit_access_and_indexes.down,
    name: '20260724_170000_audit_access_and_indexes',
  },
];
