const SEPA = require('./sepa');
const Bench = require('./querybench');
const defaults = require('./defaults');

function trasformBindings(bindings = {},forcedBindings={}) {
  let result = {}
  Object.keys(bindings).forEach(k => {
    result[k] = {
      value : bindings[k],
      type : forcedBindings[k] ? forcedBindings[k].type : "literal"
    }
  })
  result = Object.assign(forcedBindings,result)
  return result
}

class Jsap {
  constructor(config = {}) {
    if (typeof config === 'string') {
      config = JSON.parse(config)
    }

    let parameters = (({ host, sparql11protocol, sparql11seprotocol }) => (prune({ host, sparql11protocol, sparql11seprotocol })))(config)
    parameters = Object.assign({},defaults,parameters)
    
    Object.assign(this, parameters)
    
    this.namespaces = config.namespaces ? config.namespaces : {}
    this.extended   = config.extended   ? config.extended : {}
    this.updates    = config.updates    ? config.updates : {}
    this.queries    = config.queries    ? config.queries : {}
    
    this.api   = new SEPA(parameters)
    this.bench = new Bench(this.namespaces)

    Object.keys(this.updates).forEach(k =>{
      this[k] = binds => {
        return this.update(k,binds)
      }
    })
    Object.keys(this.queries).forEach(k =>{
      if(this[k]){
        delete(this[k])
      }else{
      this[k] = (binds,handler) => {
         return this.subscribe(k,binds,handler)
        }
      this[k].query = binds => {
          return this.query(k, binds)
        }
      }
    })
  }
  query(key,bindings){
    let query = this.queries[key].sparql
    let binds = trasformBindings(bindings, this.queries[key].forcedBindings)
    let config = (({ host, sparql11seprotocol }) => (prune({ host, sparql11seprotocol })))(this.queries[key])

    query = this.bench.sparql(query, binds)

    return this.api.query(query, config)
  }

  subscribe(key,bindings){
    let query = this.queries[key].sparql
    let binds = trasformBindings(bindings,this.queries[key].forcedBindings)
    let config = (({ host, sparql11seprotocol }) => (prune({ host, sparql11seprotocol })))(this.queries[key])
    
    query = this.bench.sparql(query,binds)
    
    return this.api.subscribe(query,config)
  }

  update(key,bindings){
    let update = this.updates[key].sparql
    let binds  = trasformBindings(bindings,this.updates[key].forcedBindings)   
    let config = (({ host, sparql11protocol }) => (prune({ host, sparql11protocol })))(this.updates[key])

    update = this.bench.sparql(update,binds)

    return this.api.update(update,config);
  }

  producer(key){
    return binds => { this.update(key,binds)}
  }

  consumer(key,handler){
    return binds => { this.subscribe(key,binds,handler)}
  }

  get Producers(){
    let result = {}
    Object.keys(this.updates).forEach(k =>{
      result[k] = binds => {
        return this.update(k,binds)
      }
    })
    return result;
  }

  get Consumers(){
    let result = {}
    Object.keys(this.queries).forEach(k =>{
      result[k] = (binds) => { return this.subscribe(k,binds)}
    })
    return result;
  }
}
/**
 * Removes undedfined properties
 * @param {Object} obj 
 */
function prune(obj) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const element = obj[key];
      
      if(!element){
        delete(obj[key])
      }
    }
  }
  return obj;
}
module.exports = Jsap;
