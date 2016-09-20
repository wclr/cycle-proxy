import * as test from 'tape'
import * as most from 'most'
import proxy from '../most'
import { circulate } from '../circulate/most'

const emptyListener = { next: () => { }, complete: () => { }, error: () => { } }

test('most: target$ should not start when proxy$ attached', (t) => {
  let target$ = most.from([1, 2, 3, 5, 6])
    .map((x) => {
      t.fail()
      return x
    })
  let proxy$ = proxy()
  proxy$.proxy(target$)
  setTimeout(() => t.end())
})

test('most: target$ should not start if proxy$ subscribed', (t) => {
  let target$ = most.from([1, 2, 3, 5, 6])
    .map((x) => {
      t.fail()
      return x
    })
  let proxy$ = proxy()
  proxy$.proxy(target$)

  proxy$.subscribe(emptyListener)
  setTimeout(() => t.end())
})


test('most: proxy$ should not emit if target$ subscribed', (t) => {
  let target$ = most.from([1, 2, 3, 5, 6])
  let proxy$ = proxy()
  proxy$.map(() => t.fail()).subscribe(emptyListener)
  proxy$.proxy(target$)
  target$.subscribe(emptyListener)
  setTimeout(() => t.end())
})

test('most: proxy$ should not emit if target$ subscribed and proxy$ subscribed', (t) => {
  let target$ = most.from([1, 2, 3, 5, 6])
  let proxy$ = proxy()

  proxy$.proxy(target$)

  proxy$.map(() => t.fail()).subscribe(emptyListener)

  target$.subscribe(emptyListener)

  setTimeout(() => t.end())
})

test('most: proxy$ should emit if proxied$ subscribed', (t) => {
  let target$ = most.from([1, 2, 3, 5, 6])
  let proxy$ = proxy()

  let proxied$ = proxy$.proxy(target$)
  let emitted = 0
  proxy$.map(() => emitted++).subscribe(emptyListener)

  proxied$.subscribe(emptyListener)

  setTimeout(() => {
    t.equal(emitted, 5)
    t.end()
  })
})

test('most: proxy$ should stop emitting when proxied$ unsubscribed', (t) => {
  let target$ = most.periodic(1)
  let proxy$ = proxy()

  let proxied$ = proxy$.proxy(target$)
  let emitted = 0
  proxy$.subscribe({
    next: () => {
      emitted++
    },
    error: () => { },
    complete: () => { }
  })

  let listener = {
    next: () => {
      if (emitted === 2) {
        sub.unsubscribe()
      }
    },
    error: () => { },
    complete: () => { }
  }
  let sub = proxied$.subscribe(listener)

  // target may still be subscribed
  target$.subscribe(emptyListener)

  setTimeout(() => {
    //t.equal(emitted, 2)
    t.ok(emitted === 2 || emitted === 3)
    t.end()
  }, 50)
})

test('most: circulate (factory)', (t) => {
  let circ = circulate<number>('target$')
    ((target$) => {
      return {
        target$: target$.map(x => x * 2)
          .startWith(1)
          .delay(1)
      }
    })
  let results: number[] = []
  let sub = circ.target$.subscribe({
    next: (x) => {
      results.push(x)
      if (results.length === 4) {
        sub.unsubscribe()
        t.deepEqual(results, [1, 2, 4, 8], 'results ok')
        t.end()
      }
    },
    error: () => { },
    complete: () => { }
  })
})