import { Template } from 'meteor/templating'

export const templateExists = name => {
  if (!Object.prototype.hasOwnProperty.call(Template, name)) {
    return false
  }

  const view = Template[name]
  return view instanceof Template
}
