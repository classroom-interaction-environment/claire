export const filesPreviewRendererData = ({ materialDoc, document, options }) => {
  const { preview = true, print = false, student = true } = options
  return Object.assign({}, {
    title: document.name,
    meta: name,
    preview: preview,
    print: print,
    student: student,
  }, document)
}
