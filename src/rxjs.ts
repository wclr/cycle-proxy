import adapter from '@cycle/rxjs-adapter'
import { makeProxy } from './index'
import { Observable } from 'rxjs/Observable'

export interface ProxyObservable<T> extends Observable<T> {  
  /**
   * Attaches to other observable to emit its events.
   * Returns proxied stream that needs to be subscribed.
   * @param  {Observable<T>} target
   * @returns Observable
   */
  proxy(target: Observable<T>): Observable<T>
}

/**
 * Creates proxy stream that can attach to other `target` observable
 * to emit the same events.
 * Created stream has `proxy` method, that is used to attach to `target`.
 *
 * This is used to allow **circular dependency of streams**.
 * Note that to start created proxy streams needs to be subscribed.
 * @param  {(stream:Observable<T>)=>Observable<T>} compose?
 */
export function proxy<T>(compose?: (stream: Observable<T>) => Observable<T>)
  : ProxyObservable<T> {
  return makeProxy(adapter)(compose)
}

export default proxy