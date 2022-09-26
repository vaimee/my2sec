# specify the node base image with your desired version node:<version>
FROM node

#SPECIFY WORKDIR BEFORE ANYTHING!!!!!!!!!!!! THERE IS A PROBLEM FROM NODE:16 IF YO
#DON'T DO THIS
WORKDIR /home/node/myapp


#COPY FILES
COPY . /home/node/myapp

#INSTALL SEPA CLIENT API
#RUN npm i @arces-wot/sepa-js #already installed locally, test if it works anyways


# replace this with your application's default port
EXPOSE 80
EXPOSE 443




#RUN node main.js