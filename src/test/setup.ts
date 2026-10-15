import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { db, settled } from '@/shared/db'

afterEach(async () => {
  cleanup()
  await settled()
  await Promise.all(db.tables.map((table) => table.clear()))
  localStorage.clear()
})
