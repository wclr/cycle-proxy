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
    let refs = 0
    const proxyStream = subject.stream    
    proxyStream.proxy = (target: Stream) => {
      if (!target || !adapter.isValidStream(target)){
        throw new Error('You should provide a valid target stream to proxy')
      }
      if (targetStream){
        throw new Error('You may provide only one target stream to proxy')
      }
      targetStream = composeFn(target)
      let refs = 0
      
      return adapter.adapt({}, (_, observer) => {
        let dispose = adapter.streamSubscribe(target, observer)        
        if (refs++ === 0) {          
          proxyDispose = adapter.streamSubscribe(
            targetStream, subject.observer
          )
        }
        return () => {
          dispose()
          if (--refs === 0){
            proxyDispose()
          }
        }
      })
    }
    return proxyStream
  }
}

export default makeProxy
