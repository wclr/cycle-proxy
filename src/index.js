 export const proxy = (adapter, composeFn = _ => _) => {
  if (!adapter || typeof adapter.adapt !== 'function'){
    throw new Error('First parameter should pass a stream adapter')
  }
  const proxy = adapter.makeSubject()
  let proxyDispose
  let targetStream
  let refs = 0
  const proxyStream = proxy.stream
  const subscribeToTarget = () => {
    if (proxyDispose) return
    proxyDispose = adapter.streamSubscribe(
      adapter.remember(targetStream), proxy.observer
    )
  }
  const disposeSubscriptionToTarget = () => {
    if (proxyDispose) {
      proxyDispose()
    }
  }
  proxyStream.proxy = (target) => {
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
  proxyStream.launch = (stream$) => {
    return adapter.adapt({}, (_, observer) => {
      let disposeLauncher = adapter.streamSubscribe(launcherStream, {
        next: () => {},
        error: () => {},
        complete: () => {}
      })
      let dispose = adapter.streamSubscribe(stream$, observer)
      return () => {
        disposeLauncher()
        dispose()
      }
    })
  }
  return proxyStream
}

export const makeProxy = (adapter) => (fn) => proxy(adapter, fn)
export default proxy
