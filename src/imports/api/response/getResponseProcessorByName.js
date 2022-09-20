import { ResponseProcessorRegistry } from '../../contexts/tasks/responseProcessors/ResponseProcessorRegistry'

export const getResponseProcessorByName = name => {
  return ResponseProcessorRegistry.get(name)
}
