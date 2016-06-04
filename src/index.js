export const proxy = (adapter, composeFn = _ => _) => {
  if (!adapter || typeof adapter.adapt !== 'function'){
    throw new Error('First parameter should pass a stream adapter')
  }
  const proxy = adapter.makeSubject()
  let proxyDispose
  let originalStream
  let refs = 0
  let _lastValue
  let _lastValueEmitted = false

  const proxyStream = adapter.adapt({}, (_, observer) => {
    if (_lastValueEmitted){
      observer.next(_lastValue)
    }
    const dispose = adapter.streamSubscribe(proxy.stream, observer)
    refs++
    if (originalStream && !proxyDispose){
      proxyStream.proxy(originalStream)
    }
    return () => {
      dispose && dispose()

      if (!--refs){
        proxyDispose && proxyDispose()
        proxyDispose = null
        _lastValueEmitted = false
      }
    }
  })
  proxyStream.proxy = (original) => {
    if (original){
      original = composeFn(original)
      if (!adapter.isValidStream(original)){
        throw new Error('You should provide a valid stream to proxy')
      }
      originalStream = null
      proxyDispose = adapter
        .streamSubscribe(original, {
          next: (val) => {
            _lastValueEmitted = true
            _lastValue = val
            proxy.observer.next(val)
          },
          error: ::proxy.observer.error,
          complete: ::proxy.observer.complete
        })
      originalStream = original
    } else {
      return proxyStream
    }
  }
  return proxyStream
}

export const makeProxy = (adapter) => (fn) => proxy(adapter, fn)

export default makeProxy
