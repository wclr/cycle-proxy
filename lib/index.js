'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var proxy = exports.proxy = function proxy(adapter) {
  var composeFn = arguments.length <= 1 || arguments[1] === undefined ? function (_) {
    return _;
  } : arguments[1];

  if (!adapter || typeof adapter.adapt !== 'function') {
    throw new Error('First parameter should pass a stream adapter');
  }
  var proxy = adapter.makeSubject();
  var proxyDispose = void 0;
  var originalStream = void 0;
  var refs = 0;
  var _lastValue = void 0;
  var _lastValueEmitted = false;

  var proxyStream = adapter.adapt({}, function (_, observer) {
    if (_lastValueEmitted) {
      observer.next(_lastValue);
    }
    var dispose = adapter.streamSubscribe(proxy.stream, observer);
    refs++;
    if (originalStream && !proxyDispose) {
      proxyStream.proxy(originalStream);
    }
    return function () {
      dispose && dispose();

      if (! --refs) {
        proxyDispose && proxyDispose();
        proxyDispose = null;
        _lastValueEmitted = false;
      }
    };
  });
  proxyStream.proxy = function (original) {
    if (original) {
      var _context;

      original = composeFn(original);
      if (!adapter.isValidStream(original)) {
        throw new Error('You should provide a valid stream to proxy');
      }
      originalStream = null;
      proxyDispose = adapter.streamSubscribe(original, {
        next: function next(val) {
          _lastValueEmitted = true;
          _lastValue = val;
          proxy.observer.next(val);
        },
        error: (_context = proxy.observer).error.bind(_context),
        complete: (_context = proxy.observer).complete.bind(_context)
      });
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