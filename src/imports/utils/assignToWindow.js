import { onClientExec } from '../api/utils/archUtils'

/**
 * Allows assigning functions and objects to the window object.
 * Use with care and only when there is a real benefit, for example
 * for debugging etc.
 * @param target {object}
 */
export const assignToWindow = target => onClientExec(() => Object.assign(window, target))
