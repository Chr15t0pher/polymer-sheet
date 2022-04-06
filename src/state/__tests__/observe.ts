import chai, { expect } from 'chai'
import sinonChai from 'sinon-chai'

chai.use(sinonChai)

import * as s from '../index'

describe('api observe(thing, propertyOrCb?, cb?)', () => {
  it ('observe box', () => {
    const box = s.observable.box(1)
    let prev
    let next
    s.observe(box, (e) => {
      prev = e.prev
      next = e.next
    })
    box.set(2)
    expect(prev).to.be.equal(1)
    expect(next).to.be.equal(2)
  })
  it ('observe array', () => {
    const arr = s.observable.array([1, 2])
    let prev: any = []
    let next: any = []
    s.observe(arr, (e) => {
      prev = e.prev
      next = e.next
    })
    arr.push(3)
    expect(prev).to.be.eql([1, 2])
    expect(next).to.be.eql([1, 2, 3])
  })
  it ('observe map', () => {
    const map = s.observable.map(new Map([['a', 1], ['b', 2]]))
    let prev
    let next
    s.observe(map, (e) => {
      prev = e.prev
      next = e.next
    })
    map.set('c', 3)
    expect(prev).to.be.equal(undefined)
    expect(next).to.be.equal(3)
    map.delete('c')
    expect(prev).to.be.equal(3)
    expect(next).to.be.equal(undefined)
    map.set('b', 1)
    expect(prev).to.be.equal(2)
    expect(next).to.be.equal(1)

    let prevA
    let nextA
    s.observe(map, 'a', (e) => {
      prevA = e.prev
      nextA = e.next
    })
    map.set('a', 2)
    expect(prevA).to.be.equal(1)
    expect(nextA).to.be.equal(2)
  })
  it ('observe set', () => {
    const set = s.observable.set(new Set([1, 2, 3]))
    let prev
    let next
    s.observe(set, (e) => {
      prev = e.prev
      next = e.next
    })
    set.add(4)
    expect(prev).to.be.equal(undefined)
    expect(next).to.be.equal(4)
    set.delete(4)
    expect(prev).to.be.equal(4)
    expect(next).to.be.equal(undefined)
  })
  it ('observe object', () => {
    const obj = s.observable.object({ a: { b: 2 }})
    let prev
    let next
    s.observe(obj, (e) => {
      prev = e.prev
      next = e.next
    })
    // add property
    obj['b'] = 3
    expect(prev).to.be.equal(undefined)
    expect(next).to.be.equal(3)
    // delete property
    Reflect.deleteProperty(obj, 'b')
    // modify property
    obj['a'] = 2
    expect(prev).to.be.eql({ b: 2 })
    expect(next).to.be.equal(2)

    const obj1 = s.observable.object({ a: 1 })
    let prevA
    let nextA
    s.observe(obj1, 'a', (e) => {
      prevA = e.prev
      nextA = e.next
    })
    obj1.a = 2
    expect(prevA).to.equal(1)
    expect(nextA).to.equal(2)
  })
  it ('observe computed', () => {
    const box = s.observable.box(1)
    const computed = s.computed(() => box.get()! * 2)
    let prev
    let next
    s.observe(computed, (e) => {
      prev = e.prev
      next = e.next
    })
    s.autorun(() => computed.get())
    box.set(2)
    expect(prev).to.be.equal(2)
    expect(next).to.be.equal(4)
  })
})
