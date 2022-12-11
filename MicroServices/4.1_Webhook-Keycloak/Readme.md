# KEYCLOAK4SEPA
## 0.Introduction
This document is meant as a step-by-step guide on how to setup and configure: a production-ready keycloak auth server complete with Webhook for detecting and notifying events of user login/creation, and a PAC-Adapter to store the event information into a SEPA database.

## Index
0-introduction
0.1-keycloak overview
0.2-objective

1-keycloak deployment

## 0.1.Keycloak overview
Keycloak is a Java-based authentication provider, complete with a frontend interface to manage your security architecture with an high level of granulariy and an auth server, witch stores all personal data in a secure and robust way.
Keycloak also provides a rich REST-api to automate most of the dirty work.

## 0.2.Objective
The purpose of this project is to integrate keycloak with the sepa engine, specifically the objective is:
>> Every time a new user is created in keycloak, make a sparql update to SEPA to create a new graph named with the user's email

The advantage of this configuration is the complete automation of user creation/deletion in all the microservices in a composable application, removing the need to manually create the same user over different services, and also allowing to perform specific actions on user creation, like create sql tables, dashboards, etc...
<hr>

## 1.Keycloak deployment
### Key steps
A standard docker-compose file for deploying keycloak behind traefik in production is shown at the end of this paragraph under "docker-compose.yml" (the deployment environment is assumed to be Docker).
The docker-compose file can be left untouched exept for this parameters:

ENVIRONMENT VARIABLES
- POSTGRES PASSWORD (change password)
- POSTGRES ROOT PASSWORD (change password)
- DB_PASSWORD (copy postgres password)
- KEYCLOAK_USER (change admin username)
- KEYCLOAK_PASSWORD (change admin password)

TRAEFIK LABELS
- traefik.http.routers.keycloak.rule=Host(`yourdomain.com`) (change domain)

### docker-compose.yml
<pre>
version: "3.4"

networks:
  keycloak: #keycloak internal network and dns
  traefik:
    external: true
volumes:
  keycloak_data:

services:
  keycloak_db: #secure permanent db
    image: postgres:11.2-alpine
    restart: always
    environment:
        - POSTGRES_DB=keycloak
        - POSTGRES_USER=keycloak
        - POSTGRES_PASSWORD=changeme-postgres
        - POSTGRES_ROOT_PASSWORD=changeme-rootpw
    networks:
      - "keycloak"
    volumes:
      - keycloak_data:/var/lib/postgresql/data
    labels:
      - "traefik.enable=false"

  keycloak: #frontend
    image: jboss/keycloak:latest
    command: ["-b", "0.0.0.0", "-Dkeycloak.profile.feature.docker=enabled"]
    restart: always
    hostname: keycloak
    environment:
      - DB_VENDOR=POSTGRES
      - DB_ADDR=keycloak_db
      - DB_DATABASE=keycloak
      - DB_PORT=5432
      - DB_USER=keycloak
      - DB_SCHEMA=public
      - DB_PASSWORD=changeme-postgres
      - PROXY_ADDRESS_FORWARDING=true
      - KEYCLOAK_LOGLEVEL=INFO
      - KEYCLOAK_USER=admin
      - KEYCLOAK_PASSWORD=admin
    networks:
      - "keycloak"
      - "traefik"
    labels:
      # Frontend
      - "traefik.enable=true"
      - "traefik.http.routers.keycloak.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.keycloak.entrypoints=websecure"
      - "traefik.http.routers.keycloak.service=keycloak_svc"
      - "traefik.http.services.keycloak_svc.loadbalancer.server.port=8080"
      - "traefik.http.routers.keycloak.tls=true"
      - "traefik.http.routers.keycloak.tls.certresolver=le" 
</pre>

## 1.1.Keycloak configuration
- create a new realm
- create a new client (non mostrato nella guida)
- create a new user

## 2.Keycloak webhook
Keycloak can be upgraded with custom-written java plugins to perform a variety of new actions. Templates for various types of plugins can be found at this link: https://github.com/zonaut/keycloak-extensions.
For the purpose of this project, the SPI-event-listener has been chosen (download example at https://github.com/zonaut/keycloak-extensions/tree/master/spi-event-listener).

## 3.Keycloak Adapter
### intro

### producer

### mapper

## 4.Example of users consumer

## 5.CONCLUSIONS


