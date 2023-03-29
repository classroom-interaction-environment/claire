import { onServer } from '../utils/onServer'
import {loadContentForEditing} from './methods/loadContentForEditing'

/**
 * This combines the API for H5P with the Meteor domain and provides
 * an isomorphic way to define AND access the H5P functionality.
 *
 * The `onServer` helper function ensures, that no server code leaks
 * into the client bundle.
 */
export const H5PMeteor = {
  baseRoute: '/h5p'
}

// ////////////////////////////////////////////////////////////////////////////
//
// Routes
//
// ////////////////////////////////////////////////////////////////////////////

H5PMeteor.routes = {}

// ----------------------------------------------------------------------------
// AJAX base route
// ----------------------------------------------------------------------------

H5PMeteor.routes.getAjax = {
  name: '/ajax',
  method: 'get',
  permissions: {
    canEditContent: true
  },
  run: onServer(function () {
    import { getAjax } from './routes/getAjax'
    return getAjax
  })
}

H5PMeteor.routes.postAjax = {
  name: '/ajax',
  method: 'post',
  permissions: {
    canCreateContent: true
  },
  middleware: onServer(function () {
    import multer from 'multer'
    const upload = multer({ dest: 'uploads/' })

    return upload.fields([
      { name: 'file', maxCount: 1 },
      { name: 'h5p', maxCount: 1 }
    ])
  }),
  run: onServer(function () {
    import { postAjax } from './routes/postAjax'
    return postAjax
  })
}

// ----------------------------------------------------------------------------
// Get File AS PARTIAL RESPONSE
// ----------------------------------------------------------------------------

H5PMeteor.routes.getContentFile = {
  name: '/content/:id/:file(*)',
  method: 'get',
  permissions: {
    canPlayContent: true
  },
  run: onServer(function () {
    import { getContentFile } from './routes/getContentFile'
    return getContentFile
  })
}

// ----------------------------------------------------------------------------
// Download content
// ----------------------------------------------------------------------------

/**
 * The download route can also be left out if no download of h5p packages is
 * desired.
 */
H5PMeteor.routes.downloadContent = {
  name: '/download/:contentId',
  method: 'get',
  permissions: {
    canPlayContent: true
  },
  run: onServer(function () {
    import { downloadContent } from './routes/downloadContent'
    return downloadContent
  })
}

// ----------------------------------------------------------------------------
// Get temp files
// ----------------------------------------------------------------------------
H5PMeteor.routes.getTempFiles = {
  name: '/temp-files/:file(*)',
  method: 'get',
  permissions: {
    canPlayContent: true
  },
  run: onServer(function () {
    import { getTempFiles } from './routes/getTempFiles'
    return getTempFiles
  })
}
// ----------------------------------------------------------------------------
// Get library file
// ----------------------------------------------------------------------------
H5PMeteor.routes.getLibraryFile = {
  name: '/libraries/:uberName/:file(*)',
  method: 'get',
  permissions: {
    canPlayContent: true
  },
  run: onServer(function () {
    import { getLibraryFile } from './routes/getLibraryFile'
    return getLibraryFile
  })
}

// ----------------------------------------------------------------------------
// Get theme
// ----------------------------------------------------------------------------
H5PMeteor.routes.getTheme = {
  name: '/theme.css',
  method: 'get',
  permissions: {
    canPlayContent: true
  },
  run: onServer(function () {
    import { getTheme } from './routes/getTheme'
    return getTheme
  })
}

// ----------------------------------------------------------------------------
// Get user content
// ----------------------------------------------------------------------------
H5PMeteor.routes.getUserContent = {
  name: '/contentUserData/:contentId/:dataType/:subContentId',
  method: 'get',
  run: onServer(function () {
    import { getUserContent } from './routes/getUserContent'
    return getUserContent
  })
}

// ----------------------------------------------------------------------------
// Post user content
// ----------------------------------------------------------------------------
H5PMeteor.routes.postUserContent = {
  name: '/contentUserData/:contentId/:dataType/:subContentId',
  method: 'post',
  run: onServer(function () {
    import { postUserContent } from './routes/postUserContent'
    return postUserContent
  })
}

// ----------------------------------------------------------------------------
// Post finished data
// ----------------------------------------------------------------------------
H5PMeteor.routes.postFinishedData = {
  name: '/finishedData',
  method: 'post',
  permissions: {
    canPlayContent: true
  },
  run: onServer(function () {
    import { postFinishedData } from './routes/postFinishedData'
    return postFinishedData
  })
}

// ////////////////////////////////////////////////////////////////////////////
//
// METHODS
//
// ////////////////////////////////////////////////////////////////////////////

H5PMeteor.methods = {}

H5PMeteor.methods.listItems = {
  name: 'h5p.listItems',
  permissions: {
    canEditContent: true
  },
  schema: {},
  run: onServer(function () {
    import { listItems } from './methods/listItems'
    return listItems
  })
}

// ----------------------------------------------------------------------------
// Load content for editing
// ----------------------------------------------------------------------------

H5PMeteor.methods.loadContentForEditing = {
  name: 'h5p.load_content_for_editing',
  permissions: {
    canEditContent: true
  },
  schema: {
    contentId: {
      type: String,
      optional: true
    },
    language: {
      type: String,
      optional: true
    }
  },
  run: onServer(function () {
    import { loadContentForEditing } from './methods/loadContentForEditing'
    return loadContentForEditing
  })
}

// ----------------------------------------------------------------------------
// Load content for playing
// ----------------------------------------------------------------------------

H5PMeteor.methods.loadContentForPlaying = {
  name: 'h5p.load_content_for_playing',
  schema: {
    contentId: String
  },
  permissions: {
    canPlayContent: true
  },
  run: onServer(function () {
    import { loadContentForPlaying } from './methods/loadContentForPlaying'
    return loadContentForPlaying
  })
}

// ----------------------------------------------------------------------------
// Save content
// ----------------------------------------------------------------------------

H5PMeteor.methods.saveContent = {
  name: 'h5p.save_content',
  schema: {
    params: {
      type: Object,
      blackbox: true // TODO validate inner structure
    },
    metadata: {
      type: Object,
      blackbox: true // TODO validate inner structure
    },
    library: {
      type: String
    },
    contentId: {
      type: String,
      optional: true
    }
  },
  permissions: {
    canCreateContent: true
  },
  run: onServer(function () {
    import { saveContent } from './methods/saveContent'
    return saveContent
  })
}

// ----------------------------------------------------------------------------
// Delete content
// ----------------------------------------------------------------------------

H5PMeteor.methods.deleteContent = {
  name: 'h5p.delete_content',
  schema: {
    contentId: String
  },
  permissions: {
    canDeleteContent: true
  },
  run: onServer(function () {
    import { deleteContent } from './methods/deleteContent'
    return deleteContent
  })
}

// ----------------------------------------------------------------------------
// List content
// ----------------------------------------------------------------------------

H5PMeteor.methods.listContent = {
  name: 'h5p.list_content',
  schema: {},
  permissions: {
    canPlayContent: true
  },
  run: onServer(function () {
    import { listContent } from './methods/listContent'
    return listContent
  })
}
