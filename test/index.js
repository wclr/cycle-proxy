import {equal} from 'assert'
import rxProxy from '../rx'
import rxjsProxy from '../rxjs'
import xsProxy from '../xstream'
import mostProxy from '../most'
import rxRun from '@cycle/rx-run'
import rxjsRun from '@cycle/rxjs-run'
import xsRun from '@cycle/xstream-run'
import mostRun from '@cycle/most-run'
import Rx from 'rx'
import Rxjs from 'rxjs'
import most from 'most'
import xs from 'xstream'

import test from 'tape'

const Double = (value$, events$) => {
  return {value$: value$.map(x => x*2).sample(events$)}
}

const makeRxTest = (name, Cycle, proxy, interval) => {
  const Double = (value$, events$) => {
    return {value$: value$.map(x => x*2).zip(events$, _ => _)}
  }
  test(`cyclic proxy (${name})`, (t) => {
    let countEmitted = 0
    let countListened = 0
    let lastVal
    let tick = 50

    const Main = ({events$}) => {
      const value$ = proxy(_ => _
        .startWith(1)
        .do(() => countEmitted++)
      )
      const double = Double(value$, events$)
      value$.proxy(double.value$)
      return {
        value$: value$
      }
    }

    const {run} = Cycle(Main, {
      events$: () => {
        let disposed = false
        const events$ = interval(tick).take(4)
        events$.dispose = function(){
          disposed = true
        }
        return events$
      },
      value$: (value$) => {
        return value$.forEach(v => {
          countListened++
          lastVal = v
        })
      }
    })
    const dispose = run()
    setTimeout(() => {
      dispose()
      setTimeout(() => {
        t.is(lastVal, 16, 'last value is correct')
        t.is(countEmitted, 5, 'countEmitted correct')
        t.is(countListened, 5, 'countListened correct')
        t.end()
      }, tick*10)
    }, tick*5)

})
}

makeRxTest('rx', rxRun, rxProxy, Rx.Observable.interval)
makeRxTest('rxjs', rxjsRun, rxjsProxy, Rxjs.Observable.interval)

test('cyclic proxy (xstream)', (t) => {
  const Double = (value$, events$) => {
    //return {value$: value$.map(x => x*2).sample(events$)}
    return {value$: value$.map(x => events$.mapTo(x*2)).flatten()}
  }

  let countEmitted = 0
  let countListened = 0
  let lastVal
  let tick = 50

  const Main = ({events$}) => {
    const value$ = xsProxy(_ => _
      .startWith(1)
      .debug(() => countEmitted++)
      .debug((x) => console.log(x))
    )
    const double = Double(value$, events$)
    value$.proxy(double.value$)
    return {
      value$: value$
    }
  }

  const {run} = xsRun(Main, {
    events$: () => {
      let disposed = false
      const events$ = xs.periodic(tick).take(4)
      events$.dispose = function(){
        disposed = true
      }
      return events$
    },
    value$: (value$) => {
      value$.addListener({
        next: v => {
          console.log('value', v)
          countListened++
        },
        error: () => {},
        complete: () => {}
      })
      return {}
    }
  })
  const dispose = run()
  setTimeout(() => {
    dispose()
    setTimeout(() => {
      t.is(countEmitted, 5, 'countListened')
      t.is(countListened + 1, countEmitted)
      t.end()
    }, tick*5)
  }, tick*6)
})

test.skip('cyclic proxy (most)', (t) => {
  const Double = (value$, events$) => {
    //return {value$: value$.map(x => x*2).sample(events$)}
    return {value$: value$.map(x => events$.map(_ => x*2)).flatMap()}
  }

  let countEmitted = 0
  let countListened = 0
  let lastVal
  let tick = 50

  const Main = ({events$}) => {

    const value$ = mostProxy(_ => _
      .startWith(1)
      .map((x) => {
        countEmitted++
        return x
      })
      //.debug((x) => console.log(x))
    )
    //console.log('events$', value$)
    const double = Double(value$, events$)
    value$.proxy(double.value$)
    return {
      value$: value$
    }
  }

  const {run} = mostRun(Main, {
    events$: () => {
      let disposed = false
      const events$ = most.periodic(tick).take(4)
      events$.dispose = function(){
        disposed = true
      }
      return events$
    },
    value$: (value$) => {
      value$.subscribe({
        next: v => {
          console.log('value', v)
          countListened++
        },
        error: () => {},
        complete: () => {}
      })
      return {}
    }
  })
  const dispose = run()
  setTimeout(() => {
    //dispose()
    setTimeout(() => {
      t.is(countListened + 1, countEmitted)
      t.end()
    }, tick*5)
  }, tick*6)
})
