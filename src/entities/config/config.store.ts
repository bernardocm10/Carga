import { create } from 'zustand'
import { persist } from '@/shared/db'
import { loadConfig, saveConfig } from './config.repo'
import { CONFIG_SEED } from './seed'
import type { Config } from './config.types'

type ConfigState = {
  config: Config
  hydrate: () => Promise<void>
  /** aplica um patch raso e persiste */
  updateConfig: (patch: Partial<Config>) => void
  /** substitui a Config inteira e persiste */
  replaceConfig: (config: Config) => void
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: CONFIG_SEED,
  hydrate: async () => {
    set({ config: await loadConfig() })
  },
  updateConfig: (patch) => {
    const next = { ...get().config, ...patch }
    set({ config: next })
    persist(saveConfig(next))
  },
  replaceConfig: (config) => {
    set({ config })
    persist(saveConfig(config))
  },
}))

/** Hook de leitura — a Config atual. */
export const useConfig = (): Config => useConfigStore((state) => state.config)
