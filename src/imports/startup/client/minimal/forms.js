import { TemplateLoader } from 'meteor/jkuester:template-loader'
import { Form } from '../../../ui/components/forms/Form'

TemplateLoader.enable()
  .register(Form.renderer.template, Form.renderer.load)
