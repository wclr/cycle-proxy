import {equal} from 'assert'
import rxProxy from '../rx'
import xsProxy from '../xstream'
import rxRun from '@cycle/rx-run'
import xsRun from '@cycle/xstream-run'
import xsAdapter from '@cycle/xstream-adapter'
import xs from 'xstream'
import {Observable as O} from 'rx'
import Rx from 'rx'

const Double = (value$, events$) => {
  return {value$: value$.map(x => x*2).sample(events$)}
}

describe.skip('proxy', () => {
  it('creates circular dependency', (done) => {
    let countEmitted = 0
    let lastVal

    const value$ = rxProxy(_ => _
      .startWith(1)
      .do(() => countEmitted++)
      .do((x) => console.log(x))
    )

    value$.take(8).subscribe({
      onNext: (x) => {
        lastVal = x
      },
      onError: () => {},
      onCompleted: (x) => {
        setTimeout(() => {
          equal(lastVal, 128)
          equal(countEmitted, 8)
          done()
        }, 500)
      }
    })

    value$.take(4).subscribe(x => {
      console.log('double$ subscribe', x)
    })

    const double = Double(value$)
    value$.proxy(double.value$.take(8))

  })
})

const makeRxTest = (Cycle, adapter, proxy, interval) => {
  const Double = (value$, events$) => {
    return {value$: value$.map(x => x*2).sample(events$)}
  }
  describe.only('cyclic proxy (rx)', () => {
    it('creates circular dependency', (done) => {
      let countEmitted = 0
      let countListened = 0
      let lastVal
      let tick = 50

      const Main = ({events$}) => {
        const value$ = rxProxy(_ => _
          .startWith(1)
          .do(() => countEmitted++)
          //.do((x) => console.log(x))
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
          const events$ = O.interval(tick).takeWhile(() => !disposed)
          events$.dispose = function(){
            disposed = true
          }
          return events$
        },
        value$: (value$) => {
          return value$.forEach(v => {
            countListened++
            //console.log('value', v)
          })
        }
      })
      const dispose = run()
      setTimeout(() => {
        dispose()
        setTimeout(() => {
          equal(countListened + 1, countEmitted)
          done()
        }, tick*5)
      }, tick*5)
    })
  })

}

makeRxTest(rxRun, rxProxy, Rx.Observable.interval)
// makeTest(xsRun, xsAdapter, xsProxy, xs.interval)

describe('cyclic proxy (xstream)', () => {
  const Double = (value$, events$) => {
    //return {value$: value$.map(x => x*2).sample(events$)}
    return {value$: value$.map(x => events$.mapTo(x*2)).flatten()}
  }
  it('creates circular dependency', (done) => {
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
        equal(countListened + 1, countEmitted)
        done()
      }, tick*5)
    }, tick*6)
  })
})
