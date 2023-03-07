var bugReportPanelShown=false;
var bugReportPanel=document.getElementById("bug-report-panel");
function onBugReportClick(){
    if(!bugReportPanelShown){
        bugReportPanelShown=true
        bugReportPanel.style.display="block"
    }else{
        bugReportPanelShown=false
        bugReportPanel.style.display="none"
    }
}
async function send_bug_report(){
    console.log("############################")
    console.log("STARTED BUG REPORT PROCEDURE")


    var form=document.getElementById("bug-report-form")
    var msgGraph="http://www.vaimee.it/my2sec/messages/bugreports"
    var msgSource="http://www.vaimee.it/sources/activitywatchproducer"
    var msgType=form["bug-type"].value;
    var msgValue=form["Message"].value;
    //var includeEmail=form["bug-report-include-email"]//.value

    //var checkedValue = document.querySelector('.form-control-bug-report-include-email:checked').value;
    //console.log(checkedValue)
    msgValue=msgValue.replace(/\\/g,"\\\\");//PRIMA LE DOPPIE SBARRE
    msgValue=msgValue.replace(/\'/g,"\\\'"); //POI GLI ASTERISCHI

    var msgBindings={
        message_graph: msgGraph,
        bug_type:msgType,
        usergraph: "http://www.vaimee.it/my2sec/defuser@vaimee.it",
        source: msgSource,
        msgvalue: msgValue
    }



    var msgString=`
    INSERT { 
        GRAPH <${msgBindings.message_graph}> {
            ?b rdf:type my2sec:Message ;
                rdf:type my2sec:${msgBindings.bug_type} ;
                my2sec:hasMember <${msgBindings.usergraph}> ;
                my2sec:messageValue '''${msgBindings.msgvalue}''';
                my2sec:messageSource <${msgSource}> ;
                time:inXSDDateTimeStamp ?now
        }
    } WHERE {
        BIND(UUID() AS ?b)
        BIND(NOW() AS ?now)
    }    
    `
    var prefixes=`
    PREFIX rdf:<http://www.w3.org/1999/02/22-rdf-syntax-ns#> 
    PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> 
    PREFIX xsd:<http://www.w3.org/2001/XMLSchema#> 
    PREFIX owl:<http://www.w3.org/2002/07/owl#> 
    PREFIX time:<http://www.w3.org/2006/time#> 
    PREFIX my2sec:<http://www.vaimee.it/ontology/my2sec#> 
    `

    var data=prefixes+" "+msgString;
    console.log(data)


    console.log(default_jsap)
    var client=new Sepajs.SEPA(default_jsap);
    var res;

    try{
        res=await client.update(data,{
            sparql11protocol:{
                port:8550
            }
        });
    }catch(e){
        console.log(e)
    }

    console.log(res)

}

function get_custom_jsap(){

}