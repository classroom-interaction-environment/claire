# Imports folder structure

The structure of import folders is oriented by their respective purpose.
We organize our codebase by the following principle:

- help to separate architectures (server, client, both)
- structure from general to specific

Therefore the following structure will be in use:

## Infrastructure

Could also be named "system". Most general layer.
Contains fundamental parts to build the system, which
then can be used to provide an API.


## API

Contains shared functions, classes and interfaces.
More concrete and application-specific implementations.

## Contexts

Similar to "domain".
Contains the static and descriptive definitions of contextual objects 
(think domain objects).

## Startup

Contains the startup routines for the system, as well as
application bundles targeting several roles.

## UI

Contains all layout and Templates to be rendered on the client
