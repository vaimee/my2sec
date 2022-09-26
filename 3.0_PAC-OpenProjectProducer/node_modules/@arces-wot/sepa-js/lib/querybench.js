

class SPARQLbench {

  constructor(namespaces = {}){
    this.namespaces = namespaces
  }

  addNameSpace(prefix,ns){
    this.namespaces[prefix] = ns
  }

  removeNameSpace(prefix){
    this.namespaces.delete(prefix)
  }

  sparql(template,bindings){
    let prefixes = []
    Object.keys (this.namespaces). forEach (k => {
      let pref = `PREFIX ${k}:<${this.namespaces[k]}>`
      prefixes.push(pref)
    });
    prefixes = prefixes.join(" ")

    if(bindings instanceof Array){
      if (!this._isquery(template)){
        throw new Error("SPARQL Update not supported for multiple bindings")
      }

      const base = this._createValueTemplate(bindings)
      return template.replace("{","{"+this._createValues(base))
    }
    const valuesTemplate = {
      body: [],
      vars : []
    }

    Object.keys(bindings).forEach(k =>{
      let search = new RegExp("(\\?|\\$)" + k +"(?![a-z]|[A-Z]|_|[0-9]|[\\u00D6-\\u06fa]|[\\u00D8-\\u00F6]|[\\u00F8-\\u02FF]|[\\u0370-\\u037D]|[\\u037F-\\u1FFF]|[\\u200C-\\u200D]|[\\u2070-\\u218F]|[\\u2C00-\\u2FEF]|[\\u3001-\\uD7FF]|[\\uF900-\\uFDCF]|[\\uFDF0-\\uFFFD]|[\\u1000-\\uEFFF])",'g')
      if(bindings[k].value instanceof Array){
        if(!this._isquery(template)) throw new Error("SPARQL Update not supported for multiple bindings");

        valuesTemplate.vars.push("?"+k)
        let values = bindings[k].value.map((val)=>{
          return this._transformValue({ value: val, type: bindings[k].type})
        })
        const index = valuesTemplate.vars.length -1
        for (let i = 0; i < values.length; i++) {
          if (!valuesTemplate.body[i]) valuesTemplate.body[i] = [];

          valuesTemplate.body[i][index] = values[i]
        }
       
      }else if(bindings[k].value !== undefined && bindings[k].value !== null){
        let replaceValue = this._transformValue(bindings[k])
        template = template.replace(search, replaceValue)
      }
    })

    template = template.replace("{", "{" + this._createValues(valuesTemplate))

    return (prefixes+" "+template).trim()
  }

  _isquery(template){
    return template.toLowerCase().includes("select")
  }
 
  _transformValue({value,type}){
    switch (type) {
      case "uri":
        const usingPrefix = /^([A-Z]|[a-z])(([A-Z]|[a-z]|_|-|[0-9]|\.)*([A-Z]|[a-z]|_|-|[0-9]))?:([A-Z]|[a-z]|_|[0-9])(([A-Z]|[a-z]|_|-|[0-9]|\.)*([A-Z]|[a-z]|_|-|[0-9]))?$/gm;
        return usingPrefix.test(value) ? value : "<" + value + ">"
      case "literal":
        if (typeof value === "string") {
          return "'" + value + "'"
        } else {
          return value
        }
      default:
        return value
    }
  }

  _createValueTemplate(bindings){
    let vars = []
    let body = []
    vars = Object.keys(bindings[0]).map(key => "?"+key)
    
    body = bindings.map(binding =>{
      return Object.keys(binding).map(key => {
        return this._transformValue(binding[key])
      })
    })

    return {body,vars}
  }

  _createValueTemplateFromKey(key, bindings){
    let vars = []
    let body = []
    vars.push("?"+key);


  }

  _createValues({body,vars}){
    if(body.length === 0 && vars.length ===0 ){
      return ""
    }

    body = body.map(values =>{
      return `(${values.join(" ")})` 
    }).join(" ")
    return `VALUES(${vars.join(" ")}){${body}}`
  }
}

module.exports = SPARQLbench;
