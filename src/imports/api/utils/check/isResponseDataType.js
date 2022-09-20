import { ResponseDataTypes } from '../../plugins/ResponseDataTypes'

export const isResponseDataType = t => typeof t === 'string'
  ? Boolean(ResponseDataTypes[t])
  : t.name && Boolean(ResponseDataTypes[t.name])
