import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

function isCancel(error: unknown): boolean {
  return error instanceof Error && /cancel/i.test(error.message)
}

/** Entrega um arquivo de texto ao usuário: share sheet no Android, download no navegador. */
export async function shareTextFile(filename: string, text: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: text,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })
    try {
      await Share.share({ title: filename, files: [uri] })
    } catch (error) {
      if (!isCancel(error)) throw error
    }
    return
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
