import { i18n } from '../../../../api/language/language'

export const ContentTypes = {
  webpage: {
    icon: 'external-link-alt',
    value: 'webpage',
    label: i18n.reactive('webResources.webpage'),
    endings: []
  },
  image: {
    icon: 'image',
    value: 'image',
    label: i18n.reactive('webResources.image'),
    endings: ['png', 'gif', 'jpg', 'jpeg', 'svg']
  },
  audio: {
    icon: 'volume-up',
    value: 'audio',
    label: i18n.reactive('webResources.audio'),
    endings: ['wav', 'ogg', 'mp3', 'webm']
  },
  video: {
    value: 'video',
    icon: 'video-camera',
    label: i18n.reactive('webResources.video'),
    endings: ['mp4', 'ogg', 'webm']
  },
  document: {
    value: 'document',
    icon: 'file-alt',
    label: i18n.reactive('webResources.document'),
    endings: ['doc', 'docx', 'odt', 'pdf', 'rtf', 'xls', 'xlsx', 'ods', 'odp', 'ppt', 'pptx']
  },
  binary: {
    value: 'binary',
    icon: 'archive',
    label: i18n.reactive('webResources.binary'),
    endings: ['zip', 'rar', '7z']
  }
}
