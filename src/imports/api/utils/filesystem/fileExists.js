let fs

/**
 * Full async version using fs.stat
 * @param path
 * @return {Promise<unknown>}
 */
export const fileExists = function exists (path) {
  return new Promise((resolve, reject) => {
    if (!fs) fs = require('fs')
    fs.stat(path, (err, stats) => {
      if (err) {
        reject(err)
      }
      else if (!stats) {
        reject(new Error())
      }
      else {
        resolve(stats)
      }
    })
  })
}
