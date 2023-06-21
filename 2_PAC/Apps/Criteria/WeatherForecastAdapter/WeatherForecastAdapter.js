var SynchronousConsumer=require('../../../core/Pattern/SynchronousConsumer.js'); //Pac Factory
var Producer=require('../../../core/Pattern/Producer.js'); //Pac Factory

class WeatherForecastAdapter {
    constructor(jsap_file){
        console.log("###########################");
        console.log("# App: WeatherForecast v0.1");
        console.log("###########################");
        this.awEventsProducer=new Producer(jsap_file,"ADD_TRAINING_EVENT");
        this.weatherConfigurationConsumer=new SynchronousConsumer(
            jsap_file,
            "METEO_LOCATION",
            {},
            "none",
            false
        )
    }





    async start(){
        console.log("STARTING WEATHER")
        //this.awMessagesConsumer.subscribeToSepa()
      }
    async exit(){
        this.awMessagesConsumer.exit()
    }
}

module.exports = WeatherForecastAdapter