/*#################################
# PacFactory JS
# Author: Gregorio Monari
# Date: 7/11/2022
##################################*/

class PacFactory extends Sepajs.Jsap {
  constructor(jsap) {
    //TITLE
    //console.log("||============================||");
    super(jsap);
    //SUBSCRIPTIONS ARRAY
    this._SUBARR=[]
    //INIT CLIENTS
    this.basicSepaClient=new Sepajs.SEPA(jsap);//static queries
    //this.app = express(); //RECEIVE REQUESTS
    //this.httpClient=new AdminKeycloakClient() //MAKE REQUESTS
    //this.sqlClient;//SQL CLIENT, INITIALIZE ONLY IF REQUESTED
    //FINISH
    this.log= new GregLogs();
    //this.testingGraphName="";
    //this.log.info("New Pac module created!");
  }

  exit(){
    //process.exit()
    for(var i in this._SUBARR){
      this._SUBARR[i].unsubscribe()
    }
  }

  getSubArr(){
    return this._SUBARR
  }



  //=============SEPA CLIENT=============
  async testSepaSource(){
    var queryRes=await this.rawQuery('select * where {graph <http://www.vaimee.it/testing/'+this.testingGraphName+'> {?s ?p ?o} }');
    this.log.info("Connected to Sepa")
  }
  /*
  sparqlUpdate(queryname,data){
    return new Promise(resolve=>{
      this[queryname](data)
        .then((res)=>{
          this.log.debug("Response: "+JSON.stringify(res))
          resolve(res)
        });
    })
  }
  */

  //!NON SERVE PIU'
  /**
   * Query sepa with QueryBench, merging sparql with bindings
   * @param {*} querytext 
   * @param {*} bindings 
   */
  /* NON SERVE
  async querySepaWithBench(querytext,bindings){
    //const bench= new Sepajs.bench();
    var query=this.bench.sparql(querytext,bindings)
    var res=await this.query(query);
    var cleanRes=this.extractResultsBindings(res);
    return cleanRes
  }
  */


  //!DEPRECATED
  sparqlQuery(queryname,data){
    return new Promise(resolve=>{
      var sub =this[queryname](data);
      sub.on("notification",not=>{
        sub.unsubscribe();
        //this.log.debug("# Notification Received! (id: \""+queryname+"\") #");
        var bindings=this.extractAddedResultsBindings(not);
        resolve(bindings);
      });
    })
  }

  
  
  subscribeAndNotify(queryname,data,added,first,removed,error){
    var firstResults=true;
    var sub = this[queryname](data);
    sub.on("subscription",console.log)
    sub.on("notification",not=>{
      //console.log("NOTIFICATION RECEIVED")
      if(!firstResults){
        if(!this._isRemovedResults(not)){
          //console.log(not)
          const bindings=this.extractAddedResultsBindings(not);
          this.log.trace(`### ${queryname}: added results received (${bindings.length}) ###`)
          for(var i=0;i<bindings.length;i++){
            this[added](bindings[i]);
          }
        }else{
          const bindings=this.extractRemovedResultsBindings(not);
          this.log.trace(`### ${queryname}: removed results received (${bindings.length}) ###`)
          for(var i=0;i<bindings.length;i++){
            try{
              this[removed](bindings[i]);
            }catch(e){console.log(e)}
          }
        }
      }else{
        firstResults=false;
        const bindings=this.extractAddedResultsBindings(not);
        //this.saveUpdateTemplate(JSON.stringify(not))
        this.log.trace(`### ${queryname}: first results received (${bindings.length}) ###`)
        for(var i=0;i<bindings.length;i++){
          try{
            this.log.trace("**Notifying first result "+i+":")
            const binding=bindings[i]
            //console.log(binding)
            
            this[first](binding);
          }catch(e){console.log(e)}
        }
      }
    });
    sub.on("error",err=>{
      this[error](err);
    });
    this._SUBARR.push(sub)
    this.log.info("Sub and Notify Router initialized ("+queryname+")")
  }


  newSubRouter(queryname,data,callback){
    var firstResults=true;
    //var firstResults=true;
    var sub = this[queryname](data);
    sub.on("subscription",console.log)
    sub.on("notification",not=>{
      //console.log("ORCODIO")
      if(!firstResults){
        if(!this._isRemovedResults(not)){
          //console.log(not)
          var bindings=this.extractAddedResultsBindings(not);
          this.log.trace(`### ${queryname}: added results received (${bindings.length}) ###`)
          for(var i=0;i<bindings.length;i++){
            this[callback](bindings[i]);
          }
        }else{
          this.log.warning("Ignored removed results")
        }
      }else{
        firstResults=false;
        
        var bindings=this.extractAddedResultsBindings(not);
        //this.saveUpdateTemplate(JSON.stringify(not))
        this.log.trace(`### ${queryname}: first results received (${bindings.length}) ###`)
        for(var i=0;i<bindings.length;i++){
          this[callback](bindings[i]);
        }
      }
    });
    this._SUBARR.push(sub)
    this.log.info("Sub Router initialized ("+queryname+")")
  }



  _isRemovedResults(not){
    var AddL=not.addedResults.results.bindings.length;
    var RemL=not.removedResults.results.bindings.length;
    if(AddL==0 && RemL!=0){
      return true
    }else{
      return false
    }
  }

  debugTableSlice(data,limit){
    this.log.debug(`Showing ${limit} of ${data.length} rows:`)
    console.table(data.slice(0,limit))
  }
  extractAddedResultsBindings(subRes){
    var rawBindings=subRes.addedResults.results.bindings;
    //console.log(rawBindings)
    var bindings=[];
    var rawCell={};
    var cell={};
    Object.keys(rawBindings).forEach(k => {
      //cell={}
      rawCell=rawBindings[k];//extract single rawcell
      Object.keys(rawCell).forEach(field=>{
        cell[field]=rawCell[field].value;
      });
      bindings[k]=cell;//assign cell to bindings array
      cell={};
      rawCell={};
    });
    return bindings
  }
  extractRemovedResultsBindings(subRes){
    var rawBindings=subRes.removedResults.results.bindings;
    var bindings=[];
    var rawCell={};
    var cell={};
    Object.keys(rawBindings).forEach(k => {
      rawCell=rawBindings[k];//extract single rawcell
      Object.keys(rawCell).forEach(field=>{
        cell[field]=rawCell[field].value;
      });
      bindings[k]=cell;//assign cell to bindings array
      cell={};
      rawCell={};
    });
    return bindings
  }
  extractResultsBindings(queryRes){
    var rawBindings=queryRes.results.bindings;
    var bindings=[];
    var rawCell={};
    var cell={};
    Object.keys(rawBindings).forEach(k => {
      rawCell=rawBindings[k];//extract single rawcell
      Object.keys(rawCell).forEach(field=>{
        cell[field]=rawCell[field].value;
      });
      bindings[k]=cell;//assign cell to bindings array
      cell={};
      rawCell={};
    });
    return bindings
  }

  rawUpdate(updatetext){
    //console.log(updatetext)
    
    return new Promise(resolve=>{
      this.basicSepaClient.update(updatetext)
          .then((res)=>{
            resolve(res)
          })
    })
  }
  rawQuery(querytext){
    return new Promise(resolve=>{
      this.basicSepaClient.query(querytext)
          .then((res)=>{
            resolve(res)
          })
    })
  }
}//---------------------------------------------------------END OF PAC FACTORY-----------------------------------------------------




















/*
let client = new JsapApi(jsap);
//let client = new SEPA(jsap)
//create express app
const app = express()
// create application/json parser
var jsonParser = bodyParser.json()

console.log("AVVIO SERVER NODE...")

var _PathRoot="/api/keycloak/webhook"
// POST method route
app.get(_PathRoot+'/helloproducer', (req, res) => {
  console.log("[INFO] RICHIESTA DI HELLO RICEVUTA!")
  console.log("[INFOR] invio risposta: HELLO!")
  console.log("----------------------------------------------")
  res.send('HELLO!')
})


app.post(_PathRoot+'/signalnewevent', jsonParser, (request, response) => {
  console.log("[INFO] NUOVO SEGNALE WEBHOOK RICEVUTO")
  //console.log(JSON.stringify(request.body))
  if(request.body.hasOwnProperty("webhook_event_package")){
    console.log("[INFO] Json validato, invio risposta di confermata ricezione al server")
    response.send('GOOD STRUCTURED REQUEST RECEIVED')
    //SE SIAMO QUI ALLORA POSSIAMO COMINCIARE IL PARSING
    console.log("[INFO] Inizio procedura di gestione del segnale")
    handleSignal(request.body);

  }else{
    console.log("[INFO] Json errato, invio risposta negativa al server")
    response.send('ERROR: JSON SCHEMA UNKNOWN')
  }


  console.log("----------------------------------------------")
})






//IN INGRESSO PRENDE GIA' UN OGGETTO JSON, C'E' IL BODYPARSER
function handleSignal(data){
  var timestamp=data.webhook_event_package.timestamp;
  data={
    source: "<http://www.vaimee.it/sources/keycloak>",
    msgtimestamp:timestamp,
    msgvalue:data
  }
  console.log("[INFO] Constructed forced bindings, ready to update data: ")
  console.log(data)
  
  client.SEND_KEYCLOAK_MESSAGE(data).then(res=>{
    console.log("Update response: " + res)
  })
  
}





//LISTEN TO REQUESTS
app.listen(1357, () => {
    console.log('Sto ascoltando dalla porta 1357');
    console.log("----------------------------------------------")
});
*/







