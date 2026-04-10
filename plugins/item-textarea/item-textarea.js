import { ItemPlugins } from 'meteor/claire:plugin-registry'

ItemPlugins.register('itemTextArea', async () => {
  const { ItemTextArea } = await import('./lib/ItemTextArea')
  return ItemTextArea
})
