import { Random } from 'meteor/random'

/**
 * Wraps options into window-options string, usable for window.open
 * @param width
 * @param height
 * @param left
 * @param top
 * @param menubar
 * @param status
 * @param titlebar
 * @param noOpener
 * @param noReferrer
 * @return {`width=100,height=100,left=50,top=50,menubar=${number},status=${number},titlebar=${number}`}
 */
export const toWindowOptions = ({
  width = 100,
  height = 100,
  left = 50,
  top = 50,
  menubar = false,
  status = false,
  titlebar = false,
  noOpener = false,
  noReferrer = false
}) => {
  let str = `width=${width},height=${height},left=${left},top=${top},menubar=${menubar ? 1 : 0},status=${status ? 1 : 0},titlebar=${titlebar ? 1 : 0}`

  if (noOpener) {
    str += ',noopener'
  }

  if (noReferrer) {
    str += ',noreferrer'
  }

  return str
}

/**
 * Opens a new window with given url (location) and default options.
 * @param location {string}
 * @param windowId {string=}
 * @param menubar {boolean=}
 * @param status {boolean=}
 * @param titlebar {boolean=}
 * @return {{ref: null, id: *}|{ref: WindowProxy, id: *}}
 */
export const openWindow = (location, {
  windowId = Random.id(8),
  menubar = false,
  status = false,
  titlebar = false
} = {}) => {
  const width = global.screen.width / 2
  const height = global.screen.height / 2
  const left = width / 2
  const top = height / 2
  const windowOptions = toWindowOptions({ width, height, left, top, menubar, status, titlebar })

  try {
    const windowRef = window.open(location, windowId, windowOptions)
    return { ref: windowRef, id: windowId }
  } catch (e) {
    console.error(e)
    return { ref: null, id: windowId }
  }
}
