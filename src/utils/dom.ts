class Dom {
  el!: HTMLElement

  constructor(el: string | HTMLElement) {
    if (typeof el === 'string') {
      const target = document.querySelector(el) as HTMLElement
      if (target) {
        this.el = target
      } else {
        throw new Error(`can not find target node ${el}.`)
      }
    } else {
      this.el = el
    }
  }

  css(first: Partial<CSSStyleDeclaration>): Dom
  css<T extends keyof CSSStyleDeclaration>(first: T, second: CSSStyleDeclaration[T] | undefined): Dom
  css<T extends keyof CSSStyleDeclaration>(first: CSSStyleDeclaration | T, second?: CSSStyleDeclaration[T] | undefined): Dom {
    if (typeof first === 'object') {
      for (const attr in first) {
        this.el.style[attr] = first[attr]
      }
    } else {
      // @ts-expect-error fuck you!
      this.el.style[first] = second
    }
    return this
  }
}

const d = (el: string | HTMLElement) => new Dom(el)

export default d