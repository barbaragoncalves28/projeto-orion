const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}

const pool = new Pool({ connectionString })

async function main() {
  const schemaPath = path.join(__dirname, 'docs', 'seed-db.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')

  // Use a single dedicated connection so the session setting below persists
  // across the whole load (a pooled .query() may land on a different backend).
  const client = await pool.connect()

  try {
    // Reset to a clean schema first.
    await client.query(
      'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;',
    )

    // The dump is a real export, so its data is internally consistent, but its
    // statement ordering (inserts before dependency rows, FKs added last)
    // fights enforcement during a fresh load. Disable FK/trigger enforcement
    // for this session so load order doesn't matter; constraints are still
    // created and apply to all future writes.
    await client.query('SET session_replication_role = replica;')
    await client.query(schema)
    await client.query('SET session_replication_role = origin;')

    console.log('Database seeded!')
  } catch (error) {
    console.error(error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
