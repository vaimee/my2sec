var Consumer=require('../Consumer');
const EventEmitter = require("events").EventEmitter

class UserActivityTypesConsumer extends Consumer{
    constructor(jsap,email){
        super(jsap,"OVERRIDE_USER_ACTIVITY_TYPES",{
            usergraph:"http://www.vaimee.it/my2sec/"+email
        },false)

        this.notificationEm=new EventEmitter();

    }

    //@OVERRIDE
    onFirstResults(not){
        console.log("MAo")
        this.notificationEm.emit("firstResults",not);
    }
    //@OVERRIDE
    onAddedResults(not){
        console.log("Mao")
        this.notificationEm.emit("addedResults",not);
    }

}

module.exports=UserActivityTypesConsumer