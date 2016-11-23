import proxy from '../rx'
import adapter from '@cycle/rx-adapter'
import { makeCirculate, Dataflow } from './index'
import { Observable } from 'rx'

export function circulate<So, Si>
  (dataflow: Dataflow<So, Si>, name?: string): Dataflow<So, Si> {
  return makeCirculate(proxy, adapter)<So, Si>(dataflow, name)
}

export default circulate