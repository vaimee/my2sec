var fs = require('fs');
//QUERYBENCH MULTIPLE + SPLIT UPDATES
class SPARQLbench {

  constructor(namespaces = {}){
    this.namespaces = namespaces
    this.maxUpdateChars=200000
  }

  addNameSpace(prefix,ns){
    this.namespaces[prefix] = ns
  }

  removeNameSpace(prefix){
    this.namespaces.delete(prefix)
  }

  sparql(template,bindings){
    //console.log("sparql")
    console.log("### [0] PREFIXES ###")
    let prefixes = []
    Object.keys (this.namespaces). forEach (k => {
      let pref = `PREFIX ${k}:<${this.namespaces[k]}>`
      prefixes.push(pref)
    });
    prefixes = prefixes.join(" ")
    //console.log("Prefixes length: "+prefixes.length+" chars")
    //-------------------QUI ABBIAMO prefixes,template,bindings---------------------


    //SE I BINDINGS SONO UN ARRAY DI CELLE JSON
    if(bindings instanceof Array){
      console.log(">>> CELL ARRAY DETECTED!")
      if (!this._isquery(template)){

        throw new Error("SPARQL Update not supported for multiple bindings")
      }
      
      const base = this._createValueTemplate(bindings)
      return template.replace("{","{"+this._createValues(base))
    }


    //-------------------COSTRUZIONE QUERY------------------------------------------
    var hasMultBinds=false;
    if(!this._isquery(template) && this._hasMultipleBindings(bindings)){
      console.log("### [1] SPLIT BINDINGS  ###")
      var {singleBindings,multipleBindings}=this._splitBindingsTypes(bindings)
      if(!this._validateBindings(multipleBindings)){
        throw new Error("Array bindings must have the same size")
      }
      //console.log("> SingleBindings:\n"+JSON.stringify(singleBindings))
      //console.log("> MultipleBindings:\n"+JSON.stringify(multipleBindings))
      //template=this._handleMultipleBindings(template,multipleBindings,singleBindings);
      //console.log(template)
      bindings=singleBindings;
      hasMultBinds=true;
      //CALL SPARQL FUNCTION RECURSIVELY TO PARSE SINGLE BINDINGS THE CRHIS WAY
      //this.sparql(template,singleBindings)

      //return (prefixes+" "+template).trim();
      
    }
    
    //console.log(bindings)
    //}else{
    //console.log(template)
    //NORMAL FLOW
    //es {nome: "Greg"}
    //Per ogni binding (es. nome) del json dei bindings...
    //console.log("### [2] PARSE SINGLE BINDINGS  ###")
    const valuesTemplate = {
      body: [],
      vars : []
    }

    Object.keys(bindings).forEach(k =>{
      let search = new RegExp("(\\?|\\$)" + k +"(?![a-z]|[A-Z]|_|[0-9]|[\\u00D6-\\u06fa]|[\\u00D8-\\u00F6]|[\\u00F8-\\u02FF]|[\\u0370-\\u037D]|[\\u037F-\\u1FFF]|[\\u200C-\\u200D]|[\\u2070-\\u218F]|[\\u2C00-\\u2FEF]|[\\u3001-\\uD7FF]|[\\uF900-\\uFDCF]|[\\uFDF0-\\uFFFD]|[\\u1000-\\uEFFF])",'g')
      if(bindings[k].value instanceof Array){
        if(!this._isquery(template)) throw new Error("SPARQL Update not supported for multiple bindings");

        //console.log(bindings[k])

        //aggiungi ?nome al valuesTemplate
        valuesTemplate.vars.push("?"+k)

        //aggiungi <> o "'" al valore del binding (es. "'"Greg"'")
        let values = bindings[k].value.map((val)=>{
          return this._transformValue({ value: val, type: bindings[k].type})
        })

        //
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

    //replace query with valuesTemplate variables
    //console.log(valuesTemplate)
    template = template.replace("{", "{" + this._createValues(valuesTemplate))
    //console.log("================================================")
    //console.log(template)
    //console.log("trying to print file")
    //this.saveUpdateTemplate(template)
    //console.log("Template (no prefix) length: "+template.length)
    
    if(hasMultBinds==true){
      //console.log("### [3] MULTIPLE BINDINGS ###")
      var real_limit=this.maxUpdateChars-(prefixes.length+template.length)
      var updatesTemplates=this._handleMultipleBindings(template,multipleBindings,singleBindings,real_limit);
      //console.log(">>>>>>>>> Updates:")
      for(var jj=0;jj<updatesTemplates.length;jj++){
        updatesTemplates[jj]=(prefixes+" "+updatesTemplates[jj]).trim()
        
        console.log(`Update #${jj}: ${updatesTemplates[jj].length} characters\n${updatesTemplates[jj]}`)
        this.saveUpdateTemplate(updatesTemplates[jj])
      } 

      return updatesTemplates

    }
    

    console.log("RETURNING SINGLE UPDATE TEMPLATES")
    return (prefixes+" "+template).trim()
  
    //}//END OF BIG IF
  }

  saveUpdateTemplate(template){
    fs.writeFile('sparqlupdate.txt', template, function (err) {
      if (err) return console.log(err);
      console.log('FILE SAVED');
    });
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


  //===================== MULTIPLE FORCED BINDINGS ==============================
  _hasMultipleBindings(bindings){
    var result=false;
    Object.keys(bindings).forEach(k=>{ 
      if(bindings[k].value instanceof Array){ result=true } 
    })
    return result;
  }


  _splitBindingsTypes(bindings){
    var singleBindings={};
    var multipleBindings={};

    Object.keys(bindings).forEach(k=>{ 
      if(bindings[k].value instanceof Array){
        multipleBindings[k]=bindings[k];
      }else{
        singleBindings[k]=bindings[k];
      }
    })

    return {
      singleBindings: singleBindings,
      multipleBindings: multipleBindings
    };
  }

  _validateBindings(multipleBindings){
    var res=true;
    var dim;
    Object.keys(multipleBindings).forEach(k=>{
      if(dim!=undefined){
        if(multipleBindings[k].value.length!=dim){
          res=false;
        }
      }else{
        dim=multipleBindings[k].value.length;
      }
      //console.log(dim)
    })
    return res;
  }


  _handleMultipleBindings(template,bindings,singleBindings,real_limit){
    //console.log("# MULTIPLE BINDINGS IN UPDATE DETECTED #")
    //console.log(">> Template:\n"+template)
    //----CREATE VALUES TEMPLATE--------------
    const valuesTemplate = {
      body: [],
      vars : []
    }
    Object.keys(bindings).forEach(k=>{
      valuesTemplate.vars.push("?"+k)

      //aggiungi <> o "'" al valore del binding (es. "'"Greg"'")
      let values = bindings[k].value.map((val)=>{
        return this._transformValue({ value: val, type: bindings[k].type})
      })

      const index = valuesTemplate.vars.length -1
      for (let i = 0; i < values.length; i++) {
        if (!valuesTemplate.body[i]) valuesTemplate.body[i] = [];

        valuesTemplate.body[i][index] = values[i]
      }
    })
    var Ndupes=valuesTemplate.body.length;
    //console.log(">> Values template initialized:")
    //console.log(valuesTemplate)

    //var templateArr=template.split(" ")

    //console.log(templateArr)

    
    //-----FINITE STATE MACHINE---------------
    //var open_brackets=0;
    var state="init";
    var char=""
    var newTemplate="";
    var string="";
    var memStrings=[];
    var dupeString=[];
    var nDupedStrings=0
    //console.log("\n# FINITE STATE MACHINE STARTING #")
    for(var i=0; i<template.length; i++){
      //console.log(`STATE(ck#${i}/${template.length-1}): ${state}`) //log state information
      char=template.charAt(i);
      newTemplate=newTemplate+char; //start building output query

      switch (state) {
        //==== INIT STATE====
        case "init":
          string="";//RESET STRING
          if(char=="{"){state="open_bracket"}
          break;


        //==== OPEN BRACKET STATE ====
        case "open_bracket": //salva caratteri della stringa
          if(char=="{"){//another open bracket
            state="double_open_bracket"
          }else if(char=="}"){//on closed bracket
            state="closed_bracket"
          }else{
            state="open_bracket"
            string=string+char; //comincia a salvare i caratteri dentro la graffa
          }
          break;


        //==== CLOSED BRACKET STATE ====
        case "closed_bracket":
          //console.log(`[ STATE: CLOSED BRACKET n${nDupedStrings}]`)
          //console.log("> string to analyze:\n"+string)
          memStrings[nDupedStrings]=string;
          dupeString[nDupedStrings]="";
          //console.log(Ndupes)
          //newTemplate=this._onClosedBracket(valuesTemplate,string,newTemplate,singleBindings)
          //dupeString[nDupedStrings]=this._onClosedBracket(valuesTemplate,memStrings[nDupedStrings],newTemplate,singleBindings)
          //newTemplate=newTemplate.replace(memStrings[nDupedStrings],dupeString[nDupedStrings])
          
          nDupedStrings++
          state="init"
          break;


        //==== DOUBLE OPEN BRACKET STATE ====
        case "double_open_bracket":
          //console.log("string to analyze: "+string)
          if(string.includes("GRAPH")){
            //console.log("graph found!")
          }
          string=char;//RESET STRING
          state="open_bracket"
          break;
      
        default:
          break;
      }
    }


    //MEMORY CHECK
    //console.log("### [4] MEMORY CHECK FOR SPLIT UPDATE ###")
    var total_length;
    //var real_limit= this.maxUpdateChars-prefixes.length;
    var updatesTemplates=[];
    var string=[]
    var updateNumber=0;
    for(var line=0;line<Ndupes;line++){
      //console.log("---------- LINE "+line+"------------")
      total_length=0;
      var tempDupeString=[];
      for(var dupeIndex=0; dupeIndex<nDupedStrings;dupeIndex++){
        //console.log("> string to dupe:\n"+memStrings[dupeIndex])
        //INIZIALIZZATO CON STRINGHE VUOTE NELLA RETE SEQUENZIALE
        string[dupeIndex]=this._onClosedBracket(line,valuesTemplate,memStrings[dupeIndex],singleBindings)
        tempDupeString[dupeIndex]=dupeString[dupeIndex]+string[dupeIndex]
        //console.log("> duped string:\n"+dupeString[dupeIndex])
        total_length=total_length+tempDupeString[dupeIndex].length
      }

      //console.log(">>> LENGTH: "+total_length)
      if(total_length>real_limit){
        updatesTemplates[updateNumber]=template;
        for(var index=0;index<nDupedStrings;index++){
          updatesTemplates[updateNumber]=updatesTemplates[updateNumber].replace(memStrings[index],dupeString[index])
          dupeString[index]=string[index];
        }
        updateNumber++
        if(Ndupes-line==1){//if last cycle
          for(var index=0;index<nDupedStrings;index++){
            updatesTemplates[updateNumber]=updatesTemplates[updateNumber].replace(memStrings[index],dupeString[index])
          }
        }
      }else{

        for(var index=0;index<nDupedStrings;index++){
          dupeString[index]=tempDupeString[index]
        }
        if(Ndupes-line==1){
          updatesTemplates[updateNumber]=template;
          for(var index=0;index<nDupedStrings;index++){
            updatesTemplates[updateNumber]=updatesTemplates[updateNumber].replace(memStrings[index],dupeString[index])
          }
          updateNumber++
        }
      }
    }

    if(updateNumber==0){
      updatesTemplates[updateNumber]=template;
      for(var index=0;index<nDupedStrings;index++){
        updatesTemplates[updateNumber]=updatesTemplates[updateNumber].replace(memStrings[index],dupeString[index])
        dupeString[index]="";
      }      
    }

    /*
    console.log("######################################")
    for(var jj=0;jj<updatesTemplates.length;jj++){
      console.log(updatesTemplates[jj])
    }   
    */ 

    return updatesTemplates
    //console.log(template)
    //console.log("==========================")
    //console.log(newTemplate)
    //throw new Error("MAO")
    //return newTemplate
  }

  _onClosedBracket(j,valuesTemplate,string,singleBindings){
    //var Ndupes=valuesTemplate.body.length;
    var detector=0;
    var currLineBindingsIndexes=[];
    var arrCounter=0;
    var counter=0;
    Object.keys(valuesTemplate.vars).forEach(k=>{
      //console.log(valuesTemplate.vars[k])
      if(string.includes(valuesTemplate.vars[k])){
        //console.log("FOUND MULT BINDING: "+valuesTemplate.vars[k])
        currLineBindingsIndexes[arrCounter]=k;
        arrCounter++
        detector=1;
      }
      counter++
    })


    if(detector==1){
      var benchString=string.trim();
      //console.log(`MULT BINDINGS SLICE: ${currLineBindingsIndexes}`)
      //appendi il punto se manca(manca il trim!)
      if(!benchString.endsWith(".")){
        benchString=benchString+" ."
        //console.log(benchString)
      }

      //per ogni cella dell'array dei bindings, duplica e sostituisci variabili
      var dupeString="";
      //for(var j=0;j<Ndupes; j++){
      //var j=0;
        var lineToAdd=benchString;
        Object.keys(currLineBindingsIndexes).forEach(k=>{
          var currIndex=currLineBindingsIndexes[k];
          var variable=valuesTemplate.vars[currIndex];
          var varValue=valuesTemplate.body[j][currIndex];
          //console.log(`${variable}: ${varValue}`)
          lineToAdd=lineToAdd.replace(variable,varValue);
        });
        //I BLANK NODE VANNO CHIAMATI CON GLI INDICI
        //ANCHE LE VARIABILI RIMASTE NON MAPPATE NOOOOOOOO ASPE, DEVI CONFRONTARE PRIMA SE NON SONO SINGLE BINDINGS
        var temp=lineToAdd.split(" ");
        //console.log(temp)
        for(var key in temp){
          if(temp[key].includes("_:")){
            //console.log("bnode detected")
            temp[key]=temp[key].replace(temp[key],temp[key]+"_"+j)
          }else if(temp[key].includes("?")){
            //console.log("---------analyzing key--------")
            //console.log(temp[key])
            //console.log("> starting loop")
            var isSingleBinding=false;
            Object.keys(singleBindings).forEach(singleBinding=>{
              singleBinding="?"+singleBinding;
              //console.log(singleBinding)
              if(temp[key].includes(singleBinding)){//SE VERO ALLORA E' UN SINGLE BINDING
                isSingleBinding=true;
                //console.log("single binding found")
              }
            })
            if(!isSingleBinding){
              //console.log("Multiple binding, replace")
              temp[key]=temp[key].replace(temp[key],temp[key]+"_"+j)
            }
            
          }
        }
        lineToAdd=temp.join(" ")
        //console.log(lineToAdd)

        dupeString=dupeString+" "+lineToAdd;
      //}
      //console.log(dupeString)
      //newTemplate=newTemplate.replace(string,dupeString)
      return dupeString//newTemplate.replace(string,dupeString)

      
    }else{console.log("NO MULT BINDING DETCTED")}
  }

}








module.exports = SPARQLbench;