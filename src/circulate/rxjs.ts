import proxy from '../rxjs'
import adapter from '@cycle/rxjs-adapter'
import { makeCirculate, Dataflow } from './index'
import { Observable } from 'rxjs/Observable'

export function circulate<So, Si>
  (dataflow: Dataflow<So, Si>, name?: string): Dataflow<So, Si> {
  return makeCirculate(proxy, adapter)<So, Si>(dataflow, name)
}

export default circulate