class ErrorManager{
    constructor(error_panel,error_title_container,error_description_container){
        this.error_panel=document.getElementById(error_panel);
        this.error_title=document.getElementById(error_title_container);
        this.error_description=document.getElementById(error_description_container);
        this.log=new GregLogs();
    }

    injectError(title,description){
        this.error_title.innerHTML=title;
        this.error_description.innerHTML=description;
        this.error_panel.style.display="block";
        this.log.error(description)
    }

    hideErrorPanel(){
        this.error_panel.style.display="none";
    }

    getErrorTitle(){
        return this.error_title
    }

}