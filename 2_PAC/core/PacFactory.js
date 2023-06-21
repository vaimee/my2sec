'use-strict';
const express = require('express')
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
const JsapApi = require('@arces-wot/sepa-js').Jsap//jsap api
const SEPA =  require('@arces-wot/sepa-js').SEPA//querybench
var AdminKeycloakClient = require('./clients/keycloak_client.js')
var GregLogs = require("../utils/GregLogs.js")
var mysql= require('mysql');
var fs = require('fs');
//var events=require("events")
/*#################################
# PacFactory JS
# Author: Gregorio Monari
# Date: 7/11/2022
##################################*/

module.exports = class PacFactory extends JsapApi {
  constructor(jsap) {
    super(jsap);
    //SUBSCRIPTIONS ARRAY
    this._SUBARR=[]
    //INIT CLIENTS
    this.basicSepaClient=new SEPA(jsap);//querybench client, for static queries
    this.app = express(); //RECEIVE REQUESTS
    this.httpClient=new AdminKeycloakClient() //MAKE REQUESTS
    //FINISH
    this.log= new GregLogs();
    //this.log.info("New Pac module created!");
  }


  getSubArr(){
    return this._SUBARR
  }

  exit(){
    //process.exit()
    for(var i in this._SUBARR){
      this._SUBARR[i].unsubscribe()
    }
    this._SUBARR=[]
    this.log.info("CLOSED ALL SUBSCRIPTIONS")
  }

  //=============SEPA CLIENT=============
  async testSepaSource(){
    var queryRes=await this.rawQuery('select * where {graph <http://www.vaimee.it/testing/'+this.testingGraphName+'> {?s ?p ?o} }');
    this.log.info("Connected to Sepa")
  }


  async subscribeAndNotify(queryname,data,added,first,removed,error){
    var firstResults=true;
    var sub = this[queryname](data);
    sub.on("subscription",console.log)
    sub.on("notification",async (not)=>{
      //console.log("NOTIFICATION RECEIVED")
      if(!firstResults){
        //If removed results are present, call remove first
        if(this._isRemovedResults(not)){
          const bindings=this.extractRemovedResultsBindings(not);
          this.log.trace(`### ${queryname}: removed results received (${bindings.length}) ###`)
          for(var i=0;i<bindings.length;i++){
            try{
              await this[removed](bindings[i]);
            }catch(e){console.log(e)}
          }
        }
        //console.log(not)
        const bindings=this.extractAddedResultsBindings(not);
        this.log.trace(`### ${queryname}: added results received (${bindings.length}) ###`)
        for(var i=0;i<bindings.length;i++){
          await this[added](bindings[i]);
        }
      }else{
        //console.log("Reading first results")
        firstResults=false;
        var bindings=this.extractAddedResultsBindings(not);
        //this.saveUpdateTemplate(JSON.stringify(not))
        this.log.trace(`### ${queryname}: first results received (${bindings.length}) ###`)
        for(var i=0;i<bindings.length;i++){
          try{
            this[first](bindings[i]);
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

  newSubRouter(queryname,data,callback,ignore_first_results){
    var firstResults=true;
    if(ignore_first_results==true){
      firstResults=false;
    }
    var sub = this[queryname](data);
    sub.on("subscription",console.log)
    sub.on("notification",not=>{
      if(!firstResults){
        if(!this._isRemovedResults(not)){
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




  //==================EXPRESS ROUTERS======================
  newGetRouter(path,callback){
    this.app.get(path, jsonParser, (req, res) => {
      this[callback]({req:req,res:res})
    });
    this.log.info("GET Router initialized ("+path+")")
  }

  newPostRouter(path,callback){
    this.app.post(path, jsonParser, (req, res) => {
      this[callback]({req:req,res:res})
    });
    this.log.info("POST Router initialized ("+path+")")
  }

  newDeleteRouter(path,callback){
    this.app.delete(path, jsonParser, (req, res) => {
      this[callback]({req:req,res:res})
    });
    this.log.info("DELETE Router initialized ("+path+")")
  }

  //listen to requests es.1357
  listen(node_port){
    this.app.listen(node_port, () => {
      this.log.info('Listening from port: '+node_port);
    });
  }







  //==============================================UTILITY==============================================
  saveUpdateTemplate(template){
    fs.writeFile('sparqlupdate.txt', template, function (err) {
      if (err) return console.log(err);
      console.log('FILE SAVED');
    });
  }


  _isRemovedResults(not){
    //var AddL=not.addedResults.results.bindings.length;
    var RemL=not.removedResults.results.bindings.length;
    if(RemL!=0){
      return true
    }else{
      return false
    }
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

  debugTableSlice(data,limit){
    console.warning("DEPRECATED,WILL SOON BE REMOVED")
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


  //!DEPRECATED
  sparqlQuery(queryname,data){
    console.warning("sparql query method is deprecated, will soon be removed")
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
}//---------------------------------------------------------END OF PAC FACTORY-----------------------------------------------------