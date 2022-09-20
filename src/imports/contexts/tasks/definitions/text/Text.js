import { Alignment } from '../common/align'
import { Headline, Paragraph, Quote } from './static'
import { RichText } from './RichText'
import { Enum, List } from './lists'
import { ItemRef } from './item'
import { option } from '../common/helpers'
import { ITaskDefinition } from '../ITaskDefinition'

export const Text = {
  name: 'text',
  icon: 'align-left',
  label: 'taskContent.text',
  align: Alignment,
  options: () => Array.from(contexts.values()).map(el => option(el))
}

const contexts = new Map(Object.entries({
  p: Paragraph,
  rt: RichText,
  h: Headline,
  list: List,
  enum: Enum,
  quote: Quote,
  item: ItemRef
}))

Text.register = function (context) {
  contexts.set(context.name, context)
}

Text.load = function (context) {
  return typeof context.load === 'function'
    ? context.load()
    : undefined
}

Text.renderer = {
  template: 'textRenderer',
  load: async function () {
    return import('../../../../ui/renderer/text/textRenderer')
  }
}

ITaskDefinition(Text, contexts)
