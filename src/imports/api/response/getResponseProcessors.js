import { ResponseProcessorRegistry } from '../../contexts/tasks/responseProcessors/ResponseProcessorRegistry'

/**
 * Returns a list of response handlers for a given {InteractionDataType}.
 *
 * @param fileType
 * @param dataType
 * @param handlerType
 * @return {any}
 */
export const getResponseProcessors = ({ fileType, dataType }, { handlerType } = {}) => {
  const responseHandlers = fileType
    ? ResponseProcessorRegistry.allForFileType(fileType)
    : ResponseProcessorRegistry.allForDataType(dataType)
  return handlerType
    ? responseHandlers.filter(context => context.type === handlerType)
    : responseHandlers
}
