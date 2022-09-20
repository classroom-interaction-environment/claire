AutoForm.addInputType('userGroupSelect', {
  template: 'afUserGroupSelect',
  valueOut () {
    try {
      const value = this.val() || '[]'
      return JSON.parse(value)
    } catch (e) {
      console.error(e)
      return []
    }
  }
})
