import { create } from 'zustand'
import { loadConfig, saveConfig } from './config.repo'
import type { Config } from './config.types'

type ConfigState = {
  config: Config
  /** aplica um patch raso e persiste */
  updateConfig: (patch: Partial<Config>) => void
  /** substitui a Config inteira e persiste (usado no import de backup) */
  replaceConfig: (config: Config) => void
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: loadConfig(),
  updateConfig: (patch) => {
    const next = { ...get().config, ...patch }
    saveConfig(next)
    set({ config: next })
  },
  replaceConfig: (config) => {
    saveConfig(config)
    set({ config })
  },
}))

/** Hook de leitura — a Config atual. */
export const useConfig = (): Config => useConfigStore((state) => state.config)
