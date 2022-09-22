# CLAIRE - The Classroom Interaction Runtime Environment

[![built with Meteor](https://img.shields.io/badge/Meteor-2.7.3-green?logo=meteor&logoColor=white)](https://meteor.com)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
![GitHub](https://img.shields.io/github/license/classroom-interaction-environment/claire)

CLAIRE is a classroom management, enriched with reflexive processes.
It is designed to emphasize on methods and interactions with a high reflexive outcome in students and teachers.

It encourages non-behaviouristic teaching by being as unopinionated as possible when
it comes to any action within the classroom:

* teachers can design a fully detailed list of phases for a lesson but there is
no determinism forcing them to execute their lesson in this sequence
* teachers can freely activate / deactivate learning material for students and the beamer at any moment of an active lesson
* students are free to skip any interaction
* teachers and students can create artifacts together, based on student's replies and reflexive discourse
* the system does not enforce to reveal the identity an answer's respondent to the rest of the class

Watch the technical overview video from Meteor Impact 2021:

[![CLAIRE | Meteor Impact 2021 - Day 1](http://img.youtube.com/vi/upKaZyVfONE/0.jpg)](https://www.youtube.com/watch?v=upKaZyVfONE "CLAIRE Meteor Impact 2021 - Day 1")

Direct link: https://www.youtube.com/watch?v=upKaZyVfONE

## Installation on your own server

CLAIRE is a monolithic application by choice, thus it can run on a single VM or bare metal server.
We use [`mup` (Meteor-Up)](http://meteor-up.com/) as a config-based one-step deployment, so you just need to run a
script that configures the server and deploys the app.

### Requirements

1. You need a root / sudo-privileged account on a server including ssh access. We recommend ssh access using ssh-keys 
   instead of passwords. However, `mup` supports both authentication types, see their 
   [docs](http://meteor-up.com/docs.html#ssh-keys-with-passphrase-or-ssh-agent-support).

3. The server should have at least 512MB of RAM, 5 GB of *available* disc space and 1 (virtual) CPU. 
   With these specs you will be able to run several classrooms at the same time. However, if you are a larger 
   institution and / or want to share larger files (videos, images etc.) within the classes you may consider at least 
   2GB RAM, 2 (virtual) CPUs and as many as disk space as possible required.

### Get the latest stable build

TBD

### Configure deployment

TBD

### Deploy and monitor

TBD


## Development

CLAIRE is a public project that is developed by people like you.
There are always parts to improve:
- test coverage improvement
- refactoring code
- improve translation
- add new item types or visualization formats

To install CLAIRE for development, please follow the next steps.

### Installation

You first need to install Meteor. NodeJS and NPM are not required as they are shipped
with Meteor.
Don't use your own NodeJs, since Meteor requires those bundled versions in order to function properly.
You can install Meteor either via

```bash
$ curl https://install.meteor.com/ | sh
```

or via 

```bash
$ npm install -g meteor
```

Then you need to clone this repository and install the NPM dependencies:

```bash
$ git clone git@github.com:classroom-interaction-environment/claire.git
# alternatively use https if you don't have ssh access:
# git clone https://github.com/classroom-interaction-environment/claire.git
```

Then you need to cd into the `src` folder, install npm dependencies and finally start the app via
the provided run script:

```bash
$ cd src
$ meteor npm install
$ ./scripts/run.sh
```

### Architecture

We have decided to make CLAIRE explicitly monolithic and self-contained.
It does not rely on third-party services (except an Email-Provider but you could
also configure your server to send emails).

However, in order to keep things flexible we decided to add a plugin system, so
you can extend CLAIRE on your own without the need to get involved into the core
codebase.

### Project structure

The following section describes the folder structure and their respective role in the project.
Each of them has it's own README that describes the conventions and roles of it's content and subfolders.

|Folder| Description|
|------| -----------|
|`app`|The Meteor project, containing the CLAIRE application|
|`docs`|Documentation of the project| 
|`specs`|Specification and convetions of the project| 
|`lib`|Library with internal packages, that are also publicly available|
|`resources`|Global development resources and assets|
|`scripts`|Global scripts for common managing tasks|

Furthermore, there are folders, that you may use for specific purposes but which are ignored by default using the [.gitignore](.gitignore):


|Folder| Description|
|------| -----------|
|`bulds`|Target folder for build outputs. Used when locally building instead of deploying to a server|
|`extlib`|Library for external packages, which can be cloned and linked for debugging or package-development purposes| 
|`node_modules`|Contains NPM dependencies|
|`.idea`, `.vscode`, `.atom`|IDE SPecific configurations| 


### Developing for Desktop / Web

CLAIRE supports multiple platform targets. The supported platforms are described in the following sections.
To develop for the web, you only need a browser in order to run CLAIRE. Any modern browser will be sufficient.

#### Run the app

Use the run script to run the app:

```bash
$ ./scripts/run.js
```

#### Run the tests

We use the following test stack:

- [mocha](https://mochajs.org/) (testrunner)
- [chai](https://www.chaijs.com/) (asserter)
- [sinon](https://sinonjs.org/) (mocks, stubs)
- [istanbul/nyc](https://istanbul.js.org/) (coverage)

We created a sophisticated test script to ease up different test setups:

```bash
$ ./scripts/test.sh [ options ]
```

where `options` allows for the following parameters (accepts multiple at the same time):

| Parameter | Argument   | Description                                               |
|-----------|------------|-----------------------------------------------------------|
| -a        | `<String>` | Filter architecture, allowed values: `server` or `client` |
| -b        |            | Use a real browser for client tests (default is headless) |
| -c        |            | Activate code-coverage reports                            |
 | -g        | `<RegExp>` | Filter tests by a given `RegExp` (uses Mocha-grep)          |
| -h        |            | Show help                                                 |
| -o        |            | Runs the tests only once (default is watch-mode)          |
| -v        |            | Verbose mode with extra prints                            |

Running only server-side tests (-a) once (-o) with coverage (-c) would result in the following command:

```bash
$ ./scripts/test.sh -o -c -a server
```


## Credits and Contributors

CLAIRE has been developed as part of the research project "CARO - Care Reflexion Online"
and has received funding from the German Federal Ministry of Education and Research (FKN: 01PD15012)
as well as the ESF (European Social Func).

## License

This work is published unter AGPL-3.0 as stated in the [license file](./LICENSE).
