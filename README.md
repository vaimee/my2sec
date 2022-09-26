<div class="content-wrapper">

  <div align="center">
  <h1>MY2SEC: ActivityWatch-PRODUCER</h1>
   BRING ACTIVITY WATCH INTO THE CLOUD!<br><br>
  <img src="img/awlovesepa.png"></img>
  </div>
  <hr>
  <br>

<!--#############
INTRODUCTION
###############-->
  <div class="text-paragraph">
    <h2>INTRODUCTION</h2>
      <p>
      Built on top of the Activity Watch tracking app, the AW Producer allows to expand said app functionalities making it a "CLOUD-APP". <br><br>In general, an    ADAPTER allows not only to upload data produced by a generic local app to a remote server, but also to "map" that data into "semantic data".<br>
      My2sec Servers run a semantic event processor, the SEPA, which allows to take all the advantages of a semantic based architecture, while maintaining speed and scalability of the system.<br><br> In practice, the adapter is composed by two modules: Aw-producer and Aw-mapper. The end-user needs to download the Aw-Producer on his host-machine, while the mapper needs to be deployed on the remote server. 
      </p>
  </div> 

  <br>


<!--#############
INSTALLATION GUIDE
###############-->
<div class="text-paragraph">
<h2>QUICK START</h2>
<p>This guide will step you through download and installation of the ActivityWatch Producer application.</p>
      
<h3>Prerequisites</h3>
<p>
  To use the application, you need to have Node.js installed in your system.
  <br>
  To check that Node.js was installed correctly, type the following commands in your terminal client:
  <br>
  <pre>node -v<br>npm -v</pre>
  If one of the commands returns an error, please install Node.js from the official website: <a>https://nodejs.org</a>
</p>

<h3>Installation</h3>
<p>
  After cloning this repository, move the "src" folder wherever you want. 
  <br>
  Open your terminal client and cd into the "src" directory, for example:
  <pre>cd c/Users/User/.../AW-Producer/src</pre>
  To install Electron on your system, in your terminal type:
  <pre>npm install --save-dev electron</pre>
</p>

<h3>Running the Application</h3>
<p>
  After the installation procedure has been completed, from the src directory type the following command in your terminal to start the application: 
  <pre>npm start</pre>
</p>

<h3>Installation</h3>
<p>
  After cloning this repository, move the "src" folder wherever you want. 
  <br>
  Open your terminal client and cd  into the "src" directory, es <pre>cd c/Users/User/.../AW-Producer/src</pre>.
  
</p>
 
 
<h2>USAGE</h2> 
<p>
The Aw-Producer allows a User to manually upload data to a remote SEPA cloud.<br>
The flow of the application is composed by 3 steps: configuration, data fetch and data upload.
</p>
<h4>1- Configuration</h4> 
<p>The app comes with a default configuration which can be changed from the menu:</p>
  <ol>
    <li>Press the menu button on the top-left corner of the screen to open the configuration menu</li>
    <li>Set your username (es default.user@vaimee.it)</li>
    <li>Set the SEPA ip address (es dld.arces.unibo.it)</li>
    <li>Set the http port (es. 8500) and ws port (es. 9500)</li>
    <li>Set whitelisted watchers (es. aw-my2sec,aw-watcher-working)</li>
    <li>Press the save button. The APP will reload automatically</li>
  </ol>

<h4>2- Get data</h4> 
<p>
At startup, the application will automatically get the events from aw-server and display them to the user. Only the whitelisted watchers will be shown.<br>
The app will show the events of one watcher at a time, to view other watchers press the arrow buttons on the sides of the screen.
</p>

<h4>3- Upload data</h4> 
<p>
After fetching the events, the app will try to connect to the remote SEPA server. If connection is successful, a button will appear on the bottom of the screen.<br>
Pressing this button will start the upload procedure: if data is uploaded correctly, a popup will appear signaling the user of the succeeded operation.
</p>




<h2>TROUBLESHOOTING</h2> 
<p>
The application is still in development, so it has not been signed yet. Some operating systems like macos are very strict on running unsigned applications: if you have trouble starting the application try with this link: https://support.apple.com/it-it/guide/mac-help/mh40616/mac<br>
If you have other issues during the usage of the application please report them as an issue here on GitHub! Meanwhile, try to restart the application...
</p>
  
  

<br>
<h2>DEVELOPMENT</h2>
To test the whole adapter architecture, on top of the producer you need to deploy a mapper, a SEPA engine and a DB on your local host using the following docker-compose file as an example:<br><br>
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

aw_working_mapper: #activity watch mapper for working events
    image: gregnet/awmapper:v0.3.2
    user: node
    restart: always
    working_dir: /home/node/myapp
    command: "node main.js"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=0
      - SOURCE=http://www.vaimee.it/sources/aw-watcher-working #listen to a specific watcher
      - HOST_NAME=engine #sepa engine ip address
      - HTTP_PORT=8000 #engine query/update port
      - WS_PORT=9000 #engine subscription port
    networks:
      - "net_my2sec"
      
  aw_my2sec_mapper: #activity watch mapper for start-stop events
    image: gregnet/awmapper:v0.3.2
    user: node
    restart: always
    working_dir: /home/node/myapp
    command: "node main.js"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=0
      - SOURCE=http://www.vaimee.it/sources/aw-my2sec #listen to a specific watcher
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
  
  
  
 <h2>COMING SOON</h2> 
<p>
- Keycloack user management<br>
- UI and UX improvements<br>
- Integration with my2sec scanner
</p> 
  
  
  </div> 


</div>


