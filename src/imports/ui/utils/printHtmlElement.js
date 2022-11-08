import printJS from 'print-js'

export const printHTMLElement = (target, onClose, onError) => {
  const cssUrls = []
  for (let i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].href) {
      cssUrls.push(document.styleSheets[i].href)
    }
  }

  console.info(target, cssUrls)
  printJS({
    printable: target,
    type: 'html',
    css: cssUrls, // ['/print.css?v1'],
    onPrintDialogClose: onClose,
    onError: onError,
    maxWidth: 2500,
  })
}
