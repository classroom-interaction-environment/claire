/* global AutoForm */

export const formIsValid = function formIsValid (schema, formId, isUpdate, debug) {
  const formDoc = isUpdate
    ? AutoForm.getFormValues(formId, undefined, schema, true)
    : AutoForm.getFormValues(formId, undefined, schema, false)

  let options

  if (isUpdate) {
    options = {}
    options.modifier = true
  }
  const context = schema.newContext()
  context.validate(formDoc, options)

  const errors = context.validationErrors()

  if (errors && errors.length > 0) {
    if (debug) debug('form validation errors', errors)
    errors.forEach(err => AutoForm.addStickyValidationError(formId, err.key, err.type, err.value))
    return null
  }
  else {
    return formDoc
  }
}

export const getFormData = formId => AutoForm.getFormValues(formId, undefined, undefined, false)

export const formReset = formId => AutoForm.resetForm(formId)

export const toOption = doc => ({ value: doc._id, label: doc.title })
