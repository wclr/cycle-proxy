import proxy from '../rxjs'
import { makeCirculate } from './index'
import { Observable } from 'rxjs/Observable'

export type Dataflow<Sinks> = (...rest: any[]) => Sinks

export function circulate<T>(dataflow: (stream$: Observable<T>) => Observable<T>): Observable<T>
export function circulate<Sinks>(dataflow: Dataflow<Sinks>, properties: { [index: string]: true }): Sinks
export function circulate<Sinks>(dataflow: Dataflow<Sinks>, ...properties: string[]): Sinks
export function circulate<T>(prop: string):
  <Sinks>(dataflow: (stream$: Observable<T>) => Sinks) => Sinks
export function circulate<T1, T2>(prop1: string, prop2: string):
  <Sinks>(dataflow: (prop1$: Observable<T1>, prop2$: Observable<T2>) => Sinks) => Sinks


export function circulate(dataflow: any, fields?: any) {
  return makeCirculate(proxy)(dataflow, fields)
}

export default circulate