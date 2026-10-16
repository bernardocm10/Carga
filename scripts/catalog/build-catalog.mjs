import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const COMMIT = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5'
const RAW = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${COMMIT}`
const ROOT = path.resolve(import.meta.dirname, '../..')
const IMAGES_DIR = path.join(ROOT, 'public/exercises')
const CATALOG_FILE = path.join(ROOT, 'src/entities/exercise-catalog/data/catalog.json')
const WIDTH = 400
const QUALITY = 70
const CONCURRENCY = 8

async function download(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return Buffer.from(await response.arrayBuffer())
}

async function convert(sourcePath) {
  const outFile = path.join(IMAGES_DIR, sourcePath.replace(/\.jpg$/, '.webp'))
  if (existsSync(outFile)) return
  const jpg = await download(`${RAW}/exercises/${sourcePath}`)
  await mkdir(path.dirname(outFile), { recursive: true })
  await sharp(jpg)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(outFile)
}

async function runPool(items, worker) {
  const queue = [...items]
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) await worker(item)
    }),
  )
}

const source = JSON.parse((await download(`${RAW}/dist/exercises.json`)).toString('utf8'))
const withPhotos = source.filter((exercise) => exercise.images.length >= 2)

await runPool(
  withPhotos.flatMap((exercise) => exercise.images.slice(0, 2)),
  convert,
)

const catalog = withPhotos
  .map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    primaryMuscles: exercise.primaryMuscles,
    equipment: exercise.equipment ?? null,
    variants: [
      {
        sourceId: exercise.id,
        images: exercise.images.slice(0, 2).map((image) => image.replace(/\.jpg$/, '.webp')),
      },
    ],
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

await mkdir(path.dirname(CATALOG_FILE), { recursive: true })
await writeFile(CATALOG_FILE, JSON.stringify(catalog, null, 2) + '\n')
console.log(
  `${catalog.length} exercícios, ${catalog.length * 2} fotos (acervo ${COMMIT.slice(0, 7)})`,
)
