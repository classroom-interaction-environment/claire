import { Dimension } from '../../../contexts/curriculum/curriculum/dimension/Dimension'
import { DimensionType } from '../../../contexts/curriculum/curriculum/types/DimensionType'
import { getCollection } from '../../../api/utils/getCollection'
import '../dimension/dimension'
import './objective.scss'
import './objective.html'

Template.objective.setDependencies({
    contexts: [Dimension]
})

Template.objective.helpers({
  dimensionDoc (dimensionId) {
    const dimensionDoc = getCollection(Dimension.name).findOne(dimensionId)
    dimensionDoc.type = DimensionType.resolve(dimensionDoc.type)
    return dimensionDoc
  }
})
