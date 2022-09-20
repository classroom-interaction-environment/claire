/* global AutoForm */
AutoForm.addInputType('iconSelect', {
  template: 'afIconSelect',
  valueOut () {
    return this.val()
  }
})
