# specify the node base image with your desired version node:<version>
FROM node:16

#SPECIFY WORKDIR BEFORE ANYTHING!!!!!!!!!!!! THERE IS A PROBLEM FROM NODE:16 IF YO
#DON'T DO THIS
WORKDIR /home/node/myapp


#COPY FILES
COPY . /home/node/myapp

#INSTALL SEPA CLIENT API
RUN npm i @arces-wot/sepa-js
RUN npm i mysql


# replace this with your application's default port
EXPOSE 80
EXPOSE 443




#RUN node main.js