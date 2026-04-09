export const ResponseDataTypes = {
  rawResponse: {
    name: 'rawResponse',
    type: String,
    from: (response) => response
  },
  text: {
    name: 'text',
    type: String,
    from: (response) => response[0]
  },
  textList: {
    name: 'textList',
    type: String,
    isArray: true,
    from: (response) => response
  },
  singleChoice: {
    name: 'singleChoice',
    type: String,
    from: (response) => response[0]
  },
  multipleChoice: {
    name: 'multipleChoice',
    type: String,
    isArray: true,
    from: (response) => response
  },
  numerical: {
    name: 'numerical',
    type: Number,
    from: (response) => Number(response[0])
  },
  multiNumerical: {
    name: 'multiNumerical',
    type: Number,
    isArray: true,
    from: (response) => response.map(value => {
        return typeof value === 'number'
          ? value
          : Number(value)
      })
  },
  dichotome: {
    name: 'dichotome',
    type: Boolean,
    from: (response) => Boolean(response[0])
  },
  file: {
    name: 'file',
    type: String,
    isArray: true,
    from: (response, item = {}) => (item.multiple)
        ? response
        : response?.[0]
  }
}
