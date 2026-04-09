import { onServerExec } from '../../api/utils/archUtils'
import { lazyInitialize } from './lazyInitialize'

export const onServerExecLazy = (execFn) => onServerExec(() => {
    const loadFn = execFn()
    if (!loadFn) throw new Error('no load function returned')
    return lazyInitialize(loadFn)
  })
