class LogTimesManager{
    constructor(jsap,userEmail,tasksConsumer){
        this.log=new GregLogs()
		this.logTimesConsumer= new LogTimesConsumer(jsap,userEmail);
		this.tasksConsumer=tasksConsumer;
        this.logTimesConsumer.em.addEventListener("addedResultsToCache",not=>{
            this.log.debug("Received new log times")
            //this.log.trace(this.tasksConsumer.get_cache())
            var tasksCache=this.tasksConsumer.get_cache()
            //!FALLBACK
            if(tasksCache==null ||tasksCache==undefined){throw new Error("Tasks cache cannot be null")}
            var logTimesCache=this.logTimesConsumer.get_cache()
            this.printNewLogTime(tasksCache,logTimesCache);
        })

        /*this.logTimesConsumer.emNaive.on("addedResults",(data)=>{
            this.log.debug('Event emitted with data:');
            this.log.debug(data)
        })*/
    }


    start(){
        this.logTimesConsumer.subscribeToSepa();
    }

    async printNewLogTime(tasks_cache,logtimes){
        var tasks;
        if(tasks_cache.length==0){
            this.log.info("TASKS CACHE IS EMPTY, TRYING TO QUERY SEPA")
            tasks=await this.tasksConsumer.querySepa()
            if(tasks.length==0){
                throw new Error("User has no tasks!")
            }
        }else{
            tasks=tasks_cache;
        }

        //this.log.debug(tasks);
        //this.log.debug(logtimes);
        if(logtimes.length>0){
            var obj=this.mapLogTimes(tasks,logtimes);
            var logTimesContainer=document.getElementById("log-times-container");
            logTimesContainer.innerHTML="<br>";
            this.log.debug(obj)
            var counter=0;
            Object.keys(obj).forEach(day=>{
    
                if(counter<14){
                    logTimesContainer.innerHTML = logTimesContainer.innerHTML + this.generateLogDayCell(counter,day,obj[day])
                }
                counter++
    
            })
        }else{
            this.log.info("No log times to show for current user")
        }
        
        /*var taskContainer=document.getElementById("task-wrapper");
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
        }*/


    }

    generateLogDayCell(cell_number,curr_day,day_arr){
        
        var log_times_cells="";
        for(var i in day_arr){
            var log_time=day_arr[i]
            var log_time_cell=this.generateLogTimeCell(log_time);
            log_times_cells=log_times_cells+log_time_cell;
        }



        return `
        <div class="work-day-cell" id="work-day-cell_${cell_number}">
            <div class="work-day-date">
                <b>&nbspWork day: ${curr_day}</b>
            </div>
            <br>
            <div class="work-day-log-times">
                ${log_times_cells}
            </div>
        </div>
        
        <br>
        `
    }

    generateLogTimeCell(log_time){
        var task_name=log_time.task_name;
        var progetto=log_time.progetto;
        var log_time_string=log_time.log_time;
        var now=log_time.now.split("T")[1].trim();
        //show only hour and minute
        now=now.split(":")[0]+":"+now.split(":")[1]
        //console.log(now.split(":"))

        return `
        <div class="log_time_cell">
            <p>
                ${now} > <b>${progetto} - Task '${task_name}'</b>
            </p>
            <p class="log_time_cell-logged_time">
                &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp
                <img src="Assets/icons/clock-outline.svg"> 
                &nbsp Logged time:&nbsp<b>${log_time_string}</b>
            </p>
        </div>
        `
    }


    mapLogTimes(tasks,logtimes){
        this.log.trace("TASKS")
        this.log.trace(tasks)
        var logTimesMappedWithTasks=[];
        for(var i in logtimes){
            var logged_time=this.secondsToTimeString(logtimes[i].log_time)
            var task_uri=logtimes[i].task_uri;
            var task_name="";
            var progetto="";
            for(var j in tasks){
                if(task_uri==tasks[j].bnode){
                    task_name=tasks[j].tasktitle.split("#")[1];
                    progetto=tasks[j].progetto.split("#")[1];
                    break;
                }
            }

            logTimesMappedWithTasks.push({
                task_name:task_name,
                progetto:progetto,
                log_time:logged_time,
                now: logtimes[i].now
            })

        }

        this.log.debug("Unsorted logTimes")
        this.log.debug(logTimesMappedWithTasks)
        var logTimesMappedWithTasks=this.sortLogTimesByTimestamp(logTimesMappedWithTasks)

        this.log.debug(logTimesMappedWithTasks)

        //AGGREGATE TIMESTAMPS
        var logTimesObject={}
        //var lastTimeStamp="";
        for(var i in logTimesMappedWithTasks){
            var timeStamp=logTimesMappedWithTasks[i].now.split("T")[0];
            //if(timeStamp!=lastTimeStamp){
            if(!logTimesObject.hasOwnProperty(timeStamp)){ //!BUGFIX
                //lastTimeStamp=timeStamp;
                this.log.trace("Creating new timestamp in logTimesObj");
                logTimesObject[timeStamp]=[];
                logTimesObject[timeStamp].push(logTimesMappedWithTasks[i])
                

            }else{
                this.log.trace("Pushing into existing timestamp in logTimesObj");
                logTimesObject[timeStamp].push(logTimesMappedWithTasks[i])
            }
        }

        //this.log.debug(logTimesObject)
        return logTimesObject
    }
    sortLogTimesByTimestamp(logTimesArr){
        var temp=[] //!DEEP COPY
        for(var i in logTimesArr){
            temp[i]={}
            Object.keys(logTimesArr[i]).forEach(k=>{
                if(k!="now"){
                    temp[i][k]=logTimesArr[i][k]
                }else{
                    temp[i][k]=new Date(logTimesArr[i][k])
                }
            })
        }
        var out=temp.sort(function(x, y){
            return y.now - x.now;
        })

        var temp2=[] //!DEEP COPY
        for(var i in out){
            temp2[i]={}
            Object.keys(out[i]).forEach(k=>{
                if(k!="now"){
                    temp2[i][k]=out[i][k]
                }else{
                    temp2[i][k]=out[i][k].toISOString();
                }
            })
        }

        return temp2;
    }




	secondsToTimeString(secondsFloat){
		var seconds=Math.floor(secondsFloat)
		//this.log.trace("Total: "+seconds)

		//3 calcola stringa del tempo
		//var seconds=incrementedTimeScanned
		var string="";
		if(seconds<60){
			string=seconds+"s"
		}else{
			if(seconds<3600){
				var minutes=Math.floor(seconds/60)
				seconds=seconds-(minutes*60)
				string= minutes+"m:"+seconds+"s"
			}else{

				var h=Math.floor(seconds/3600)
				var left_s=seconds-(h*3600);
				if(left_s<60){
					string=  h+"h"
				}else{
					var m=Math.floor(left_s/60)
					string=  h+"h:"+m+"m"
				}

			}
		}
		this.log.trace("Scan timer: "+string)
		return string
	}

    
}