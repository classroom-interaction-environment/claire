import { Template } from 'meteor/templating'

export const templateExists = t => Boolean(Template[t])
