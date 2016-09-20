import adapter from '@cycle/xstream-adapter'
import { makeProxy } from './index'
import { Stream } from 'xstream'

export interface ProxyStream<T> extends Stream<T> {  
  /**
   * Attaches to other stream to emit its events.
   * Returns proxied stream that needs to be subscribed.
   * @param  {Stream<T>} target
   * @returns Stream
   */
  proxy(target: Stream<T>): Stream<T>
}

/**
 * Creates proxy stream that can attach to other `target` observable
 * to emit the same events.
 * Created stream has `proxy` method, that is used to attach to `target`.
 *
 * This is used to allow **circular dependency of streams**.
 * @param  {(stream:Stream<T>)=>Stream<T>} compose?
 */
export function proxy<T>(compose?: (stream: Stream<T>) => Stream<T>)
  : ProxyStream<T> {
  return makeProxy(adapter)(compose)
}

export default proxy