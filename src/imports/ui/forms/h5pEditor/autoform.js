AutoForm.addInputType('h5pEditor', {
  template: 'afH5PEditor',
  valueOut () {
    try {
      const value = this.val() || '[]'
      return JSON.parse(value)
    }
    catch (e) {
      console.error(e)
      return []
    }
  }
})
