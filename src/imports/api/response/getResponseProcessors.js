import { ResponseProcessorRegistry } from '../../contexts/tasks/responseProcessors/ResponseProcessorRegistry'

/**
 * Returns a list of response handlers for a given {InteractionDataType}.
 *
 * @param fileType {string} name of the file type
 * @param dataType {string} one the {ResponseDataTypes} name
 * @param handlerType {string=} optional filter for certain {type} properties on a given ctx
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
