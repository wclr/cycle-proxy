import proxy from '../xstream'
import { makeCirculate } from './index'
import { Stream } from 'xstream'

export type Dataflow<Sinks> = (...rest: any[]) => Sinks

export function circulate<T>(dataflow: (stream$: Stream<T>) => Stream<T>): Stream<T>
export function circulate<Sinks>(dataflow: Dataflow<Sinks>, properties: { [index: string]: true }): Sinks
export function circulate<Sinks>(dataflow: Dataflow<Sinks>, ...properties: string[]): Sinks
export function circulate<T>(prop: string):
  <Sinks>(dataflow: (stream$: Stream<T>) => Sinks) => Sinks
export function circulate<T1, T2>(prop1: string, prop2: string):
  <Sinks>(dataflow: (prop1$: Stream<T1>, prop2$: Stream<T2>) => Sinks) => Sinks


export function circulate(dataflow: any, fields?: any) {
  return makeCirculate(proxy)(dataflow, fields)
}

export default circulate

import { Observable } from 'rx'

let toObservable = <T>(original: Stream<T>) : Observable<T> => {
  return Observable.of<T>()
}

let proxify = <ObservableT>(toObservable: <T>(original: Stream<T>) => Observable<T>) => {
  return toObservable<number>(Stream.of<number>(1)) 
}

proxify(toObservable).map(x => x.xxx)

