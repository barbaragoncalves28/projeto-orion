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

  try {
    await pool.query(
      'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;',
    )
    await pool.query(schema)
    console.log('Database seeded!')
  } catch (error) {
    console.error(error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
