class AwMessagesProducer extends Producer{
    constructor(jsap,userEmail){
        super(jsap,"SEND_MESSAGE")
        this.userEmail=userEmail;
        if(this.userEmail==null||this.userEmail==undefined){throw new Error("UserEmail cannot be null")}
    }

    async send_messages_to_sepa(rawEvents){
        var messageGraph= "http://www.vaimee.it/my2sec/messages/activitywatch";
        var userGraph="http://www.vaimee.it/my2sec/"+this.userEmail;
        for(var k in rawEvents){
            var timestamp=this.get_current_timestamp()
            var msgValue=rawEvents[k];
            //Construct Binding
            var binding={
                message_graph: messageGraph,
                usergraph: userGraph,
                source: "http://www.vaimee.it/sources/"+k,
                msgtimestamp: timestamp,
                msgvalue: msgValue
            }
            this.log.debug(binding)
            //SEND MESSAGE
            await this.updateSepa(binding);
        }
        return true
    }

    get_current_timestamp(){
        const date=new Date();
        var string_timestamp=date.toISOString()
        return string_timestamp
    }//get_current_timestamp()


}




/**
 *         this.awMessagesProducer=new SynchronousProducer(
            jsap_file,
            "SEND_MESSAGE",
            "http://www.vaimee.it/my2sec/awproducerflag"
        );
 */