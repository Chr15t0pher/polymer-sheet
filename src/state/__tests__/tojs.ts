import chai, { expect } from 'chai'
import sinonChai from 'sinon-chai'

chai.use(sinonChai)

import * as s from '../index'

describe('api tojs(thing)', () => {
  it ('box', () => {
    const box1 = s.observable.box(1)
    expect(s.tojs(box1)).to.equal(1)

    const box2 = s.observable.box(true)
    expect(s.tojs(box2)).to.equal(true)

    const box3 = s.observable.box(null)
    expect(s.tojs(box3)).to.equal(null)

    const box4 = s.observable.box(undefined)
    expect(s.tojs(box4)).to.equal(undefined)

    const box5 = s.observable.box(Symbol.for('1'))
    expect(s.tojs(box5)).to.equal(Symbol.for('1'))

    const box6 = s.observable.box('1')
    expect(s.tojs(box6)).to.equal('1')

    const box7 = s.observable.box(BigInt(Number.MAX_SAFE_INTEGER))
    expect(s.tojs(box7)).to.equal(BigInt(Number.MAX_SAFE_INTEGER))

    const box8 = s.observable.box({ a: 1 })
    expect(s.tojs(box8)).to.eql({ a: 1 })
  })

  it ('map', () => {
    const arr = [
      ['a', 1],
      ['b', new Set([1, 2])],
      ['c', new Map([[1, 2]])],
      ['d', { 'dd': 'dd' }]
    ] as const
    const map = s.observable.map(new Map(arr as any))
    expect(s.tojs(map)).to.eql(new Map(arr as any))
  })

  it ('array', () => {
    const arr = [
      ['a', 1],
      ['b', new Set([1, 2])],
      ['c', new Map([[1, 2]])],
      ['d', { 'dd': 'dd' }]
    ]
    const obArr = s.observable.array(arr)
    expect(s.tojs(obArr)).to.eql(arr)
  })

  it ('set', () => {
    const arr = [
      1,
      2,
      {'a': 'b'},
      new Map([['a', 1]]),
      new Set([1, 2, 3]),
      ['a', 1],
      ['b', new Set([1, 2])],
      ['c', new Map([[1, 2]])],
      ['d', { 'dd': 'dd' }]
    ]
    const set = s.observable.set(new Set(arr))
    expect(s.tojs(set)).to.eql(new Set(arr))
  })

  it ('object', () => {
    const object = { a: 1, b: new Set([1, 2, new Map([['a', 1]])]), c: { cc: [1, 2] }}
    const obObj = s.observable.object(object)
    expect(s.tojs(obObj)).to.eql(object)
  })

  it ('computed', () => {
    const object = { a: 1, b: new Set([1, 2, new Map([['a', 1]])]), c: { cc: [1, 2] }}
    const obObj = s.observable.object(object)
    const obComputed = s.computed(() => obObj)
    expect(s.tojs(obComputed.get())).to.eql(object)
  })
})
