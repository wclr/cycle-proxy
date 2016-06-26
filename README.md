# cycle-circular

Helper for creating circular proxy for [cycle.js](http://cycle.js.org)

## WFT?

```js
  const foo = Foo({value$: bar.value$, DOM})
  const bar = Bar({HTTP, prop$: foo.prop$})
```

```js
  import proxy from 'cycle-circular/rx'  
  ...
  
  const value$ = proxy()   
  const foo = Foo({value$, DOM})
  const bar = Bar({HTTP, prop$: foo.prop$})
  
  bar.value$.let(value$.proxy)
    .subscribe(...)    
```

## Install
```
npm i cycle-circular @cycle/rx-adapter -S
```