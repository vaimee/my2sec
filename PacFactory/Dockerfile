# specify the node base image with your desired version node:<version>
FROM nikolaik/python-nodejs:latest

#SPECIFY WORKDIR BEFORE ANYTHING!!!!!!!!!!!! THERE IS A PROBLEM FROM NODE:16 IF YO
#DON'T DO THIS
USER pn
WORKDIR /home/pn/app


#COPY FILES
COPY . /home/pn/app

#PIP INSTALL
RUN pip install pandas
#RUN pip install collections
RUN pip install numpy

#INSTALL SEPA CLIENT API
#RUN npm i @arces-wot/sepa-js #already installed locally, test if it works anyways

# replace this with your application's default port
EXPOSE 80
EXPOSE 443




#RUN node main.js