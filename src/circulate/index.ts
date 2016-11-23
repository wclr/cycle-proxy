import { StreamAdapter, Observer } from '@cycle/base'

export type Dataflow<So, Si> = (sources: So, ...rest: any[]) => Si

export type Fields = string | string[] | { [index: string]: true }

export const makeCirculate = (proxy: any, adapter: StreamAdapter) =>
  function circulate<So, Si>(dataflow: any, circularName: string = 'circular$'):
    Dataflow<So, Si> {
    return function (sources: any, ...rest: any[]) {
      let circular$ = sources[circularName] = proxy()
      let sinks = dataflow(sources, ...rest) as any

      const proxyStreams: any = {}
      const proxiedSinks: any = {}

      const disposeCircular = adapter.streamSubscribe(
        circular$.proxy(sinks[circularName]), {
          next: () => { }, error: () => { }, complete: () => { }
        }
      )

      const checkAllDisposed = () => {
        let disposed = true
        for (const key in proxyStreams) {
          if (proxyStreams[key].__proxyRefs) {
            disposed = false
          }
        }
        if (disposed) {
          disposeCircular()
        }
      }

      for (const key in sinks) {
        // TODO: decide if we we need 
        // to remove circular$ stream from sinks 
        //if (key === circularName) return
        const sink = sinks[key]
        if (sink && adapter.isValidStream(sink)) {
          proxyStreams[key] = proxy()
          proxiedSinks[key] = proxyStreams[key].proxy(sink)
          proxyStreams[key].__onProxyDispose = checkAllDisposed
          // TODO: probably can use proxy completition
          // if proxy can be subscribed once?
          // adapter.streamSubscribe(proxyStreams[key], {
          //   next: () => { },
          //   error: () => { },
          //   complete: () => { console.log(key + 'completed') }
          // })
        } else {
          proxiedSinks[key] = sink
        }
      }
      return proxiedSinks
    }
  }

export default makeCirculate
