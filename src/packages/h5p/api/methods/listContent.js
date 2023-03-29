import H5PUser from '../implementations/H5PUser'
import { H5PFactory } from '../H5PFactory'

/**
 * Lists the H5P content in the system. Call from a custom UI component. In
 * a real-life scenario you probably don't want to list H5P content but your
 * own content objects. This method is here for the demo only.
 * @returns
 */
export const listContent = async function () {
  // TODO Check the user's permission here

  const contentIds = await H5PFactory.editor().contentManager.listContent()
  const contentObjects = await Promise.all(
    contentIds.map(async (id) => ({
      content: await H5PFactory.editor().contentManager.getContentMetadata(
        id,
        new H5PUser(this.user) // get the real user from Mongo and inject it here
      ),
      id
    }))
  )

  return contentObjects.map((o) => ({
    contentId: o.id,
    title: o.content.title,
    mainLibrary: o.content.mainLibrary
  }))
}
