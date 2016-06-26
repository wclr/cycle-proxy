import {equal} from 'assert'
import rxProxy from '../rx'
import rxjsProxy from '../rxjs'
import xsProxy from '../xstream'
import mostProxy from '../most'
import Rx from 'rx'
import Rxjs from 'rxjs'
import most from 'most'
import xs from 'xstream'
import R from 'ramda'
import test from 'tape'
import {sample} from '@most/sample'

const timeScale = 10

const checkProcessed = (t, dispose, processed, processedEmitted) => {
  setTimeout(() => {
    dispose()
    if (R.equals(processed, [ 1, 2, 3, 5 ])){
      t.pass('processed is correct')
    } else {
      console.log('processed', processed)
      t.fail('processed is correct')
    }
    setTimeout(() => {
      if (R.equals(processedEmitted, [ 1, 2, 3, 5 ])){
        t.pass('no leak detected')
      } else {
        console.log('processedEmitted', processedEmitted)
        t.fail('no leak detected')
      }
      t.end()
    }, 100*timeScale)
  }, 200*timeScale)
}

const makeRxTest = (name, Rx, proxy) => {
  let O = Rx.Observable
  let processed = []
  let processedEmitted = []
  let items = [1, 2, 3, 2, 5, 6, 7, 8, 9, 10]
  test(`cyclic proxy (${name})`, (t) => {

    let item$ = O.interval(10*timeScale).map(i => items[i] || -1)

    let queueMimic$ = proxy()

    let passed$ = item$.withLatestFrom(queueMimic$.startWith([]), (item, queue) => {
      return (queue.indexOf(item) < 0) ? item : null
    }).filter(_ => _)

    let processed$ = passed$
      .zip(O.interval(40*timeScale), _ => _)
      .do(x => processedEmitted.push(x))
      .share() // catch leak


    let q$ = O.merge(passed$, processed$).scan((q, item) => {
      var index = q.indexOf(item)
      return (index < 0) ? R.append(item, q) : R.remove(index, 1, q)
    }, [])
      .share()
      .let(queueMimic$.proxy)

    let sub = O.merge(processed$, q$.skip())
      .subscribe(
      x => {
        processed.push(x)
      }
    )
    let dispose = (sub.dispose || sub.unsubscribe).bind(sub)
    checkProcessed(t, dispose, processed, processedEmitted)
  })
}

makeRxTest('rx', Rx, rxProxy)
makeRxTest('rxjs', Rxjs, rxjsProxy)