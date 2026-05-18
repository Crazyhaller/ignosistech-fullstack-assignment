import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'
import dotenv from 'dotenv'
import { pool } from '../src/db'

dotenv.config()

const csvFilePath = path.join(__dirname, '../data/my_pois.csv')

interface StoreRow {
  id: string
  brand_name: string
  latitude: string
  longitude: string
  status: string
  state: string
  city: string
}

const rows: StoreRow[] = []

const BATCH_SIZE = 1000

async function insertBatch(batch: StoreRow[]) {
  const client = await pool.connect()

  try {
    const values: any[] = []
    const placeholders: string[] = []

    let paramIndex = 1

    for (const row of batch) {
      const { id, brand_name, latitude, longitude, status, state, city } = row

      if (!id || isNaN(Number(latitude)) || isNaN(Number(longitude))) {
        continue
      }

      placeholders.push(`
        (
          $${paramIndex++},
          $${paramIndex++},
          $${paramIndex++},
          $${paramIndex++},
          $${paramIndex++},
          $${paramIndex++},
          $${paramIndex++},
          ST_SetSRID(
            ST_MakePoint(
              $${paramIndex - 4},
              $${paramIndex - 5}
            ),
            4326
          )::geography
        )
      `)

      values.push(
        id,
        brand_name,
        Number(latitude),
        Number(longitude),
        status,
        state,
        city,
      )
    }

    await client.query(
      `
      INSERT INTO stores (
        id,
        brand_name,
        latitude,
        longitude,
        status,
        state,
        city,
        geom
      )
      VALUES ${placeholders.join(',')}
      ON CONFLICT (id) DO NOTHING
    `,
      values,
    )
  } catch (error) {
    console.error(error)
  } finally {
    client.release()
  }
}

async function importCsv() {
  console.log('Reading CSV...')

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (data) => {
      rows.push(data)
    })
    .on('end', async () => {
      console.log(`Loaded ${rows.length} rows`)
      console.log('Starting batch inserts...')

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE)

        await insertBatch(batch)

        console.log(`Inserted ${Math.min(i + BATCH_SIZE, rows.length)} rows`)
      }

      console.log('CSV Import Complete')

      process.exit(0)
    })
}

importCsv()
