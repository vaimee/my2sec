<div align="center">
  
# MY2SEC - BACKEND
All the modules required to run my2sec server-side

</div>
<br><br>

## INTRODUCTION
My2Sec is a modular application: each module brings new functionalities to the app, like production, visualization and aggregation of data.
The application has been developed in a docker environment, and can be deployed following the steps in the DEPLOYMENT section of this guide. 

## INSTALLATION
This guide will explain the basic steps necessary to deploy and use MY2SEC.
### Prerequisites
The application has been developed in a docker environment, for this reason docker needs to be installed in your host system to run the app.<br>
To verify that docker is installed in your system, type the following command on the terminal:
<pre>docker --version<br>docker-compose --version</pre>
If the command fails, please install docker from the official website: <a>https://www.docker.com</a>

### Deployment
To deploy MY2SEC, first clone this repository and put the folder anywhere in your file system.<br>
Then, cd into the downloaded directory, for example:
<pre>cd c/Users/User/.../My2Sec-Backend</pre>
Now start My2Sec by typing the following command on your terminal:
<pre>docker-compose up</pre>

## DEVELOPMENT
My2sec modules are called PAC modules, they are divided in three categories: Producer, Consumer and Aggregator.
