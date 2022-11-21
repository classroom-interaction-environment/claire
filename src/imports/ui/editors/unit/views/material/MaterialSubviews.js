import { Tracker } from 'meteor/tracker'
import { Schema } from '../../../../../api/schema/Schema'
import { Curriculum } from '../../../../../contexts/curriculum/Curriculum'
import { Task } from '../../../../../contexts/curriculum/curriculum/task/Task'
import { Material } from '../../../../../contexts/material/Material'
import { getMaterialRenderer } from '../../../../../api/material/getMaterialRenderer'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { unitEditorMaterialNames } from '../../utils/unitEditorMaterialNames'
import { isMetaMaterial } from '../../utils/isMetaMaterial'

const defaultSchema = Curriculum.getDefaultSchema()
const materialSchema = schema => Object.assign({}, defaultSchema, schema)

/**
 * Use to create subview definitions of the material view.
 * We need to use this (instead of a fixed definitions object),
 * because we can dynamically define material via plugins and therefore
 * need to dynamically generate subviews here.
 */

export const MaterialSubviews = {}

/**
 * Returns the default name of the subview to load of no subview is defined to
 * load.
 * @return {string} name of the subview
 */
MaterialSubviews.defaultViewName = () => Task.name

/**
 * Returns a list of names for all available materials.
 * @return {{name, label}[]}
 */
MaterialSubviews.names = () => {
  return unitEditorMaterialNames()
}

/**
 *
 * @param name
 * @return {*}
 */
MaterialSubviews.getContext = name => {
  return Material.get(name)
}

/**
 * Determines, whether a subview can exist for this material, without creating
 * or loading anything.
 * @param name {String} name of the material context
 * @return {boolean} true if exists, otherwise false
 */

MaterialSubviews.exists = name => {
  const material = Material.get(name)
  return material && !isMetaMaterial(material)
}

/**
 * Creates a new subview for a given Material context. That subview is used
 * to generate the material sub page including all functionality to
 * - preview
 * - create
 * - update
 * - remove
 *
 * material from a parent document (usually the unit but this is up to the impl)
 *
 * @param name {String} name of the desired material context
 * @param templateInstance {String} the parent template instance
 * @return {{
 *   context: *,
 *   collection,
 *   previewRenderer: Renderer,
 *   listRenderer: Renderer,
 *   info: (*|{}),
 *   editable: boolean,
 *   field: String,
 *   subscription: string,
 *   schema: SimpleSchema,
 *   hooks: {
 *     beforeInsert: function,
 *     onCreated: function
 *   },
 *   loaded: boolean,
 *   load: async function
 * }}
 */
MaterialSubviews.create = ({ name }) => {
  const context = Material.get(name)
  const material = context?.material

  if (!material) {
    throw new Error(`Could not get material for context by name [${name}]`)
  }

  // we need the list and main/preview renderer for each material type
  const previewRenderer = getMaterialRenderer(material, 'preview')
  const listRenderer = getMaterialRenderer(material, 'list')

  // connect all functionality that is necessary to create forms
  // and load documents from the collections
  const loadMaterialFn = material.load || (doc => doc)
  const collection = getLocalCollection(context.name)
  const subViewSchema = material.noDefaultSchema
    ? material.schema
    : materialSchema(material.schema)

  return {
    context: context,
    collection: collection,
    previewRenderer: previewRenderer,
    listRenderer: listRenderer,
    info: material.info || {},
    editable: material.editable || false,
    preview: material.preview,
    field: context.fieldName,
    subscription: context.publications.editor.name,
    schema: Schema.create(subViewSchema, { tracker: Tracker }),
    hooks: {
      beforeInsert: material.beforeInsert || (x => x),
      onCreated: material.onCreated || noOp,
      formOpen: material.formOpen || noOp,
      formClosed: material.formClosed || noOp
    },
    loaded: false,
    load: async function () {
      await loadMaterialFn()
      await previewRenderer.load()
      await listRenderer.load()
    }
  }
}

const noOp = () => {}
