import { onServerExec } from '../../api/utils/archUtils'
import { lazyInitialize } from './lazyInitialize'

export const onServerExecLazy = function (execFn) {
  return onServerExec(function () {
    const loadFn = execFn()
    if (!loadFn) throw new Error('no load function returned')
    return lazyInitialize(loadFn)
  })
}
