import { Template } from 'meteor/templating'
import { ProfileImages } from '../../../contexts/files/image/ProfileImages'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import { getFilesLink } from '../../../contexts/files/getFilesLink'
import '../../components/image/image/image'
import './profileImage.html'

const resolveLink = imageId => {
  if (!imageId) {
    return
  }

  // we use the local collection to get the image because
  // we load the profile image into this collection via
  // methods (we avoid publications!)
  const image = getLocalCollection(ProfileImages.name).findOne(imageId)

  if (!image) {
    console.warn('no image found')
    return undefined
  }

  return getFilesLink({ file: image, name: ProfileImages.name, version: 'thumbnail' })
}

const getBorderClass = (border, presence) => {
  if (!border) return ''

  let presenceClass = ''

  if (presence === 'online') {
    presenceClass = 'border-success text-success'
  }

  if (presence === 'offline') {
    presenceClass = 'border-dark text-dark'
  }

  return `border-${border} ${presenceClass}`
}

Template.profileImage.setDependencies({
  contexts: [ProfileImages]
})

Template.profileImage.helpers({
  hasProfileImage () {
    const { user } = Template.instance().data
    return !!user?.profileImage
  },
  profileImageAtts () {
    const { data } = Template.instance()
    const { user, width, height, alt, round, border } = data
    const src = resolveLink(user?.profileImage)
    const customClass = data.class || ''
    const fullName = user && `${user.lastName}, ${user.firstName}`
    const presence = user?.presence?.status
    const roundClass = round ? 'rounded-circle' : ''
    const presenceClass = presence === 'offline' ? 'passive' : ''
    const borderClass = getBorderClass(border, presence)
    const className = `${roundClass} ${borderClass} ${presenceClass} ${customClass}`

    return {
      width: width,
      height: height,
      alt: alt,
      src: src,
      class: className,
      title: fullName
    }
  },
  placeholderAtts () {
    const { data } = Template.instance()
    const { user, width, height, round, border } = data
    const fullName = user && `${user.lastName}, ${user.firstName}`
    const presence = user?.presence?.status
    const customClass = data.class || ''
    const flexClass = data.flex === false ? '' : 'd-flex justify-content-center align-items-center'
    const roundClass = round ? 'rounded-circle' : ''
    const presenceClass = presence === 'offline' ? 'passive' : ''
    const borderClass = getBorderClass(border, presence)
    const className = `${flexClass} ${roundClass} ${borderClass} ${presenceClass} ${customClass}`

    return {
      class: className,
      title: fullName,
      style: `width: ${width}px; height: ${height}px;`
    }
  }
})
