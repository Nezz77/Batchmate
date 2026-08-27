export function getImageUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('file://')
  ) {
    return path
  }
  // Strip leading slash so relative resolution works in both Vite dev server and packaged Electron file:// protocol
  if (path.startsWith('/')) {
    return path.slice(1)
  }
  return path
}
