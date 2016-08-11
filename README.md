# cycle-circular

Helper for creating imitating proxy inside [cycle.js](http://cycle.js.org)
apps.

This helper allows to create a stream which can **attach to other stream**
and emmit its values. Like [`imitate`](https://github.com/staltz/xstream#imitate) 
in `xstream`.

## Why, what?

This is usually useful when you have **circular dependency of streams**, 
when say some stream `bar$` depends on stream `foo$` and at the same time
`foo$` actually depends on `bar$` emissions, this 
is **not a dead lock** - this is actually quite common situation - 
this us usual cyclic dependency between action and result, nest result 
give a birth to next action, and so on.

```js
  const foo = Foo({value$: bar.value$, DOM})
  const bar = Bar({HTTP, prop$: foo.prop$})
```

```js
  import proxy from 'cycle-circular/rx'  
  ...
  
  const barValueProxy$ = proxy()   
  const foo = Foo({value$, DOM})
  const bar = Bar({HTTP, prop$: foo.prop$})
  
  bar.value$
    .let(barValueProxy$.proxy) // let's proxy bar.value$ -> value$ 
    .subscribe(...)    
```
`barValueProxy$` here is created imitating proxy stream it has 
`proxy(targetStream)` method  that takes a target stream 
and attaches to it - will create **internal subscription** to target stream 
- but only **after external subscription** is created. 
That said internal subscription ends (detaches from target stream) 
when external subscription ends - this allows to avoid potential 
circular memory leak (which may happen if we launch target 
stream using just internal subscription, without or regardless 
externally managed subscription 
- if you don't get it completely - do not worry, it is ok)

####  Difference from [`xstream`'s `imitate`](https://github.com/staltz/xstream#imitate) 

So to launch this proxied stream it needs to be subscribed externally.
This is the main difference from `imitate` which uses some internal 
mechanics of `xstream` to track circular dependency of subscriptions
which may lead to memory leak eventually and allows to use more simple API. 
This module is more general purpose.
If you are using `xstream` it is recommended to use `imitate`. But 
this `proxy` also supports attaching to any kind of streams 
(even `MemoryStreams` of `xstream`, which `imitate` does not support).

## Install
```
npm i cycle-circular @cycle/rx-adapter -S
```