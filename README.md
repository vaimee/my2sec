<div class="content-wrapper">

  <div align="center">
  <h1>MY2SEC: ActivityWatch-ADAPTER</h1>
   BRING ACTIVITY WATCH INTO THE CLOUD!<br><br>
  <img src="img/awlovesepa.png"></img>
  </div>
  <hr>
  <br>

  <div class="text-paragraph">
    <h2>INTRODUCTION</h2>
      <p>
      Built on top of the Activity Watch tracking app, the AW ADAPTER allows to expand said app functionalities making it a "CLOUD-APP".<br>
      In general, an ADAPTER allows not only to upload data produced by a generic local app to a remote server, but also to "map" that data into "semantic data".<br>
      My2sec Servers run a semantic event processor, the SEPA, which allows to take all the advantages of a semantic based architecture, while maintaining speed and scalability of the system.
      </p>
  </div> 

  <br>

  <div class="text-paragraph">
    <h2>INSTALLATION</h2>
      <h3>Production</h3>
      <p>
      In Production, the USER needs to download only the AW-PRODUCER, it will be the Server Administrator which will deploy the mapping part.<br>
      The AW-PRODUCER is an ELECTRON APP distribuited via an exe file. Follow this steps to download and use the producer:
      <ol>
        <li>
        Download the latest release zip file: <br>
        - Windows: <a href="https://github.com/vaimee/my2sec/raw/adapter/AwAdapter-RELEASES/AwProducer-v0.8.3-win32-x64.zip" download>AwProducer-win32-x64</a><br>
        - Mac: <a href="https://github.com/vaimee/my2sec/raw/adapter/AwAdapter-RELEASES/awproducer-v0.8.3-macos.zip" download>AwProducer-macos</a><br>
        - Linux: <a href="https://github.com/vaimee/my2sec/raw/adapter/AwAdapter-RELEASES/awproducer-v0.8.3-linux-x64.tar.gz" download>AwProducer-linux-x64</a>
        </li>
        <li>Extract the zip</li>
        <li>Launch the AwProducer.exe file inside the extracted folder</li>
        <li>Create a desktop shortcut for easy access to the executable</li>
      </ol>
      Producer CONFIGURATION
      <ol>
        <li>Press the menu button on the top-left corner of the screen</li>
        <li>Select your user</li>
        <li>Select the remote sepa hostname</li>
        <li>Select the http port and ws port</li>
        <li>Save options. The APP will reload automatically</li>
      </ol>
      <p>

      ## Developement
      
To test the whole adapter architecture, you can deploy mapper,producer and a sepa on your local host using the following docker-compose file:
<pre>
version: "3.9"
#================================================#
# NAME: awmapper4SEPA stack
# DATE: 7-8-2022
# AUTHOR: Gregorio Monari
# DESCRIPTION: minimal configuration to test
#   the aw mapper functionalities. Data must be
#   produced by the AW-PRODUCER
#================================================#
volumes:
  rdf_my2sec: #blazegraph db
networks:
  net_my2sec: #my2sec internal network and DNS


services:

  aw_mapper: #activity watch mapper
    image: gregnet/awmapper:v0.1
    user: node
    restart: always
    working_dir: /home/node/myapp
    command: "node main.js"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=0
      - HOST_NAME=engine #sepa engine ip address
      - HTTP_PORT=8000 #engine query/update port
      - WS_PORT=9000 #engine subscription port
    networks:
      - "net_my2sec"


  dashboard: #sepa dashboard: manual sparql1.1 queries and updates
    image: gregnet/sepa_dashboard:1.0
    restart: always
    ports:
      - "80:80"
    networks:
      - "net_my2sec"

      
  engine: #the sepa core
    image: gregnet/sepablaze:dev2j-0.1
    command: sh -c "java Dev2jConnector && java -jar engine-0-SNAPSHOT.jar"
    restart: always
    environment:
      - host_name=db
    depends_on:
      - db
    ports:
      - "8000:8000" #query/update port
      - "9000:9000" #subscription port
    networks:
      - "net_my2sec"


  db: #endpoint
    image: lyrasis/blazegraph:2.1.5
    restart: always
    environment:
        JAVA_XMS: 512m
        JAVA_XMX: 1g
    volumes:
      - rdf_my2sec:/var/lib/jetty
    networks:
      - "net_my2sec"


</pre>
      
  </div> 


</div>


