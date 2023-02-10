# My2Sec - The Ultimate PM & HR Suite By Smart Workers for Smart Workers

![Architecture](img/architecture.png?raw=true)

The objective is to create an open source and GDPR compliant suite to support remote working. My2Sec helps smart workers to keep track of the time spent on different activities, by enabling at the same time the production of a trusted and verified profile of the workers' transferable soft and hard skills. My2Sec integrates several open source solutions like [ActivityWatch](https://github.com/ActivityWatch/activitywatch) for tracking the time spent on different tasks, [OpenProject](https://github.com/opf/openproject) for project management and [SuperSet](https://github.com/apache/superset) as BI tools for KPI assessment. Events generated by ActivityWatch are stored on the local device of the worker who will always have full control on her data. Events that a worker agrees to share are aggregated by AI tools (e.g., [DROOLS](https://www.drools.org)) to provide two indicators: the time spent by workers on different tasks and the transferable skills profile. The skills profile is eventually stored in a [SOLID pod](https://solidproject.org) but can be also available to HR managers through a trustful and semantic DApp built on top of the [ONTOCHAIN ecosystem](https://ontochain.ngi.eu).


## MY2SEC INSTALLATION
This guide will step you through download and installation of the My2Sec Application on your system. 
### Prerequisites
- <b>Node.js</b> installed<br>
  To check if Node.js is installed on your local machine, type the following commands in your terminal:
  <pre>node -v<br>npm -v</pre>
  If one of the commands returns an error, please install Node.js from the official website: [https://www.nodejs.org](https://www.nodejs.org)
- <b>Python</b> installed<br>
  To check if Python is installed on your local machine, type the following commands in your terminal:
  <pre>python --version</pre>
  If one of the commands returns an error, please install Python from the official website: [https://www.python.org/](https://www.python.org/)
- <b>ActvityWatch</b> installed<br>
  If your PC does not have ActivityWatch installed, please install it from the official website: [https://activitywatch.net/](https://activitywatch.net/)
### Download
Clone this repository on your local machine and move it anywhere in your system.
### Installation
- Open a terminal into the downloaded folder and move into the ActivityWatch Producer directory:
  <pre>cd C://Users/User/.../my2sec/1_ActivityWatchProducer</pre>
  This is the main interface you will be using to interact with My2sec services, like publishing and aggregating your activities.
- The interface is built with the Electron framework, to install it type the following command in your terminal:
  <pre>npm install --save-dev electron</pre>
- Once finished, from the current directory cd into the following directory:
  <pre>cd ./PY/my2sec</pre>
  and install the required files for My2sec Working Events Ai Filter:
  <pre>python -m pip install -r requirements.txt</pre>


## STARTING THE APPLICATION
Open a terminal in the folder '.../1_ActivityWatchProducer/PY/my2sec/main' and type the following command:
<pre>python ./API_my2sec.py</pre>
This will start the api needed to run My2sec Working Events Ai Filter.
Now that all requirements have been fullfilled, you can start the Producer Application: open a new terminal and type <pre>cd C://Users/User/.../my2sec/1_ActivityWatchProducer</pre> to move into the Producer Directory.
Start the application by typing: <pre>npm start</pre> from inside the Producer Directory.

## USAGE



## Reference technologies

SEPA

ActivityWatch

SuperSet

OpenProject

Keycloak

Drools

Jena

OpenLink Virtuoso

...

## ActivityWatch

Forked. Adding new Watchers like a MeetingWatcher.

New watchers:
- Detecting meetings (Jitsi, Google Meet, Teams, Zoom)

## AI tools

Under evaluation. Drools can be an option in first instance.

## Blockchain




