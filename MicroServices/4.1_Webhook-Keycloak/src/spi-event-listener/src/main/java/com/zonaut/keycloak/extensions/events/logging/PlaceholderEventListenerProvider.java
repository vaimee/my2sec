package com.zonaut.keycloak.extensions.events.logging;

import org.jboss.logging.Logger;
import org.keycloak.events.Event;
import org.keycloak.events.EventListenerProvider;
import org.keycloak.events.EventType;
import org.keycloak.events.admin.AdminEvent;
import org.keycloak.events.admin.OperationType;
import org.keycloak.events.admin.ResourceType;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.RealmProvider;
import org.keycloak.models.UserModel;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;
import java.net.http.HttpRequest.BodyPublishers;


public class PlaceholderEventListenerProvider implements EventListenerProvider {

    private static final Logger log = Logger.getLogger(PlaceholderEventListenerProvider.class);

    private final KeycloakSession session;
    private final RealmProvider model;
    private String sepaWebhookUrl="";

    public PlaceholderEventListenerProvider(KeycloakSession session) {
        this.session = session;
        this.model = session.realms();
        this.sepaWebhookUrl=System.getenv("SEPA_WEBHOOK_URL");
    }

    @Override
    public void onEvent(Event event) {
        log.infof("## NEW %s EVENT", event.getType());
        log.info("-----------------------------------------------------------");
        event.getDetails().forEach((key, value) -> log.info(key + ": " + value));

        // USE CASE SCENARIO, I'm sure there are better use case scenario's :p
        //
        // Let's assume for whatever reason you only want the user
        // to be able to verify his account if a transaction we make succeeds.
        // Let's say an external call to a service needs to return a 200 response code or we throw an exception.

        // When the user tries to login after a failed attempt,
        // the user remains unverified and when trying to login will receive another verify account email.

        if (EventType.VERIFY_EMAIL.equals(event.getType())) {
            RealmModel realm = this.model.getRealm(event.getRealmId());
            UserModel user = this.session.users().getUserById(event.getUserId(), realm);
            if (user != null && user.getEmail() != null && user.isEmailVerified()) {
                log.info("USER HAS VERIFIED EMAIL : " + event.getUserId());

                // Example of adding an attribute when this event happens
                user.setSingleAttribute("attribute-key", "attribute-value");

                UserUuidDto userUuidDto = new UserUuidDto(event.getType().name(), event.getUserId(), user.getEmail());
                UserVerifiedTransaction userVerifiedTransaction = new UserVerifiedTransaction(userUuidDto);

                // enlistPrepare -> if our transaction fails than the user is NOT verified
                // enlist -> if our transaction fails than the user is still verified
                // enlistAfterCompletion -> if our transaction fails our user is still verified

                session.getTransactionManager().enlistPrepare(userVerifiedTransaction);
            }
        }
        log.info("-----------------------------------------------------------");
    }

    @Override
    public void onEvent(AdminEvent adminEvent, boolean b) {
        log.info("## NEW ADMIN EVENT");
        log.info("-----------------------------------------------------------");
        log.info("Resource path" + ": " + adminEvent.getResourcePath());
        log.info("Resource type" + ": " + adminEvent.getResourceType());
        log.info("Operation type" + ": " + adminEvent.getOperationType());

        if (ResourceType.USER.equals(adminEvent.getResourceType())
                && OperationType.CREATE.equals(adminEvent.getOperationType())) {
            log.info("A new user has been created");
            //=======================================
            // GREGNET WEBHOOK
            log.info("################################");
            log.info("# GREGNET WEBHOOK ACTIVATING!! #");
            log.info("################################");
            handleNewUser(adminEvent);
            //=======================================
        }

        log.info("-----------------------------------------------------------");
    }



    //=======================
    //WEBHOOK SIGNAL HANDLING
    public void handleNewUser(AdminEvent adminEvent){
        //FETCH USER EMAIL AND USERNAME
        log.info("handleNewUser(): Fetching user info");
        log.info("Resource path" + ": " + adminEvent.getResourcePath());
        log.info("Resource path" + ": " + adminEvent.getResourceType());
        log.info("Operation type" + ": " + adminEvent.getOperationType());
        //log.info("Event UUID" + ": " + adminEvent.getId());
        log.info("Realm" + ": " + adminEvent.getRealmId());
        log.info("Json representation" + ": " + adminEvent.getRepresentation());
        log.info("Time of event" + ": " + adminEvent.getTime());

        //ASSEMBLE JSON
        log.info("handleNewUser(): Assembling json...");
        String keycloak_createuserjson= "{\"webhook_event_package\":{\"level\":\"admin\",\"timestamp\":\""+adminEvent.getTime()+"\",\"resource_type\":\""+adminEvent.getResourceType()+"\",\"operation_type\":\""+adminEvent.getOperationType()+"\",\"realm\":\""+adminEvent.getRealmId()+"\",\"host\":\"unknown\","
                //+"\"data\":{\"firstName\":\"Gregorio\",\"lastName\":\"Monari\",\"email\":\"gregorio.monari@vaimee.it\",\"userName\":\"greg\",\"group\":\"users\"}}}";
                +"\"data\":"+adminEvent.getRepresentation()+"}}";
        log.info(keycloak_createuserjson);
        //SEND WEBHOOK
        log.info("handleNewUser(): Sending webhook to "+this.sepaWebhookUrl);
        sendWebhookSignal(keycloak_createuserjson);
    }

    public void sendWebhookSignal(String data){
        log.info("Sending webhook signal with body: "+data);
        this.postJson("/api/keycloak/webhook/signalnewevent",data);
    }


    public void postJson(String path,String body){
        //GUIDE LINK=> https://openjdk.org/groups/net/httpclient/intro.html
        HttpClient client = HttpClient.newHttpClient();//client predefinito, puoi customizzarlo con HttpClient.newBuilder()
        //BUILD HTTP REQUEST
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(this.sepaWebhookUrl+path))
                .header("Content-Type", "application/json")
                .POST(BodyPublishers.ofString(body))
                .build();
        //SEND HTTP REQUEST
        client.sendAsync(request, BodyHandlers.ofString())
                .thenApply(response -> {
                    log.info("(HTTP POST)");
                    log.info("| Request status: "+response.statusCode());
                    log.info("| Response: "+response.body());
                    log.info("(REQUEST FINISHED)");
                    return response;
                })
                .thenApply(HttpResponse::body)
                //.thenAccept(System.out::println)
                .join();
    }



    @Override
    public void close() {
        // Nothing to close
    }

}
