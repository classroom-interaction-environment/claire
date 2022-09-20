export const Fields = {}

let _default = { _id: 1 }

function setDefault (obj) {
  _default = obj
}

Fields.setDefault = setDefault

function getDefault () {
  return Object.assign({}, _default)
}

Fields.getDefault = getDefault

function withDefault (obj) {
  return Object.assign({}, _default, obj)
}

Fields.withDefault = withDefault
