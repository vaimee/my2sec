const CachedConsumer = require("../CachedConsumer")

class TasksConsumer extends CachedConsumer{
    constructor(jsap,userEmail){
        var queryName="USER_TASKS"
        var bindings={
            assignee:"http://www.vaimee.it/my2sec/"+userEmail
        }
        super(jsap,queryName,bindings,false)
    }

    //@Override
    add_binding_to_cache(binding){
        //console.log(binding)
        if(!binding.hasOwnProperty("bnode")){throw new Error("Invalid task, missing bnode key")}
        if(!binding.hasOwnProperty("progetto")){throw new Error("Invalid task, missing project key")}
        if(!binding.hasOwnProperty("taskid")){throw new Error("Invalid task, missing taskid key")}
        if(!binding.hasOwnProperty("tasktitle")){throw new Error("Invalid task, missing tasktitle key")}
        if(!binding.hasOwnProperty("spent_time")){throw new Error("Invalid task, missing spent_time key")}
        if(binding["bnode"]==null || binding["bnode"]==undefined){throw new Error("Invalid task, missing bnode value")}
        if(binding["progetto"]==null || binding["progetto"]==undefined){throw new Error("Invalid task, missing project value")}
        if(binding["taskid"]==null || binding["taskid"]==undefined){throw new Error("Invalid task, missing taskid value")}
        if(binding["tasktitle"]==null || binding["tasktitle"]==undefined){throw new Error("Invalid task, missing tasktitle value")}
        if(binding["spent_time"]==null || binding["spent_time"]==undefined){throw new Error("Invalid task, missing spent_time value")}
        var newBinding={
            bnode:binding.bnode,
            progetto:binding.progetto,
            taskid:binding.taskid,
            tasktitle:binding.tasktitle,
            spent_time:binding.spent_time
        }
        super.add_binding_to_cache(newBinding)
    }


    //@Override
    remove_binding_from_cache(binding){
        if(!binding.hasOwnProperty("bnode")){throw new Error("Invalid task, missing bnode key")}
        if(!binding.hasOwnProperty("progetto")){throw new Error("Invalid task, missing project key")}
        if(!binding.hasOwnProperty("taskid")){throw new Error("Invalid task, missing taskid key")}
        if(!binding.hasOwnProperty("tasktitle")){throw new Error("Invalid task, missing tasktitle key")}
        if(!binding.hasOwnProperty("spent_time")){throw new Error("Invalid task, missing spent_time key")}
        if(binding["bnode"]==null || binding["bnode"]==undefined){throw new Error("Invalid task, missing bnode value")}
        if(binding["progetto"]==null || binding["progetto"]==undefined){throw new Error("Invalid task, missing project value")}
        if(binding["taskid"]==null || binding["taskid"]==undefined){throw new Error("Invalid task, missing taskid value")}
        if(binding["tasktitle"]==null || binding["tasktitle"]==undefined){throw new Error("Invalid task, missing tasktitle value")}
        if(binding["spent_time"]==null || binding["spent_time"]==undefined){throw new Error("Invalid task, missing spent_time value")}
        var newBinding={
            bnode:binding.bnode,
            progetto:binding.progetto,
            taskid:binding.taskid,
            tasktitle:binding.tasktitle,
            spent_time:binding.spent_time
        }
        super.remove_binding_from_cache(newBinding)
    }

}

module.exports=TasksConsumer