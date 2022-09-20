import { i18n } from '../../../api/language/language'

/**
 * Use each file context as reference for file types and their implementations
 * @deprecated
 */
export const FileTypes = {
  archive: {
    value: 'archive',
    label: i18n.reactive('fileTypes.archive'),
    extensions: ['zip', 'rar']
  },
  audio: {
    value: 'audio',
    label: i18n.reactive('fileTypes.audio'),
    extensions: ['mp3', 'ogg', 'wav', 'wma', 'aac', 'flac', 'asf', 'wmf', 'm4a', 'mp4'],
    accept: 'audio/*, .mp3, .ogg, .wav, .wma, .aac, .flac, .asf, .wmf, .m4a, .mp4'
  },
  binary: {
    value: 'binary',
    label: i18n.reactive('fileTypes.binary'),
    extensions: ['exe', 'dmg', 'deb', 'msi']
  },
  image: {
    value: 'image',
    label: i18n.reactive('fileTypes.image'),
    extensions: ['jpg', 'jpeg', 'png', 'bmp', 'gif'],
    accept: '.jpg,.jpeg,.png,.bmp,.gif'
  },
  video: {
    value: 'video',
    label: i18n.reactive('fileTypes.video'),
    extensions: ['3gp', '3gp2', 'mkv', 'mpeg', 'avi', 'mp4', 'ogg', 'webm', 'mov'],
    accept: '.3gp,.3gp2,.mkv,.mpeg,.avi,.mp4,.ogg,.webm,.mov'
  },
  presentation: {
    value: 'presentation',
    label: i18n.reactive('fileTypes.presentation'),
    extensions: ['ppt', 'pptx', 'odp']
  },
  document: {
    value: 'document',
    label: i18n.reactive('fileTypes.document'),
    extensions: ['odf', 'doc', 'docx', 'rtf', 'pdf', 'txt', 'xls', 'xlsx', 'ods', 'ppt', 'pptx', 'odp'],
    accept: '.docx,.odf,.pdf,.xlsx,.pptx,.ods,.odp'
  },
  spreadsheet: {
    value: 'spreadsheet',
    label: i18n.reactive('fileTypes.spreadsheet'),
    engins: ['xls', 'xlsx', 'ods']
  }
}
