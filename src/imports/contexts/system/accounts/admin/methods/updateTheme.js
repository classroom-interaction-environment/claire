import { WebApp } from 'meteor/webapp'
import fs from 'node:fs/promises'
import nodePath from 'node:path'

const { express } = WebApp
const ROOT = '/assets/app'
const sourcePath = () => nodePath.join(process.cwd(), ROOT, 'theme/default.css')

/**
 * Updates the theme CSS file.
 * @param userId
 * @param theme
 * @param reset
 * @return {Promise<*>}
 */
export const updateTheme = async ({ userId, theme, reset }) => {
  if (!theme || theme.length === 0 || reset) {
    return clear()
  }
  const path = sourcePath()

  // backup default
  await fs.rename(path, path + '.bak')
  await write(theme)
}

const write = async (content) => {
  let handle = null;
  try {
    handle = await fs.open(sourcePath(), 'w+')
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
  let handle = null;
  try {
    handle = await fs.open(path, 'w+')
    return !!handle
  } catch {
    return false;
  } finally {
    if (handle) {
      // close the file if it is opened.
      await handle.close();
    }
  }
}

const clear = async () => {
  const path = sourcePath()
  if (!await exists(path + '.bak')) {
    return
  }
  await fs.unlink(path)
  await fs.rename(path + '.bak', path)
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