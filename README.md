# cycle-circular

Helper for creating circular leak safe proxy for [cycle.js](http://cycle.js.org)

## What?

Sometimes developing with [cycle.js](https://github.com/cyclejs/core) you may find your self in situation
where your will need something like this:
```js
  const foo = Foo({value$: bar.value$, DOM})
  const bar = Bar({HTTP, prop$: foo.prop$})
```
(Here we want to use stream `bar.value$` before it exists)

`cycle-circular` will allow to do this by creating 
safe from memory leaks proxy stream that will imitate `bar.value$`: 

```js
  import proxy from 'cycle-circular/rx'  
  ...
  
  const value$ = proxy()   
  const foo = Foo({value$, DOM})
  const bar = Bar({HTTP, prop$: foo.prop$})
  value$.proxy(bar.value$)
```

if you need to apply some operators to proxied stream:
```js
  import proxy from 'cycle-circular/xstream'  
  ...
  
  const value$ = proxy(_ => _.startWith(1))   
  const foo = Foo({value$, DOM})
  const bar = Bar({HTTP, prop$: foo.prop$})
  value$.proxy(bar.value$)
```

can do it also this way:
```js
  import circular from 'cycle-circular/rxjs'  
  ...
  
  const repeatValue = circular().proxy
  const value$ = repeatValue().startWith(1)
  const foo = Foo({value$, DOM})
  const bar = Bar({HTTP, prop$: foo.prop$})
  repeatValue(bar.value$)
```

## Install
```
npm i cycle-circular @cycle/rx-adapter -S
```