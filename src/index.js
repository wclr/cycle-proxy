export const makeProxy = (adapter) => {
  if (!adapter || typeof adapter.adapt !== 'function'){
    throw new Error('First parameter should pass a stream adapter')
  }
  return (composeFn = _ => _) => {
    const subject = adapter.makeSubject()
    let proxyDispose
    let targetStream
    let refs = 0
    const proxyStream = subject.stream
    const disposeSubscriptionToTarget = () => {
      if (proxyDispose) {
        proxyDispose()
      }
    }
    proxyStream.proxy = (target) => {
      const subscribeToTarget = () => {
        if (proxyDispose) return
        proxyDispose = adapter.streamSubscribe(
          adapter.remember(targetStream), subject.observer
        )
      }
      if (target){
        if (targetStream){
          throw new Error('You may provide only one target stream to proxy')
        }
        if (!adapter.isValidStream(target)){
          throw new Error('You should provide a valid target stream to proxy')
        }
        targetStream = composeFn(target)
        let refs = 0
        return adapter.adapt({}, (_, observer) => {
          let dispose = adapter.streamSubscribe(target, observer)
          if (refs++ === 0){
            subscribeToTarget()
          }
          return () => {
            dispose()
            if (--refs === 0){
              disposeSubscriptionToTarget()
            }
          }
        })
      } else {
        return proxyStream
      }
    }

    return proxyStream
  }
}

export default makeProxy
