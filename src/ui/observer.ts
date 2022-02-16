import { Reaction } from '../state'

export function observer(renderableClass: any) {
  const baseRender = renderableClass.prototype.render
  renderableClass.prototype.render = function(this: any) {
    makeReactiveRenderer.call(this, baseRender)
  }

  return renderableClass
}

function makeReactiveRenderer(this: any, baseRender: () => void) {
  const reaction = new Reaction(`${getDisplayName(this)}.render`, () => {
    baseRender.call(this)
  })

  reaction.track(() => {
    baseRender.call(this)
  })
}

function getDisplayName(target: any) {
  return target.displayName || target.name || target.constructor&&(target.constructor.displayName || target.constructor.name)
}
