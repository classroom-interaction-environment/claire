import { ItemPlugins } from 'meteor/claire:plugin-registry'

ItemPlugins.register('itemRange', async () => {
  const { ItemRange } = await import('./lib/ItemRange')
  return ItemRange
})
