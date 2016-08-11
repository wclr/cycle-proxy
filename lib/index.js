'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

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
    var disposeSubscriptionToTarget = function disposeSubscriptionToTarget() {
      if (proxyDispose) {
        proxyDispose();
      }
    };
    proxyStream.proxy = function (target) {
      var subscribeToTarget = function subscribeToTarget() {
        if (proxyDispose) return;
        proxyDispose = adapter.streamSubscribe(adapter.remember(targetStream), subject.observer);
      };
      if (target) {
        var _ret = function () {
          if (targetStream) {
            throw new Error('You may provide only one target stream to proxy');
          }
          if (!adapter.isValidStream(target)) {
            throw new Error('You should provide a valid target stream to proxy');
          }
          targetStream = composeFn(target);
          var refs = 0;
          return {
            v: adapter.adapt({}, function (_, observer) {
              var dispose = adapter.streamSubscribe(target, observer);
              if (refs++ === 0) {
                subscribeToTarget();
              }
              return function () {
                dispose();
                if (--refs === 0) {
                  disposeSubscriptionToTarget();
                }
              };
            })
          };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
      } else {
        return proxyStream;
      }
    };

    return proxyStream;
  };
};

exports.default = makeProxy;