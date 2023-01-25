var GregLogs = require("../GregLogs.js")
var mysql= require('mysql');

class MysqlClient {
    constructor(){
        this.log= new GregLogs();
        this.log.loglevel=0;
        this.sqlClient;
        this.tableSchema;
        this.schemaDimensions;
    }


    //=====TABLES MANAGEMENT=====
    //schema es...: var sql = "CREATE TABLE "+table_name+" (datetime DATETIME(6), event_type VARCHAR(255), app_name VARCHAR(255), app_title VARCHAR(255), activity_type VARCHAR(255), task VARCHAR(255), duration DOUBLE )";
    async setTableSchema(schema){
        this.tableSchema=schema;
        var fields=schema.split(",")
        Object.keys(fields).forEach(k=>{
            fields[k]=fields[k].trim()
            fields[k]=fields[k].split(" ")

            //ORA ABBIAMO I FIELD BELLI
            if (fields[k][1].includes("(")){
                //FIXED DIMENSION
                var temp=fields[k][1].split("(");
                temp[1]=temp[1].slice(0,temp[1].length-1)
                fields[k][1]=temp[0]
                fields[k][2]=temp[1]
                console.log(temp)
            }else{
                //NO DIMENSION
                fields[k][2]="infinite"
            }

        })
        console.log(fields)

    }
    
    async createTable(name){
        try{
            var sql = "CREATE TABLE "+name+" ( "+this.tableSchema+" )";
            this.log.debug("COMMAND: "+sql)
            await this.rawSqlQuery(sql);
        }catch(e){
            //console.log(e);
        }
    }

    async inject(name,variables){
        var fields="";
        var values="";
        Object.keys(variables).forEach(k=>{
            fields=fields+k+", ";
            values=values+"\'"+variables[k]+"\', "
        })

        var lastFieldsComma=fields.lastIndexOf(",")
        var lastValuesComma=values.lastIndexOf(",")
        fields=fields.slice(0,lastFieldsComma)
        values=values.slice(0,lastValuesComma)

        var sql = `INSERT INTO ${name} ( ${fields} ) VALUES ( ${values} )`;
        this.log.trace("COMMAND: "+sql)
        var res=await this.rawSqlQuery(sql);
        return res;
    }




    connect(configuration){
        return new Promise(resolve=>{
            //TRY TO CONNECT TO MYSQL DATABASE
            this.sqlClient = mysql.createConnection({
              host: configuration.host,
              port: configuration.port,
              user: configuration.user,
              password: configuration.password,
              database: configuration.database,
            });
      
            this.sqlClient.connect(err=>{
              if(err){
                throw err;
              }else{
                this.log.info("Connected to MySql DB!")
                resolve("Connected")
              } 
            });
        });
    }


    async testDataSourceTable(table){
        var res=await this.rawSqlQuery("SELECT * FROM "+table+" LIMIT 5")
        console.log(res)
    }


    
    rawSqlQuery(querytext){
        return new Promise(resolve=>{
          this.sqlClient.query(querytext, function (err, result) {
            if (err){
                console.log(err)
            } 
            resolve(result);
          });
        });
    }


}

//testClass()
/*
async function testClass(){
    var client= new MysqlClient()
    await client.connect({
        host:"localhost",
        port:"3306",
        user:"root",
        password:"Gregnet/99",
        database:"TESTDB"
    })
    await client.testDataSourceTable("people")
    await client.setTableSchema("datetime DATETIME(6), event_type VARCHAR(255), app_name VARCHAR(255), app_title VARCHAR(255), activity_type VARCHAR(255), task VARCHAR(255), duration DOUBLE")
    await client.createTable("greg")
    await client.inject("greg",{
        datetime:"now",
        event_type:"sw:development",
        app_name:"mao",
        app_title:"maus",
        activity_type:"wow",
        task:"none",
        duration:"0"
    })
}
*/


module.exports = MysqlClient;