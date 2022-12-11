
class Porcodio{

    constructor(){}

    async start(){
        var out=await this.runPythonApp("./test.py","{ ciao:mao }")
        console.log(out)
    }
    
    runPythonApp(script,arg){
        const { spawn } = require('child_process');
        
        return new Promise(resolve=>{
            var string=""
            const python = spawn("python",[script,arg])
            python.stdout.on("data",(chunk)=>{
                string=string+chunk;
                //console.log(chunk)
            })
            python.stdout.on("close", (code)=>{
                resolve(string)
            })
        })
    }

}

var p=new Porcodio()
p.start()


