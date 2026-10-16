/** Lê um arquivo escolhido pelo usuário como texto UTF-8. */
export function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error ?? new Error('falha ao ler o arquivo'))
    reader.readAsText(file)
  })
}
