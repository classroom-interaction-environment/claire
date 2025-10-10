import { Beamer } from '../../../contexts/beamer/Beamer'
import { SchoolClass } from '../../../contexts/classroom/schoolclass/SchoolClass'
import { Lesson } from '../../../contexts/classroom/lessons/Lesson'
import { TaskResults } from '../../../contexts/tasks/results/TaskResults'
import { TaskWorkingState } from '../../../contexts/tasks/state/TaskWorkingState'
import { CodeInvitation } from '../../../contexts/classroom/invitations/CodeInvitations'
import { Classroom } from '../../../contexts/classroom/Classroom'
import { ContextBuilder } from '../../../infrastructure/datastructures/ContextBuilder'
import { classroomPipeline } from '../../../contexts/classroom/classroomPipeline'
import { H5PMeteor, config } from 'meteor/claire:h5p'
import { Group } from '../../../contexts/classroom/group/Group'

console.debug(H5PMeteor)
H5PMeteor.name = 'h5p'
H5PMeteor.isSystem = true
H5PMeteor.isClassroom =true
config({
  core: {
    fetchingDisabled: 0,
    uuid: "8de62c47-f335-42f6-909d-2d8f4b7fb7f5",
    siteType: "local",
    sendUsageStatistics: false,
    hubRegistrationEndpoint: "https://api.h5p.org/v1/sites",
    hubContentTypesEndpoint: "https://api.h5p.org/v1/content-types/",
    contentTypeCacheRefreshInterval: 86400000,
    contentUserDataUrl: "/contentUserData",
    contentUserStateSaveInterval: 5000,
    enableLrsContentTypes: true,
    setFinishedEnabled: true,
    editorAddons: {
      "H5P.CoursePresentation": ["H5P.MathDisplay"],
      "H5P.InteractiveVideo": ["H5P.MathDisplay"],
      "H5P.DragQuestion": ["H5P.MathDisplay"]
    },
    theme: {
      backgroundColor: "#222b37",
      secondaryBackgroundColor: "#333d49",
      fontColor: "#ffffff",
      disabledFontColor: "#a0a0a1",
      primaryColor: "#7636dc",
      primaryContrastColor: "#ffffff",
      secondaryColor: "#3d66ff",
      secondaryContrastColor: "#ffffff",
      dividerColor: "#45505d",
      warningColor: "#e67e22",
      warningContrastColor: "#000000",
      successColor: "#27ae60",
      successContrastColor: "#FFFFFF",
      errorColor: "#c0392b",
      errorContrastColor: "#FFFFFF",
      fontFamily: "'Courier'",
      buttonBorderRadius: "0.5em"
    }
  },
  defaultUserPrivileges: {
    canInstallRecommended: false,
    canUpdateAndInstallLibraries: false,
    canCreateRestricted: false
  },
  maintenance: {
    cleanTempFiles: 300000,
    updateContentCache: 720000
  }
})

Classroom.info('register default classroom')

ContextBuilder.addRegistry(Classroom, {
  pipelines: [classroomPipeline]
})

;[
  Beamer,
  SchoolClass,
  Lesson,
  TaskResults,
  TaskWorkingState,
  CodeInvitation,
  Group,
  H5PMeteor
].forEach(context => {
  Classroom.add(context)
  ContextBuilder.addContext(context)
})
