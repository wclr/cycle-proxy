import { StreamAdapter, Observer} from '@cycle/base'

export type Stream = any

export interface ProxyFn {
  (originalStream: Stream) : Stream 
} 

export const makeProxy = (adapter: StreamAdapter) => {  
  return (composeFn = (_: any) => _): Stream & { proxy: ProxyFn } => {
    const subject = adapter.makeSubject()    
    let proxyDispose: any
    let targetStream: Stream    
    const proxyStream = subject.stream
    const proxyObserver = subject.observer    
    proxyStream.proxy = (target: Stream) => {
      if (!target || !adapter.isValidStream(target)){
        throw new Error('You should provide a valid target stream to proxy')
      }
      if (targetStream){
        throw new Error('You may provide only one target stream to proxy')
      }
      targetStream = composeFn(target)
      proxyStream.__proxyRefs = 0      
      return adapter.adapt({}, (_: any, observer: Observer<any>) => {        
        let dispose = adapter.streamSubscribe(target, observer)        
        if (proxyStream.__proxyRefs++ === 0) {          
          proxyDispose = adapter.streamSubscribe(
            targetStream, proxyObserver
          )          
        }
        return () => {
          dispose()
          if (--proxyStream.__proxyRefs === 0) {
            proxyDispose()
            proxyObserver.complete()
            if (proxyStream.__onProxyDispose) {
              proxyStream.__onProxyDispose()
            }
          }
        }
      })
    }
    return proxyStream
  }
}

export default makeProxy
