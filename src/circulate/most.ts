import proxy from '../most'
import adapter from '@cycle/most-adapter'
import { makeCirculate, Dataflow } from './index'

export function circulate<So, Si>
  (dataflow: Dataflow<So, Si>, name?: string): Dataflow<So, Si> {
  return makeCirculate(proxy, adapter)<So, Si>(dataflow, name)
}

export default circulate