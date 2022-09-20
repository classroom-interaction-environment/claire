import { i18n } from '../../../../api/language/language'
import { firstOption } from '../common/helpers'
import { Alignment } from '../common/align'
import { StaticTextSchema } from './StaticSchema'

const alignmentOptions = Object.values(Alignment).map(el => ({ value: el.class, label: el.label }))
const translate = i18n.reactive

export const Paragraph = {
  name: 'p',
  icon: 'align-left',
  label: 'text.simpleText',
  schema: {
    ...StaticTextSchema({ translate }),
    align: {
      type: String,
      label: translate('orientation.title'),
      autoform: {
        defaultValue: Alignment.left.class,
        firstOption,
        options () {
          return alignmentOptions
        }
      }
    },
    hyphen: {
      type: Boolean,
      label: translate('text.hyphenActive'),
      optional: true,
      autoform: {
        defaultValue: true
      }
    },
    newline: {
      type: Boolean,
      label: translate('text.newlineActive'),
      optional: true,
      autoform: {
        defaultValue: true
      }
    }
  }
}

export const Quote = {
  name: 'quote',
  icon: 'quote-right',
  label: 'text.blockQuote',
  schema: {
    ...StaticTextSchema({ translate }),
    source: {
      type: String,
      label: translate('text.source'),
      optional: true
    },
    align: {
      type: String,
      optional: true,
      autoform: {
        firstOption,
        options () {
          return alignmentOptions
        }
      }
    }
  }
}

export const TextArea = {
  name: 'textarea',
  icon: 'font',
  label: 'text.textArea',
  schema: StaticTextSchema({ translate })
}

export const PlainText = {
  name: 'plain',
  icon: 'align-left',
  label: 'text.plain',
  schema: StaticTextSchema({ translate })
}

export const Headline = {
  name: 'h',
  icon: 'heading',
  label: 'text.headline.title',
  schema: {
    ...StaticTextSchema({ translate }),
    size: {
      type: Number,
      label: translate('text.size'),
      autoform: {
        firstOption,
        options () {
          return [
            {
              value: 1, label: i18n.get('text.headline.h1')
            },
            {
              value: 2, label: i18n.get('text.headline.h2')
            },
            {
              value: 3, label: i18n.get('text.headline.h3')
            },
            {
              value: 4, label: i18n.get('text.headline.h4')
            },
            {
              value: 5, label: i18n.get('text.headline.h5')
            },
            {
              value: 6, label: i18n.get('text.headline.h6')
            }
          ]
        }
      }
    }
  }
}
