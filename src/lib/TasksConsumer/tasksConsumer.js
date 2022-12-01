class TasksConsumer{
    constructor(){
        this.sepaClient= new Sepajs.SEPA(default_jsap)
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
    generateTaskCell(cell_number){
        return `
        <div class="task-cell" id="task-cell_${cell_number}">
            <div class="task_title">
                - TASK n° ${cell_number}
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