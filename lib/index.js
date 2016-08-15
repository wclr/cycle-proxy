'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var makeProxy = exports.makeProxy = function makeProxy(adapter) {
  if (!adapter || typeof adapter.adapt !== 'function') {
    throw new Error('First parameter should pass a stream adapter');
  }
  return function () {
    var composeFn = arguments.length <= 0 || arguments[0] === undefined ? function (_) {
      return _;
    } : arguments[0];

    var subject = adapter.makeSubject();
    var proxyDispose = void 0;
    var targetStream = void 0;
    var refs = 0;
    var proxyStream = subject.stream;
    proxyStream.proxy = function (target) {
      if (!target || !adapter.isValidStream(target)) {
        throw new Error('You should provide a valid target stream to proxy');
      }
      if (targetStream) {
        throw new Error('You may provide only one target stream to proxy');
      }
      targetStream = composeFn(target);
      var refs = 0;
      return adapter.adapt({}, function (_, observer) {
        var dispose = adapter.streamSubscribe(target, observer);
        if (refs++ === 0) {
          proxyDispose = proxyDispose || adapter.streamSubscribe(targetStream, subject.observer);
        }
        return function () {
          dispose();
          if (--refs === 0) {
            proxyDispose && proxyDispose();
          }
        };
      });
    };
    return proxyStream;
  };
};

exports.default = makeProxy;