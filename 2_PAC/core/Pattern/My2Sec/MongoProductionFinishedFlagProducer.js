const Producer= require("../Producer")
class MongoProductionFinishedFlagProducer extends Producer{
    constructor(jsap,userEmail){
        super(jsap,"SET_SYNCHRONIZATION_FLAG")
        if(userEmail==null||userEmail==undefined){throw new Error("User Email must be specified")}
        this.flag_type="http://www.vaimee.it/my2sec/awmongoproducerflag";
        this.usergraph="http://www.vaimee.it/my2sec/"+userEmail;
    }

    //@override
    async updateSepa(){
        var binding={
            flag_type:this.flag_type,
            usergraph:this.usergraph
        }
        var res=await super.updateSepa(binding);
        return res;
    }
}

module.exports= MongoProductionFinishedFlagProducer