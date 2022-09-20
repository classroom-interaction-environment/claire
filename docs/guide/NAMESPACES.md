# Namespaces

The application uses a variety of namespacing to structure content.

The main structure is determined by meteor:

* client - for any content that will only be part of the client bundle
* server - for any content that will only be part of the server bundle

Furthermore the CLAIRE framework brings it's own namespacing:

* api - define functionality across domains 
* contexts - describe domains
* startup - build domains
* ui - display data and provide interaction with domains

