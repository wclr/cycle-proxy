module.exports = require('./lib/index')
  .makeProxy(require('@cycle/rx-adapter').default)

//let Rx = require('rx')
//
//module.exports = () => {
//
//  ////let subject = new Rx.ReplaySubject(1)
//  let src
//  let refCount = -1;
//  let source
//  let proxyStream = Rx.Observable.create(ob => {
//
//    var con;
//    if (src){
//      console.warn('SUBSCRIBE', refCount)
//      var sub = src.subscribe(ob)
//      if (refCount++ === -1) {
//        console.warn('CONNECT')
//        con = src.connect();
//      }
//      //sub.add(() => {
//      //  if (refCount-- === 0) {con.unsubscribe(); }
//      //})
//      return new Rx.CompositeDisposable([sub], () => {
//        console.warn('check composite', refCount)
//        if (refCount-- === 0) {con.unsubscribe(); }
//      })
//      //return sub;
//    }
//
//  })
//
//  let attach = function(s) {
//    source = s
//    src = source.publish();
//
//  }
//
//  proxyStream.proxy = attach
//
//  return proxyStream
//}
//
