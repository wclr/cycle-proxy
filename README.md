# cycle-proxy

> Create imitating proxy and circular dataflows in your [cycle.js](http://cycle.js.org) apps.

This helper allows to create a stream which can **attach to other stream**
and emmit target stream values. Like [`imitate`](https://github.com/staltz/xstream#imitate) 
in `xstream`.

```bash
npm install cycle-proxy -S
```

## Why?

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

### Usage

```js
  // import proxy for particular stream library: 
  // rx, rxjs, most, xtream
  import proxy from 'cycle-proxy/rx'  
  ...
      
  const barValueProxy$ = proxy()
  // proxy() can take compose function 
  // that will be applied to transform imitated stream: 
  // const barValueProxy$ = proxy(_ => _.startWith(0))
  const foo = Foo({value$: barValueProxy$, DOM})
  const bar = Bar({HTTP, prop$: foo.prop$})
  
  bar.value$
    .let(barValueProxy$.proxy) // let's proxy (mimic) bar.value$ -> barValueProxy$ 
    .subscribe(...)    
```
- `barValueProxy$` here is created imitating proxy stream it has 
`proxy(targetStream)` method  that takes a target stream 
and **transparently** attaches to it - **after external subscription** is created. 
- **When external subscription ends** it detaches from target stream 
and proxy stream stops emitting values. 
- Because we create internal subscription to target stream dependent on external one (which is 
managed managed externally by your code) we are able to avoid potential memory leak.

###  Difference from [`xstream`'s `imitate`](https://github.com/staltz/xstream#imitate) 

So to launch this proxied stream it needs to be subscribed externally. 
This means that such code won't work:
```js
  barValueProxy$.proxy(bar.value$) // <- needs to be subscribed!
  ....
  bar.value$.subscribe(...)
```
Though with `xstream` and `imitate` such code will work:
```js  
  barValueProxy$.imitate(bar.value$) // <- no need to be subscribed
  ....
  bar.value$.addListener(...)
```

This is the main difference from `imitate` which uses some internal 
mechanics of `xstream` to track circular subscriptions
(which may lead to memory leak eventually) and allows to use more simple API. 
This module **is more general purpose**.
If you are using `xstream` it is recommended to use `imitate`. But 
this `proxy` also supports attaching to any kind of streams 
(even `MemoryStreams` of `xstream`, which `imitate` does not support).

### Circulate

There is also useful `circulate` utitlity helper included 
using which you can make circular dataflows (without explicit use of `proxy` API):

It allows you with ease to create circular state 
in cycle.js application [with reducer patter](http://staltz.com/reducer-pattern-in-cyclejs.html):

```ts  
  import circulate from 'cycle-proxy/circulate/rxjs'  
  ...  

  let Main({DOM, state$}: Sources) => {

    const reducer$ = merge(
      of(() => ({count: 1})), // set initial state
      DOM.select('add').map(({count}) => ({count: count + 1})),
      DOM.select('.substruct').map(({count}) => ({count: count - 1}))
    )
    return {
      DOM: state$.map(({count}) => div([
        div('count:' + count),
        button('.add', '+1'),
        button('.add', '-1')
      ])),
      state$: reducer$
        .scan((state, reducer) => reducer(state))
    }
  }  
  
  // `circulate` will connect sinks' state$  to sources' state$ stream
  // so each value that will go to sink, you will see in the source
  // `state$` is a name of circulated stream, default name is `circular$`  
  let StatifiedMain = circulate(Main, 'state$')

  run(StatifiedMain, {
    DOM: makeDOMDriver()
  })
```

NB! `circulate` is leak free. It will stop the curculating stream 
when all the sinks of the dataflow will be unsubscribed.

## Licence
ISC.