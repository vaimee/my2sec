# My2Sec - The Ultimate PM & HR Suite By Smart Workers for Smart Workers

![Architecture](img/architecture.png?raw=true)

The objective is to create an open source and GDPR compliant suite to support remote working. My2Sec helps smart workers to keep track of the time spent on different activities, by enabling at the same time the production of a trusted and verified profile of the workers' transferable soft and hard skills. My2Sec integrates several open source solutions like [ActivityWatch](https://github.com/ActivityWatch/activitywatch) for tracking the time spent on different tasks, [OpenProject](https://github.com/opf/openproject) for project management and [SuperSet](https://github.com/apache/superset) as BI tools for KPI assessment. Events generated by ActivityWatch are stored on the local device of the worker who will always have full control on her data. Events that a worker agrees to share are aggregated by AI algorithms to provide two indicators: the time spent by workers on different tasks and the transferable skills profile. The skills profile will be eventually stored in a [SOLID pod](https://solidproject.org) but will be also available to HR managers through a trustful and semantic DApp built on top of the [ONTOCHAIN ecosystem](https://ontochain.ngi.eu/content/my3sec-ultimate-pm-hr-suite-smart-workers-smart-workers).


## MY2SEC INSTALLATION
### Prerequisites
- <b>ActivityWatch</b><br>
  My2sec requires the ActivityWatch software to be installed on your computer.
  If your computer does not have ActivityWatch installed, please install it from the official website: [https://activitywatch.net/](https://activitywatch.net/)
### Installation
- Download the latest release from [https://github.com/vaimee/my2sec/releases](https://github.com/vaimee/my2sec/releases).
- Unzip the downloaded archive
- Go into the unzipped folder and double click "electron.exe": after some seconds the application will start, showing the login screen.
>> Optionally, you can create a desktop link to the .exe file: click with the right mouse button on the electron.exe file and select "add desktop link". Then, copy the link onto your desktop. Double click the link to start the application

## USAGE
### 0-login
Once the application is started, a popup login window will appear, prompting the user to either: a.login or b.create a new user. If it's the first time you are accessing the platform, please create a new user, then login from the same window.
![Architecture](img/producerLOGIN.png?raw=true)

### 0.1-homepage
If login is successful, the homepage of the application will load
![Architecture](img/producerHOME.png?raw=true)
The interface has 4 main components:
- activities dashboard (right side of the screen)<br>
  View history of your activities
- open project tasks (left side of the screen)<br>
  View current tasks and spent time
- control panel (top-right side of the screen)<br>
  Start/stop tracking events, upload events, explore events
- bug report button (top of the screen)<br>
  Send a bug report to the administrator
  
### 1-manage start/stop scan
Pressing the 'start scan' button in the control panel will activate the ActivityWatch watchers, which will begin collecting data about your activities. Press the start button again to stop the scan. The explorer button in the control panel opens the explorer panel, which allows to take a look at the currently collected data before uploading it.
### 2-upload events
Once a scan has been started and stopped, the upload button becomes active. Pressing it will initiate the Upload and Validation Procedure, and will open a popup window in the producer (the "validation panel").
![Architecture](img/producerVALIDATION.png?raw=true)
The validation panel will help you validate your collected events before storing them into the SEPA database in three steps:
- Validate events: select if an event is related to work (working) or not (not working), confirm to upload events to SEPA
- Validate activities: select the correct category for the specified activity, confirm to upload categorized activities to SEPA
- Show log times: no user input is needed here, in this panel after a while the aggregation results will be shown, showing the exact time logged on Open Project.

The validation procedure is now complete, and the validation panel can be closed.<br>
You can refresh the dashboards to see your activities added to the charts.

### 3-report issues
Pressing the bug report button on the top of the screen will open the bug report window:
![Architecture](img/bugREPORT.png?raw=true)
Here you can send messages directly to the administrator to report bugs, issues, enhancements, or general messages.<br>
This messages are stored in the sepa database, and every time a new message is consumed, various actions can be triggered, like automatically posting the issue on Github, sending a mail to the administrator, sending a discord message, etc...
<br>
Any support is appreciated!

<br>

# DEVELOPMENT
If you are a developer, or you have trouble using the official release of My2sec, this guide will guide you through the steps necessary to run My2sec application in Development mode.
**WARNING**: there is a known issue with Python3. 
## Prerequisites
- <b>Node.js</b><br>
  To check if Node.js is installed on your local machine, type the following commands in your terminal:
  <pre>node -v<br>npm -v</pre>
  If one of the commands returns an error, please install Node.js from the official website: [https://www.nodejs.org](https://www.nodejs.org)
- <b>Python</b><br>
  To check if Python is installed on your local machine, type the following commands in your terminal:
  <pre>python --version</pre>
  If one of the commands returns an error, please install Python from the official website: [https://www.python.org/](https://www.python.org/)
- <b>ActivityWatch</b><br>
  If your PC does not have ActivityWatch installed, please install it from the official website: [https://activitywatch.net/](https://activitywatch.net/)
## Download
- Clone this repository
## Dependencies Installation
- Open a terminal and move into the ActivityWatchProducer folder in the cloned repository:
  <pre>cd C://Users/User/.../1_ActivityWatchProducer</pre>
  This is the main interface you will be using to interact with My2sec services, like publishing and aggregating your activities.
- The interface is built with the Electron framework, to install it type the following command in your terminal:
  <pre>npm install --save-dev electron</pre>
- Once finished, from the current directory cd into the following directory:
  <pre>cd ./PY/my2sec</pre>
  and install the required files for My2sec Working Events Ai Filter:
  <pre>python -m pip install -r requirements.txt</pre>
## Starting the application
Now that all requirements have been fullfilled, you can start the Producer Application: open a new terminal and type <pre>cd C://Users/User/.../1_ActivityWatchProducer</pre> to move into the Producer Directory.
Start the application by typing: <pre>npm start</pre> from inside the Producer Directory.



