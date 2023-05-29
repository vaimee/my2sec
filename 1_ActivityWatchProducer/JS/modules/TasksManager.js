class TasksManager{
    constructor(jsap,email){
        this.log=new GregLogs();
        //this.queryBenchClient= new Sepajs.SEPA(jsap)
        //this.sepaClient= new JsapApi(jsap)
        //this.sub;
        //this.tasksCache=[]
        this.email=email;
        console.log(email)
        
        this.tasksConsumer=new TasksConsumer(jsap,email)
        this.tasksConsumer.em.addEventListener("addedResultsToCache",not=>{
            this.log.debug("Received new tasks")
            //this.log.trace(this.tasksConsumer.get_cache())
            this.printTasksCache(this.tasksConsumer.get_cache());
        })

        this.tasksConsumer.em.addEventListener("removedResultsFromCache",not=>{
            this.log.debug("Received new removed tasks")
            this.printTasksCache(this.tasksConsumer.get_cache());
        })
    }

    start(){
        this.tasksConsumer.subscribeToSepa();
    }

    get_tasks_consumer(){
        return this.tasksConsumer
    }

    printTasksCache(bindings){
        //this.log.debug("RECEIVED BINDINGS")
        //this.log.debug(bindings)
        var taskContainer=document.getElementById("task-wrapper");
        taskContainer.innerHTML="";
        for(var i=0; i<bindings.length; i++){
            //PRINT NEW TASK
            try{
                this.log.trace(bindings[i])
                var taskName=bindings[i].tasktitle.split("#")[1]
                //bindings[i].tasktitle=splitTask[1];
                taskContainer.innerHTML=taskContainer.innerHTML+this.generateTaskCell(i,bindings[i].taskid,taskName,bindings[i].spent_time)
            }catch(e){
                this.log.error(e)
            }
        }
        this.log.trace("--------------------------------------------------")
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
    generateTaskCell(cell_number,taskid,tasktitle,spent_time){
        
        var spent_time_formatted=this.format_spent_time(spent_time)

        return `
        <div class="task-cell" id="task-cell_${cell_number}">
            <div class="task_title">
                <b>${taskid}</b>: ${tasktitle} - ${spent_time_formatted}
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

    format_spent_time(openProjectSpentTime){
        var clean=openProjectSpentTime.slice(2)
        var splitArr=clean.split("M")
        if(splitArr.length==1){ //ci sono solo secondi
            return clean.slice(0,clean.length-1)+"s"
        }else{
            var seconds=splitArr[1] //trovati
            seconds=seconds.slice(0,seconds.length-1)
            var chunk=splitArr[0]

            var splitChunk=chunk.split("H")
            if(splitChunk.length==1){ //non ci sono ore
                var minutes=chunk;
                return minutes+"m "+seconds+"s"
            }else{
                var minutes=splitChunk[1];
                var hours=splitChunk[0];
                return hours+"h "+minutes+"m"
            }

        }

    }


}