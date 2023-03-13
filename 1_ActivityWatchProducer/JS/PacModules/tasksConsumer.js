class TasksConsumer{
    constructor(jsap,email){
        var log=new Greglogs();
        this.queryBenchClient= new Sepajs.SEPA(jsap)
        this.sepaClient= new JsapApi(jsap)
        this.sub;
        this.tasksCache=[]
        this.email=email;
        console.log(email)
    }


    start(){
        this.sub= this.sepaClient.USER_TASKS({
            assignee:"http://www.vaimee.it/my2sec/"+this.email
        });
        this.sub.on("notification",not=>{
            console.log("RECEIVED TASK NOTIFICATION")
            var bindings=not.addedResults.results.bindings;
            console.log(bindings)
            for(var i in bindings){
                Object.keys(bindings[i]).forEach(k=>{
                    bindings[i][k]=bindings[i][k].value
                })
                this.tasksCache.push(bindings[i])
            }
            
            this.onNewTask(bindings)   
        });
    }

    onNewTask(bindings){
        console.log("RECEIVED BINDINGS")
        console.log(bindings)
        var taskContainer=document.getElementById("task-wrapper");
        taskContainer.innerHTML="";
        for(var i=0; i<bindings.length; i++){
            var splitTask=bindings[i].tasktitle.split("#")
            bindings[i].tasktitle=splitTask[1];
            taskContainer.innerHTML=taskContainer.innerHTML+this.generateTaskCell(i,bindings[i])
        }
    }



    stop(){

    }

    generate_project_container(element){
        for(var i=0;i<2;i++){

        }
    }


    generate_tasks_template(element){
        var taskContainer=document.getElementById(element);
        taskContainer.innerHTML="";
        for(var i=0; i<5; i++){
            taskContainer.innerHTML=taskContainer.innerHTML+this.generateTaskCell(i)
        }
    }

    generateProjectCell(cell_number){
        return `
        
        `
    }
    generateTaskCell(cell_number,binding){
        return `
        <div class="task-cell" id="task-cell_${cell_number}">
            <div class="task_title">
                - ${binding.tasktitle}: ${binding.spent_time}H
            </div>
            <div class="task-loading-wrapper">
                <div class="task-loading_box">
                    <div class="task-loading_bar" id="task-loading_bar_${cell_number}">
                    </div>
                </div>
            </div>
        </div>
        <br>
        `
    }


}