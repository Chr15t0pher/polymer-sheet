import { getNextId, Reaction } from '../core'

export function autorun(outdated: (r: Reaction) => any) {
  const name = 'Autorun@' + getNextId()
  const reaction = new Reaction(name, () => {
    reaction.track(() => outdated(reaction))
  })
  reaction.schedule()
  return reaction.dispose
}
