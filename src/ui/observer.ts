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
    // Need to reTrack, if Observable add new property, it will call `addObservableProperty` to add a new ObservableValue, then keysAtom calls `reportChanged`, new ObservableValue need to call `bindDependencies`
    // if do not reTrack, just rerender one time but without calling `bindDependencies`, if the added property changes, rerender will not be called,
    reaction.track(() => {
      baseRender.call(this)
    })
  })

  reaction.schedule()
}

function getDisplayName(target: any) {
  return target.displayName || target.name || target.constructor&&(target.constructor.displayName || target.constructor.name)
}
