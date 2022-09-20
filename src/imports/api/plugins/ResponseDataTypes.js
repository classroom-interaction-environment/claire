export const ResponseDataTypes = {
  rawResponse: {
    name: 'rawResponse',
    type: String,
    from: function (response) {
      return response
    }
  },
  text: {
    name: 'text',
    type: String,
    from: function (response) {
      return response[0]
    }
  },
  textList: {
    name: 'textList',
    type: String,
    isArray: true,
    from: function (response) {
      return response
    }
  },
  singleChoice: {
    name: 'singleChoice',
    type: String,
    from: function (response) {
      return response[0]
    }
  },
  multipleChoice: {
    name: 'multipleChoice',
    type: String,
    isArray: true,
    from: function (response) {
      return response
    }
  },
  numerical: {
    name: 'numerical',
    type: Number,
    from: function (response) {
      return Number(response[0])
    }
  },
  multiNumerical: {
    name: ',multiNumerical',
    type: Number,
    isArray: true,
    from: function (response) {
      return response.map(value => {
        return typeof value === 'number'
          ? value
          : Number(value)
      })
    }
  },
  dichotome: {
    name: 'dichotome',
    type: Boolean,
    from: function (response) {
      return Boolean(response[0])
    }
  },
  file: {
    name: 'file',
    type: String,
    isArray: true,
    from: function (response, item = {}) {
      return (item.multiple)
        ? response
        : response?.[0]
    }
  }
}
