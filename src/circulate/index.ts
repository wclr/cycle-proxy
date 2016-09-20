export type Dataflow<Sinks> = (...rest: any[]) => Sinks;

export type Fields = string | string[] | { [index: string]: true } 

export const makeCirculate = (proxy: any) =>
  function circulate(...args: any[]): any  {
    let dataflow: Dataflow<any>
    let fields: any = args.filter(_ => _)             
    if (typeof fields[0] === 'function') {
      dataflow = fields.shift()
    } else {
      return (dataflow: Dataflow<any>) => circulate(dataflow, ...fields)
    }
    
    if (fields.length === 0) {
      fields = null
    } else if (fields.length === 1 && typeof fields[0] === 'object') {
      fields = fields[0]
    }
            
    let sources: any = {}
    let sourcesArray: any[] = []
    if (fields) {
      if (Array.isArray(fields)) {
        fields.forEach((key) => {
          sources[key] = proxy()
          sourcesArray.push(sources[key])          
        })
      } else {
        for (let key in fields) {
          sources[key] = proxy()
        }
      }      
    } else {
      sources = proxy()
    }
    let sinks: any = sourcesArray.length ? dataflow(...sourcesArray) : dataflow(sources)
    if (fields) {
      let proxiedSinks: any = {}
      for (let key in sinks) {
        proxiedSinks[key] = sources[key] ? sources[key].proxy(sinks[key]) : sinks[key]
      }
      return proxiedSinks
    } else {
      return sources.proxy(sinks)
    }
  }

export default makeCirculate
