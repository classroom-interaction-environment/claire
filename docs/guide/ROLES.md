# Role system

CLAIRE uses a hierarchical role system to manage access control. We decided for a strict hierarchy,
because it reflects institutional structures and simplifies the implementation, while still
keeping up the access control.

## Hierarchy

The hierarchy starts with least privileged to most privileged. Every role that supersedes the former
role inherits all their privileges. The term CRUD will sometimes be used and refers to create-read-update-delete.

### `student`

- Can join classes
- Can attend lessons
- Can respond to items in tasks and save tasks
- Can upload a profile image

### `teacher`

- Can create classes
- Can invite students to the class
- Can CRUD custom units
- Can CRUD units from templates (called forked units) and customize them, delete them
- Can CRUD custom materials
- Can CRUD lessons that execute a custom or forked unit
- Can control the beamer and display material and task results

### `curriculum`

- Can manage curriculum (dimensions, objectives, pockets and unit templates)
- Can invite teachers

### `schoolAdmin`

- Can manage user accounts of the same `institution` (see scopes section)
- Can manage user roles (except `admin`) of the same `institution`
- Can view application logs
- Can change the theme for the same `institution`
- Can update system-wide ui settings for the same `institution`
- Can change the application logo for the same `institution`

### `admin`

- can manage all user roles, even `admin`
- can manage legal documents and terms
- can apply settings for all institutions (as defaults)

## Groups / scopes

The current role implementation uses scopes for grouping permissions across
various namespaces. In CLAIRE this is applied by `instritution` to make an instance
ready for multi-tenant usage. By doing so we can ensure that there are intersections between institutions.