const EventEmitter = require("events").EventEmitter
const WebSocket = require("isomorphic-ws")

class Connection extends EventEmitter {

    constructor(websocket) {
        super()
        this.ws = websocket
        this.__connectedClients = 0
    }

    notificationStream(request) {
        let json = JSON.stringify(request)
        //Wait next tick to send subscriptions and let the client
        //subscribe to the notifications
        process.nextTick((() => {
            if (this.ws.readyState === WebSocket.CONNECTING) {
                let callback = (() => {
                    this.ws.removeEventListener("open", callback)
                    this.ws.send(json)
                }).bind(this)

                this.ws.addEventListener("open", callback)
            } else {
                this.ws.send(json)
            }
        }).bind(this))

        return new NotificationStream(this,request.subscribe.alias)
    }
    
    get connectedClients() {
        return this._connectedClients
    }
    
    set _connectedClients(value){
        this.__connectedClients = value
        if(value <= 0){
            this.emit("close")
            this.ws.close()
        }
    }

    get _connectedClients ()  {
        return this.__connectedClients
    }

}

class NotificationStream extends EventEmitter{

    constructor(connection,alias) {
        super()
        this.ws = connection.ws
        this.alias = alias
       
        this._connection = connection   
        this._connection._connectedClients++
        
        this._dataHandler = data => {
            try {
                data = JSON.parse(data.data)
                data["toString"] = () => { return JSON.stringify(data) }

                if (data.notification &&
                    data.notification.alias &&
                    data.notification.alias === this.alias) {
                    this.spuid = data.notification.spuid
                }

                if ((data.error && data.alias === alias) ||
                    (data.notification && data.notification.spuid === this.spuid) ||
                    (data.unsubscribed && data.unsubscribed.spuid === this.spuid)) {
                    this.emit("notification", data)
                }
            } catch (error) {
                this.emit("error",error)   
            }
        }

        this._errorHandler = this.emit.bind(this, "error")
        
        this.ws.addEventListener("message", this._dataHandler)

        this.ws.addEventListener("error", this._errorHandler)
    }

    send(data){
        //TODO: test send
        this.ws.send(JSON.stringify(data))
    }
    
    close(){
        this.ws.removeEventListener("error", this._errorHandler)
        this.ws.removeEventListener("message", this._dataHandler)
        this._connection._connectedClients--
    }

}

module.exports = Connection