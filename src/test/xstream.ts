import * as test from 'tape'
import xs from 'xstream'
import proxy from '../xstream'
import { circulate } from '../circulate/xstream'
import delay from 'xstream/extra/delay'

const emptyListener = { next: () => { }, complete: () => { }, error: () => { } }

test('xstream: target$ should not start when proxy$ attached', (t) => {
  let target$ = xs.fromArray([1, 2, 3, 5, 6])
    .map((x) => {
      t.fail()
      return x
    })
  let proxy$ = proxy()
  proxy$.proxy(target$)
  setTimeout(() => t.end())
})

test('xstream: target$ should not start if proxy$ subscribed', (t) => {
  let target$ = xs.fromArray([1, 2, 3, 5, 6])
    .map((x) => {
      t.fail()
      return x
    })
  let proxy$ = proxy()
  proxy$.proxy(target$)

  proxy$.addListener(emptyListener)
  setTimeout(() => t.end())
})


test('xstream: proxy$ should not emit if target$ subscribed', (t) => {
  let target$ = xs.fromArray([1, 2, 3, 5, 6])
  let proxy$ = proxy()
  proxy$.map(() => t.fail()).addListener(emptyListener)
  proxy$.proxy(target$)
  target$.addListener(emptyListener)
  setTimeout(() => t.end())
})

test('xstream: proxy$ should not emit if target$ subscribed and proxy$ subscribed', (t) => {
  let target$ = xs.fromArray([1, 2, 3, 5, 6])
  let proxy$ = proxy()

  proxy$.proxy(target$)

  proxy$.map(() => t.fail()).addListener(emptyListener)

  target$.addListener(emptyListener)

  setTimeout(() => t.end())
})

test('xstream: proxy$ should emit if proxied$ subscribed', (t) => {
  let target$ = xs.fromArray([1, 2, 3, 5, 6])
  let proxy$ = proxy()

  let proxied$ = proxy$.proxy(target$)
  let emitted = 0
  proxy$.map(() => emitted++).addListener(emptyListener)

  proxied$.addListener(emptyListener)

  setTimeout(() => {
    t.equal(emitted, 5)
    t.end()
  })
})

test('xstream: proxy$ should stop emitting when proxied$ unsubscribed', (t) => {
  let target$ = xs.periodic(0)
  let proxy$ = proxy()

  let proxied$ = proxy$.proxy(target$)
  let emitted = 0
  proxy$.addListener({
    next: () => {
      emitted++
    },
    error: () => { },
    complete: () => { }
  })

  let listener = {
    next: () => {      
      if (emitted === 2) {        
        proxied$.removeListener(listener)
      }
    },
    error: () => { },
    complete: () => { }
  }
  proxied$.addListener(listener)

  // target may still be subscribed
  target$.addListener(emptyListener)

  setTimeout(() => {
    t.equal(emitted, 3)
    t.end()
  }, 50)
})

test('xstream: circulate (factory)', (t) => {
  let circ = circulate<number>('target$')
    ((target$) => {
      return {
        target$: target$.map(x => x * 2)
          .startWith(1)
          .compose(delay(1))
      }
    })
  let results: number[] = []
  let listener = {
    next: (x: number) => {
      results.push(x)
      if (results.length === 4) {
        circ.target$.removeListener(listener)
        t.deepEqual(results, [1, 2, 4, 8], 'results ok')
        t.end()
      }
    },
    error: () => { },
    complete: () => { }
  }
  circ.target$.addListener(listener)
})