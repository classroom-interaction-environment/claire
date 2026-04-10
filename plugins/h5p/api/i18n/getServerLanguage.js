import clientDe from '@lumieducation/h5p-server/build/assets/translations/client/de.json'
import clientEn from '@lumieducation/h5p-server/build/assets/translations/client/en.json'
import copyrightSemanticsDe from '@lumieducation/h5p-server/build/assets/translations/copyright-semantics/de.json'
import copyrightSemanticsEn from '@lumieducation/h5p-server/build/assets/translations/copyright-semantics/en.json'
import hubDe from '@lumieducation/h5p-server/build/assets/translations/hub/de'
import hubEn from '@lumieducation/h5p-server/build/assets/translations/hub/.en'
import libraryMetadataDe from '@lumieducation/h5p-server/build/assets/translations/library-metadata/de'
import libraryMetadataEn from '@lumieducation/h5p-server/build/assets/translations/library-metadata/.en'
import metadataSemanticsDe from '@lumieducation/h5p-server/build/assets/translations/metadata-semantics/de.json'
import metadataSemanticsEn from '@lumieducation/h5p-server/build/assets/translations/metadata-semantics/en.json'
import serverDe from '@lumieducation/h5p-server/build/assets/translations/server/de.json'
import serverEn from '@lumieducation/h5p-server/build/assets/translations/server/en.json'
import storageFileImplementationsDe from '@lumieducation/h5p-server/build/assets/translations/storage-file-implementations/de.json'
import storageFileImplementationsEn from '@lumieducation/h5p-server/build/assets/translations/storage-file-implementations/en.json'
import { getNamespacedTranslationStrings } from './getNamespacedTranslationString'

const en = {
  ...getNamespacedTranslationStrings('client', clientEn),
  ...getNamespacedTranslationStrings(
    'copyright-semantics',
    copyrightSemanticsEn
  ),
  ...getNamespacedTranslationStrings(
    'metadata-semantics',
    metadataSemanticsEn
  ),
  ...getNamespacedTranslationStrings('server', serverEn),
  ...getNamespacedTranslationStrings(
    'storage-file-implementations',
    storageFileImplementationsEn
  ),
  ...getNamespacedTranslationStrings('hub', hubEn),
  ...getNamespacedTranslationStrings(
    'library-metadata',
    libraryMetadataEn
  ),
  ...serverEn // default namespace, so we also add these values without namespace prefix
}

const de = {
  ...getNamespacedTranslationStrings('client', clientDe),
  ...getNamespacedTranslationStrings(
    'copyright-semantics',
    copyrightSemanticsDe
  ),
  ...getNamespacedTranslationStrings(
    'metadata-semantics',
    metadataSemanticsDe
  ),
  ...getNamespacedTranslationStrings('server', serverDe),
  ...getNamespacedTranslationStrings(
    'storage-file-implementations',
    storageFileImplementationsDe
  ),
  ...getNamespacedTranslationStrings('hub', hubDe),
  ...getNamespacedTranslationStrings(
    'library-metadata',
    libraryMetadataDe
  ),
  ...serverDe // default namespace, so we also add these values without namespace prefix
}

export { en, de }
