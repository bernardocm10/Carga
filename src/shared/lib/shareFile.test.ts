import { afterEach, describe, expect, it, vi } from 'vitest'
import { shareTextFile } from './shareFile'

// vi.mock é içado pro topo do arquivo; os mocks precisam nascer junto via vi.hoisted
const { isNativePlatform, writeFile, share } = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  writeFile: vi.fn(() => Promise.resolve({ uri: 'file:///cache/backup.json' })),
  share: vi.fn(() => Promise.resolve({})),
}))

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform } }))
vi.mock('@capacitor/filesystem', () => ({
  Filesystem: { writeFile },
  Directory: { Cache: 'CACHE' },
  Encoding: { UTF8: 'utf8' },
}))
vi.mock('@capacitor/share', () => ({ Share: { share } }))

afterEach(() => {
  vi.clearAllMocks()
  isNativePlatform.mockReturnValue(false)
})

describe('shareTextFile', () => {
  it('no Android grava no cache e abre o share sheet', async () => {
    isNativePlatform.mockReturnValue(true)
    await shareTextFile('backup.json', '{}')
    expect(writeFile).toHaveBeenCalledWith({
      path: 'backup.json',
      data: '{}',
      directory: 'CACHE',
      encoding: 'utf8',
    })
    expect(share).toHaveBeenCalledWith({
      title: 'backup.json',
      files: ['file:///cache/backup.json'],
    })
  })

  it('cancelar o compartilhamento não é erro', async () => {
    isNativePlatform.mockReturnValue(true)
    share.mockRejectedValueOnce(new Error('Share canceled'))
    await expect(shareTextFile('backup.json', '{}')).resolves.toBeUndefined()
  })

  it('outra falha do share propaga', async () => {
    isNativePlatform.mockReturnValue(true)
    share.mockRejectedValueOnce(new Error('No activity found'))
    await expect(shareTextFile('backup.json', '{}')).rejects.toThrow('No activity found')
  })

  it('no navegador baixa via link', async () => {
    const createObjectURL = vi.fn(() => 'blob:x')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    await shareTextFile('backup.json', '{}')

    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:x')
    expect(writeFile).not.toHaveBeenCalled()
    click.mockRestore()
    vi.unstubAllGlobals()
  })
})
