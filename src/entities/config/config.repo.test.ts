import { describe, expect, it } from 'vitest'
import { db } from '@/shared/db'
import { loadConfig, saveConfig } from './config.repo'
import { CONFIG_SEED } from './seed'

describe('config repo', () => {
  it('sem config salva devolve a semente e grava no banco', async () => {
    expect(await loadConfig()).toEqual(CONFIG_SEED)
    expect(await db.table('config').get('main')).toEqual({ id: 'main', config: CONFIG_SEED })
  })

  it('com config salva devolve o que está salvo', async () => {
    await saveConfig({ ...CONFIG_SEED, targetCalories: 3300 })
    expect((await loadConfig()).targetCalories).toBe(3300)
  })
})
