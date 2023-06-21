class MongoDbClient {
    constructor(jsap){
        this.router_url=jsap.extended.AwProducer.endpoints.MongoDbRouter
        this.config={
            headers:{
                'Content-Type': 'application/json'
            }
        }
    }

    async test_datasource(){
        var res=false
        try{
            await this.ping()
            res=true;
        }catch(e){
            res=false
        }
        return res;
    }
    async ping(){
        var path="/mongodb/api";
		var res = await axios.get(this.router_url+path,this.config)
        return res.data
    }

    async insertManyFiles(fileArr){
        if(!fileArr){throw new Error("FileArr cannot be null")}
        var path="/mongodb/api/insertMany";
        try{
            const result = await axios.post(this.router_url+path,fileArr,this.config);
            //console.log(file);
            return result.data;           
        }catch(e){
            console.log(e);
        }
    }

    async insertFile(file){
        if(!file){throw new Error("File cannot be null")}
        var path="/mongodb/api/insert";
        try{
            const result = await axios.post(this.router_url+path,file,this.config);
            //console.log(file);
            return result.data;           
        }catch(e){
            console.log(e);
        } 
    }


    async deleteFileByObjectId(id){
        throw new Error("Not implemented yet")
    }

    async getFileByObjectId(id){
        throw new Error("Not implemented yet")
    }

    async getFile(query,options){
        throw new Error("Not implemented yet")
    }


}