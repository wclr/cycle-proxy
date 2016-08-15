import test from 'tape'
import rxProxy from '../rx'
import rxjsProxy from '../rxjs'
import xsProxy from '../xstream'
import mostProxy from '../most'
import Rx from 'rx'
import Rxjs from 'rxjs'
import most from 'most'
import {sample} from '@most/sample'
import xs from 'xstream'
import R from 'ramda'
import xsDelay from 'xstream/extra/delay'

const timeScale = 1
const processInterval = 40*timeScale
const emitInterval = 10*timeScale
const correctProcessed = [ 1, 2, 3, 5 ]

const testProcessed = (t, dispose, processed, processedEmitted) => {
  if (processed.length < correctProcessed.length){
    return
  }
  dispose()
  if (R.equals(processed, correctProcessed)){
    t.pass('processed is correct')
  } else {
    console.log('processed', processed)
    t.fail('processed is correct')
  }
  setTimeout(() => {
    if (processedEmitted.length <= processed.length + 1){
      t.pass('no leak detected')
    } else {
      console.log('processedEmitted', processedEmitted)
      t.fail('no leak detected')
    }
    t.end()
  }, processInterval*2)
}
const items = [1, 2, 3, 2, 5, 6, 7, 8, 9, 10]


const toggleInQueue = (queue, item) => {
  var index = queue.indexOf(item)
  return ((index < 0) ? R.append(item) : R.remove(index, 1))(queue)
}

let mapLog = (message) => (x) => !console.log(message, x) && x

const makeRxTest = (name, Rx, proxy) => {
  let O = Rx.Observable
  let processed = []
  let processedEmitted = []
  test(`cyclic proxy (${name})`, (t) => {
    let item$ = O.interval(emitInterval)
      .map(i => items[i] || -1)

    let queueMimic$ = proxy()

    let passed$ = item$.withLatestFrom(queueMimic$.startWith([]), (item, queue) => {
      return (queue.indexOf(item) < 0) ? item : null
    }).filter(_ => _)

    //let catchPossibleLeak = (x) => processedEmitted.push(x)
    let catchPossibleLeak = (x) => processedEmitted.push(x)

    let processed$ = passed$
      .delay(processInterval)
      .do(catchPossibleLeak)
      //.do(mapLog('processed'))
      .share()

    let queue$ = O.merge(passed$, processed$).scan(toggleInQueue, [])
      .share()
      .let(queueMimic$.proxy)

    let sub = O.merge(processed$, queue$.skip())
      .subscribe(x => {
        processed.push(x)
        let dispose = (sub.dispose || sub.unsubscribe).bind(sub)
        testProcessed(t, dispose, processed, processedEmitted)
      }
    )
  })
}

makeRxTest('rx', Rx, rxProxy)
makeRxTest('rxjs', Rxjs, rxjsProxy)

test('xstream - imitate', (t) => {
  let processed = []
  let processedEmitted = []

  let item$ = xs.periodic(emitInterval)
    .map(i => items[i] || -1)

  let toggleMimic$ = xs.create()

  const passQueue = (item, queue) => {
    return (queue.indexOf(item) < 0) ? item : null
  }

  let queue$ = toggleMimic$
    .fold(toggleInQueue, [])

  let passed$ = item$.compose(
    withLatestFrom(queue$, passQueue)
  ).filter(_ => _)

  let catchPossibleLeak = (x) => processedEmitted.push(x) && x

  let processed$ = passed$
    .compose(xsDelay(processInterval))
    .map(catchPossibleLeak)

  let toggle$ = xs.merge(passed$, processed$)

  toggleMimic$.imitate(toggle$)

  let listener = {
    next: (x) => {
      processed.push(x)
      let dispose = () => {
        processed$.removeListener(listener)
      }
      testProcessed(t, dispose, processed, processedEmitted)
    },
    error: () => {},
    complete: () => {}
  }

  processed$.addListener(listener)
})

let withLatestFrom = (from$, mapFn = (s,f) => [s, f]) =>
  (stream$) => from$.map(f =>
    stream$.map(s => mapFn(s, f))
  ).flatten()

test('xstream - proxy', (t) => {
  let processed = []
  let processedEmitted = []

  let item$ = xs.periodic(emitInterval).map(i => items[i] || -1)

  let queueMimic$ = xsProxy()

  const passQueue = (item, queue) => {
    return (queue.indexOf(item) < 0) ? item : null
  }

  let passed$ = item$.compose(
    withLatestFrom(queueMimic$.startWith([]), passQueue)
  ).filter(_ => _)

  let catchPossibleLeak = (x) => processedEmitted.push(x) && x

  let processed$ = passed$
    .compose(xsDelay(processInterval))
    .map(catchPossibleLeak)

  let queue$ = xs.merge(passed$, processed$)
    .fold(toggleInQueue, [])
    .compose(queueMimic$.proxy)

  let listener = {
    next: (x) => {
      processed.push(x)
      let dispose = () => {
        sink$.removeListener(listener)
      }
      testProcessed(t, dispose, processed, processedEmitted)
    },
    error: () => {},
    complete: () => {}
  }

  let sink$ = xs.merge(processed$, queue$.drop())
  sink$.addListener(listener)
})

test.skip('most - proxy', (t) => {
  let processed = []
  let processedEmitted = []

  let item$ = most.periodic(emitInterval)
    .scan(x => x + 1, -2)
    .map(i => items[i] || -1)
    .skip(2)

  let queueMimic$ = mostProxy()

  const passQueue = (item, queue) => {
    return (queue.indexOf(item) < 0) ? item : null
  }

  let passed$ = sample(passQueue,
    item$, queueMimic$.startWith([])
  ).filter(_ => _)

  //let catchPossibleLeak = (x) => processedEmitted.push(x) && x

  let catchPossibleLeak = (x) => {
    console.log('x', x)
    return processedEmitted.push(x) && x
  }

  let processed$ = passed$
    .delay(processInterval)
    .map(catchPossibleLeak)
    .multicast()

  let queue$ = most.merge(passed$, processed$)
    .scan(toggleInQueue, []).multicast()
    .thru(queueMimic$.proxy)

  let listener = {
    next: (x) => {
      processed.push(x)
      testProcessed(t, dispose, processed, processedEmitted)
    },
    error: () => {},
    complete: () => {}
  }

  let sink$ = most.merge(processed$, queue$.chain(() => most.empty()))
  let subscription = sink$.subscribe(listener)
  let dispose = () => {
    subscription.unsubscribe()
  }
})
