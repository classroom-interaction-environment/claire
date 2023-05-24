import { ResponseProcessorRegistry } from '../../contexts/tasks/responseProcessors/ResponseProcessorRegistry'

/**
 * Returns a list of response handlers for a given {InteractionDataType}.
 *
 * @param fileType {string} name of the file type
 * @param dataType {string} one the {ResponseDataTypes} name
 * @param groupMode {string=} optional group mode
 * @param handlerType {string=} optional filter for certain {type} properties on a given ctx
 * @return {any}
 */
export const getResponseProcessors = ({ fileType, dataType, groupMode }, { handlerType } = {}) => {
  const responseHandlers = fileType
    ? ResponseProcessorRegistry.allForFileType(fileType, groupMode)
    : ResponseProcessorRegistry.allForDataType(dataType, groupMode)
  return handlerType
    ? responseHandlers.filter(context => context.type === handlerType)
    : responseHandlers
}
