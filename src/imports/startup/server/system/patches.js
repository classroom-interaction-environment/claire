/**
 * Patches run through the pipeline before anything else in order to assure
 * integrity of the environment.
 */
import './patches/renameImageFiles'
import './patches/renameAdminsCollection'
import './patches/migrateRoles'
import './patches/removeMaterialReferences'
