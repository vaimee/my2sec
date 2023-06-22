const Consumer = require("../Consumer")

class UsersConsumer extends Consumer{
    constructor(jsap){
        super(jsap,"ALL_USERNAMES",{})
    }
}

module.exports= UsersConsumer