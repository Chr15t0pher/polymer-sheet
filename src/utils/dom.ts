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

  height() {
    if (this.isShow()) {
      return parseFloat(this.getStyleValue('height'))
    } else {
      this.css({ display: 'block !important', visibility: 'hidden' })
      const elHeight = this.getStyleValue('height')
      this.css({ display: 'none', visibility: 'none' })
      return parseFloat(elHeight)
    }
  }

  width() {
    if (this.isShow()) {
      return parseFloat(this.getStyleValue('width'))
    } else {
      this.css({ display: 'block !important', visibility: 'hidden' })
      const elWidth = this.getStyleValue('width')
      this.css({ display: 'none', visibility: 'none' })
      return parseFloat(elWidth)
    }
  }

  append(fragment: string | HTMLElement) {
    if (typeof fragment === 'string') {
      this.el.innerHTML = fragment
    } else {
      this.el.append(fragment)
    }
  }

  isShow() {
    return this.getStyleValue('display') !== 'none'
  }

  private getStyleValue<T extends keyof CSSStyleDeclaration>(attr: T) {
    return getComputedStyle(this.el)[attr]
  }
}

const d = (el: string | HTMLElement) => new Dom(el)

export default d