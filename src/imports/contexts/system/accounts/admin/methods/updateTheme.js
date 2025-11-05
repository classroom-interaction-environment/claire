import { WebApp } from 'meteor/webapp'
import fs from 'node:fs/promises'
import nodePath from 'node:path'

const { express } = WebApp
const ROOT = '/assets/app/theme/'
const sourcePath = (name = 'default.css') => nodePath.join(process.cwd(), ROOT, name)

/**
 * Updates the theme CSS file.
 * @param theme
 * @param reset
 * @return {Promise<*>}
 */
export const updateTheme = async ({ theme, reset }) => {
  const path = sourcePath()
  const back = sourcePath('backup.css')

  if (!theme || theme.length === 0 || reset) {
    return clear(back, path)
  }

  // if we have no backup of the original, create one
  if (!await exists(back)) {
    console.debug('[updateTheme] creating backup of original theme:')
    console.debug(path)
    console.debug(back)
    await fs.copyFile(path, back)
  }

  await write(path, theme)
}

const write = async (path, content) => {
  let handle = null;
  try {
    handle = await fs.open(path, 'w+')
    await handle.writeFile(content);
  } catch (e) {
    console.error('[updateTheme] error updating theme:', e)
  } finally {
    if (handle) {
      // close the file if it is opened.
      await handle.close();
    }
  }
}

const exists = async (path) => {
  try {
    const f = await fs.stat(path)
    console.debug('file exists?', path, f.isFile())
    return f.isFile()
  } catch (e) {
    console.error(e)
    return false;
  }
}

const clear = async (backupPath, path) => {
  if (!await exists(backupPath)) {
    return
  }
  await fs.unlink(path)
  await fs.copyFile(backupPath, path)
  await fs.unlink(backupPath)
}

WebApp.handlers.use('/app-theme', express.static(sourcePath(), {
  dotfiles: 'ignore',
  etag: true,
  extensions: ['css'],
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders: function (res, path, stat) {
    res.set('Cache-Control', 'no-store')
    res.set('Content-Type', 'text/css; charset=utf-8')
  }
}))