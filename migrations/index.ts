import * as migration_20261005_173122_baseline from './20261005_173122_baseline'
import * as migration_20261007_165124_poster_dims from './20261007_165124_poster_dims'
import * as migration_20261008_175022_production_title from './20261008_175022_production_title'
import * as migration_20261008_180546_admin_review_2_fields from './20261008_180546_admin_review_2_fields'
import * as migration_20261008_212024_drop_tags from './20261008_212024_drop_tags'
import * as migration_20261008_222722_share_image from './20261008_222722_share_image'

export const migrations = [
  {
    up: migration_20261005_173122_baseline.up,
    down: migration_20261005_173122_baseline.down,
    name: '20261005_173122_baseline'
  },
  {
    up: migration_20261007_165124_poster_dims.up,
    down: migration_20261007_165124_poster_dims.down,
    name: '20261007_165124_poster_dims'
  },
  {
    up: migration_20261008_175022_production_title.up,
    down: migration_20261008_175022_production_title.down,
    name: '20261008_175022_production_title'
  },
  {
    up: migration_20261008_180546_admin_review_2_fields.up,
    down: migration_20261008_180546_admin_review_2_fields.down,
    name: '20261008_180546_admin_review_2_fields'
  },
  {
    up: migration_20261008_212024_drop_tags.up,
    down: migration_20261008_212024_drop_tags.down,
    name: '20261008_212024_drop_tags'
  },
  {
    up: migration_20261008_222722_share_image.up,
    down: migration_20261008_222722_share_image.down,
    name: '20261008_222722_share_image'
  }
]
