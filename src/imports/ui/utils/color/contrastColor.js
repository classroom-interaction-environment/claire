import { invertColor } from './invertColor'

export const contrastColor = function contrastColor (hexColor) {
  const hc = hexColor.indexOf('#') === -1 ? hexColor : hexColor.substring(1, hexColor.length)
  return invertColor(hc, true)
}
