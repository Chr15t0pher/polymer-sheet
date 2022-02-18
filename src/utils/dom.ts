export class Dom<T extends HTMLElement = HTMLElement> {
  private el!: T

  constructor(el: string | T) {
    if (typeof el === 'string') {
      const target = document.querySelector(el) as T
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
      // @ts-expect-error
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

  private addHTML(html: string, cb: (fragment: DocumentFragment) => void) {
    const divTemp = document.createElement('div')
    let nodes = null
    // use fragment cache to avoid multiple rerender
    let fragment = document.createDocumentFragment()
    divTemp.innerHTML = html
    nodes = divTemp.childNodes
    nodes.forEach(item => {
      fragment.appendChild(item.cloneNode(true))
    })

    cb(fragment)

    // clear dom reference to avoid memory leak
    nodes = null
    // @ts-ignore
    fragment = null
  }

  append(html: string | HTMLElement) {
    if (typeof html === 'string') {
      this.addHTML(html, this.el.appendChild.bind(this.el))
    } else {
      this.el.appendChild(html)
    }
  }

  prepend(html: string | HTMLElement) {
    if (typeof html === 'string') {
      this.addHTML(html, this.el.prepend.bind(this.el))
    } else {
      this.el.prepend(html)
    }
  }

  isShow() {
    return this.getStyleValue('display') !== 'none'
  }

  elem() {
    return this.el
  }

  find(selector: string) {
    const el = this.el.querySelector(selector) as HTMLElement
    return new Dom(el)
  }

  findAll(selector: string) {
    const els = this.el.querySelectorAll(selector)
    return Array.from(els).map(el => new Dom(el as HTMLElement))
  }

  private getStyleValue<T extends keyof CSSStyleDeclaration>(attr: T) {
    return getComputedStyle(this.el)[attr]
  }
}

export const d = (el: string | HTMLElement) => new Dom(el)
