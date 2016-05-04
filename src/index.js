export const proxy = (adapter, composeFn = _ => _) => {
  if (!adapter){
    throw new Error('You should pass stream adapter to use')
  }
  const proxy = adapter.makeHoldSubject()
  let proxyDispose
  let originalStream
  let refs = 0
  const proxyStream = adapter.adapt({}, (_, observer) => {
    const dispose = adapter.streamSubscribe(proxy.stream, observer)
    refs++
    if (originalStream && !proxyDispose){
      proxyStream.proxy(originalStream)
    }
    return () => {
      dispose()
      if (!--refs){
        proxyDispose()
        proxyDispose = null
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
        .streamSubscribe(original, proxy.observer)
      originalStream = original
    } else {
      return proxyStream
    }
  }
  return proxyStream
}

export const makeProxy = (adapter) => (fn) => proxy(adapter, fn)

export default makeProxy
