import { beforeEach, describe, expect, it } from 'vitest'
import { db, settled } from '@/shared/db'
import { CONFIG_SEED } from './seed'
import { useConfigStore } from './config.store'

beforeEach(() => {
  useConfigStore.setState({ config: CONFIG_SEED })
})

describe('config store', () => {
  it('hydrate carrega a config salva', async () => {
    await db.table('config').put({ id: 'main', config: { ...CONFIG_SEED, targetCalories: 3300 } })
    await useConfigStore.getState().hydrate()
    expect(useConfigStore.getState().config.targetCalories).toBe(3300)
  })

  it('updateConfig aplica o patch e grava', async () => {
    useConfigStore.getState().updateConfig({ targetCalories: 3400 })
    expect(useConfigStore.getState().config.targetCalories).toBe(3400)
    await settled()
    expect(await db.table('config').get('main')).toEqual({
      id: 'main',
      config: { ...CONFIG_SEED, targetCalories: 3400 },
    })
  })
})
