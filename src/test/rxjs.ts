import * as test from 'tape'
import { Observable as O } from 'rxjs'
import { proxy } from '../rxjs'
import { circulate } from '../circulate/rxjs'

test('rxjs: target$ should not start when proxy$ attached', (t) => {
  let target$ = O.from([1, 2, 3, 5, 6])
    .do(() => t.fail())
  let proxy$ = proxy()
  proxy$.proxy(target$)
  setTimeout(() => t.end())
})

test('rxjs: target$ should not start if proxy$ subscribed', (t) => {
  let target$ = O.from([1, 2, 3, 5, 6])
    .do(() => t.fail())
  let proxy$ = proxy()
  proxy$.proxy(target$)

  proxy$.subscribe()
  setTimeout(() => t.end())
})


test('rxjs: proxy$ should not emit if target$ subscribed', (t) => {
  let target$ = O.from([1, 2, 3, 5, 6])
  let proxy$ = proxy()
  proxy$.do(() => t.fail()).subscribe()
  proxy$.proxy(target$)
  target$.subscribe()
  setTimeout(() => t.end())
})

test('rxjs: proxy$ should not emit if target$ subscribed and proxy$ subscribed', (t) => {
  let target$ = O.from([1, 2, 3, 5, 6])
  let proxy$ = proxy()

  proxy$.proxy(target$)

  proxy$.subscribe(() => t.fail())

  target$.subscribe()

  setTimeout(() => t.end())
})

test('rxjs: proxy$ should emit if proxied$ subscribed', (t) => {
  let target$ = O.from([1, 2, 3, 5, 6])
  let proxy$ = proxy()

  let proxied$ = proxy$.proxy(target$)
  let emitted = 0
  proxy$.subscribe(() => emitted++)

  proxied$.subscribe()

  setTimeout(() => {
    t.equal(emitted, 5)
    t.end()
  })
})

test('rxjs: proxy$ should stop emitting when proxied$ unsubscribed', (t) => {
  let target$ = O.from([1, 2, 3, 5, 6]).delay(0).share()
  let proxy$ = proxy()

  let proxied$ = proxy$.proxy(target$)
  let emitted = 0
  proxy$.subscribe(() => {
    emitted++
  })

  let sub = proxied$.subscribe(() => {
    if (emitted === 2) sub.unsubscribe()
  })

  // target may still be subscribed
  target$.subscribe()

  setTimeout(() => {
    t.equal(emitted, 2)
    t.end()
  }, 10)
})

test('rxjs: circulate', (t) => {
  type Sources = { }
  type Circular = {circular$: O<number> }
  type Sinks = { target$: O<number> } & Circular  
  
  let emitted = 0
  const Dataflow = ({ circular$}: Sources & Circular): Sinks & Circular => {
    return {            
      circular$: circular$.map(x => x * 2)
        .startWith(1)
        .delay(10).do(() => emitted++),
      target$: circular$.map(x => x*10)
    }
  }
  
  let circ = circulate<Sources, Sinks>(Dataflow)
  let results: number[] = []
  let sub = circ({}).target$.subscribe((x) => {
    results.push(x)
    if (results.length === 4) {
      sub.unsubscribe()
      t.deepEqual(results, [10, 20, 40, 80], 'results ok')
      const emittedFinal = emitted
      setTimeout(() => {
        t.ok(emittedFinal === emitted, 'no leak')
        t.end()
      }, 100)
    }
  })
})
