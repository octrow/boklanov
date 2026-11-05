import 'dotenv/config'
import pg from 'pg'

async function main() {
  const c = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  await c.connect()

  const before = await c.query(
    `SELECT data_type FROM information_schema.columns WHERE table_name='about_locales' AND column_name='body'`
  )
  console.log('before:', before.rows[0])
  if (before.rows[0]?.data_type === 'jsonb') {
    console.log('Already jsonb — nothing to do.')
    await c.end()
    return
  }

  await c.query(
    `ALTER TABLE about_locales ALTER COLUMN body SET DATA TYPE jsonb USING body::jsonb`
  )
  const after = await c.query(
    `SELECT data_type FROM information_schema.columns WHERE table_name='about_locales' AND column_name='body'`
  )
  console.log('after:', after.rows[0])
  await c.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
