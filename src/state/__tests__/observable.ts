import chai, { expect } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

chai.use(sinonChai)

import * as s from '../index'

describe('observable', () => {
  it('no arguments', () => {
    const box = s.observable.box()

    expect(s.isObservable(box)).to.equal(true)
    expect(box.get()).to.equal(undefined)
  })
  it ('basic', () => {
    const box = s.observable.box(1)
    const spy = sinon.spy()
    s.observe(box, spy)

    box.set(2)
    expect(box.get()).to.equal(2)
    expect(spy).to.have.been.calledOnce
  })
  it ('array', () => {
    const arr = s.observable.array([])
    const spy = sinon.spy()
    let res
    s.observe(arr, spy)

    res = arr.splice(1, 1, 1)
    expect(arr).to.eql([1])
    expect(res).to.eql([])
    expect(spy).to.have.been.calledOnce

    res = arr.push(2)
    expect(arr).to.eql([1, 2])
    expect(res).to.equal(2)

    res = arr.pop()
    expect(arr).to.eql([1])
    expect(res).to.equal(2)

    res = arr.shift()
    expect(arr).to.eql([])
    expect(res).to.equal(1)

    res = arr.unshift(1)
    expect(arr).to.eql([1])
    expect(res).to.equal(1)

    arr.push(2, 3)
    res = arr.reverse()
    expect(res).to.eql([3, 2, 1])

    res = arr.sort()
    expect(res).to.eql([1, 2, 3])
  })
  it('object', () => {
    const obj = s.observable.object({})
    let entries: any[] = []
    s.autorun(() => {
      entries = Object.keys(obj).map((prop) => ({
        [prop]: obj[prop]
      }))
    })

    obj.a = 'a'
    expect(entries).to.eql([{a: 'a'}])

    obj.a = 'b'
    expect(entries).to.eql([{a: 'b'}])

    obj.a = { 'a.a': 'a.a' }
    expect(entries).to.eql([{a: {'a.a': 'a.a'}}])

    obj.a['a.a'] = 'a.a.1'
    expect(entries).to.eql([{a: {'a.a': 'a.a.1'}}])
  })
  it ('set', () => {
    const set = s.observable.set(new Set())
    let values: number[] = []
    let size = 0
    s.autorun(() => {
      values = Array.from(set.values())
      size = set.size
    })

    set.add(1)
    set.add(2)
    expect(values).to.eql([1, 2])
    expect(size).to.equal(2)

    set.delete(1)
    expect(values).to.eql([2])
    expect(size).to.equal(1)

    expect(set.has(2)).to.equal(true)
    expect(Array.from(set.values())).to.eql([2])

    set.clear()
    expect(values).to.eql([])
    expect(size).to.equal(0)
  })
  it ('map', () => {
    const map = s.observable.map(new Map())
    let entries: any[] = []
    let size = 0
    s.autorun(() => {
      entries = Array.from(map.entries())
      size = map.size
    })

    map.set('1', 1)
    expect(size).to.equal(1)
    expect(map.get('1')).to.equal(1)
    expect(map.has('1')).to.be.true
    expect(Array.from(map.keys())).to.eql(['1'])
    expect(Array.from(map.values())).to.eql([1])

    map.set('1', 2)
    expect(entries).to.eql([['1', 2]])

    map.delete('1')
    expect(entries).to.eql([])
  })
  it ('computed', () => {
    const box = s.observable.box(1)
    const computed = s.computed(() => box.get()! * 2)
    let value

    s.autorun(() => { value = computed.get() })

    box.set(2)
    expect(value).to.equal(4)

    const array = s.observable.array([1, 2, 3])
    const computedArrLen = s.computed(() => array.length)
    let arrLen = 0

    s.autorun(() => { arrLen = computedArrLen.get() })

    array.push(4, 5)
    expect(arrLen).to.equal(5)

    // set
    const set = s.observable.set(new Set([1, 2, 3]))
    const setComputedValues = s.computed(() => Array.from(set.values()))
    let setValues: number[] = []

    s.autorun(() => { setValues = setComputedValues.get() })

    set.add(4)
    expect(setValues).to.eql([1, 2, 3, 4])

    // map
    const map = s.observable.map(new Map([['a', 1], ['b', 2], ['c', 3]]))
    const mapComputeValues = s.computed(() => Array.from(map.entries()))
    let mapEntries: Record<string, number>[] = []

    s.autorun(() => { mapEntries = mapComputeValues.get() })
    map.set('d', 4)
    expect(mapEntries).to.eql([['a', 1], ['b', 2], ['c', 3], ['d', 4]])

    // circle detect
    const box1 = s.observable.box(1)
    const computed1 = s.computed(() => box1.get()! * computed1.get())
    expect(computed1.get).to.throw()
  })
})
