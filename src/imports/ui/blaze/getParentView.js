/**
 * Traverses a view's parent tree until a Template is found
 * @param view {Blaze.View}
 * @param skipSame {boolean=false}
 * @return {Blaze.View|undefined}
 */
export const getParentView = ({ view, skipSame = false }) => {
  let currentView = view.parentView

  while (currentView && !currentView.name.includes('Template.')) {
    currentView = currentView.parentView
  }

  if (!currentView || !skipSame || currentView.name !== `Template.${view.name}`) {
    return currentView
  }

  // continue search view same view
  return getParentView({ view: currentView, skipSame })
}
