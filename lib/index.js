'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var proxy = exports.proxy = function proxy(adapter) {
  var composeFn = arguments.length <= 1 || arguments[1] === undefined ? function (_) {
    return _;
  } : arguments[1];

  if (!adapter) {
    throw new Error('You should pass stream adapter to use');
  }
  var proxy = adapter.makeHoldSubject();
  var proxyDispose = void 0;
  var originalStream = void 0;
  var refs = 0;
  var proxyStream = adapter.adapt({}, function (_, observer) {
    var dispose = adapter.streamSubscribe(proxy.stream, observer);
    refs++;
    if (originalStream && !proxyDispose) {
      proxyStream.proxy(originalStream);
    }
    return function () {
      dispose();
      if (! --refs) {
        proxyDispose();
        proxyDispose = null;
      }
    };
  });
  proxyStream.proxy = function (original) {
    if (original) {
      original = composeFn(original);
      if (!adapter.isValidStream(original)) {
        throw new Error('You should provide a valid stream to proxy');
      }
      originalStream = null;
      proxyDispose = adapter.streamSubscribe(original, proxy.observer);
      originalStream = original;
    } else {
      return proxyStream;
    }
  };
  return proxyStream;
};

var makeProxy = exports.makeProxy = function makeProxy(adapter) {
  return function (fn) {
    return proxy(adapter, fn);
  };
};

exports.default = makeProxy;