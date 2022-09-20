/**
 * Assigns a minimal valid content structure to a given task page.
 * Mutates the task document!
 *
 * @param taskDoc {Object}
 * @param index {number}
 * @return {Object}
 */
export const ensureTaskPageContentIntegrity = (taskDoc, index) => {
  if (!taskDoc.header) taskDoc.header = {}
  if (!taskDoc.header.align) taskDoc.header.align = 'left'
  if (!taskDoc.header.content) taskDoc.header.content = []
  taskDoc.header.content = taskDoc.header.content.filter(outUndef)

  if (!taskDoc.footer) taskDoc.footer = {}
  if (!taskDoc.footer.align) taskDoc.footer.align = 'left'
  if (!taskDoc.footer.content) taskDoc.footer.content = []
  taskDoc.footer.content = taskDoc.footer.content.filter(outUndef)

  if (typeof index === 'number') {
    if (!taskDoc.pages[index]) taskDoc.pages[index] = {}
    if (!taskDoc.pages[index].content) taskDoc.pages[index].content = []
    taskDoc.pages[index].content = taskDoc.pages[index].content.filter(outUndef)
  }

  return taskDoc
}

const outUndef = el => el
