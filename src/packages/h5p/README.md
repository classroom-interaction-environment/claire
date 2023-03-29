# Meteor + H5P

This Meteor package adds full-scale functional H5P integration, powered by
[@lumieducation/h5p-nodejs-library](https://github.com/Lumieducation/H5P-Nodejs-library). Provided to you in the typical
out-of-the-box Meteor way.

## What is H5P

If you are not familiar with H5P, you should take a look at https://h5p.org/ and read about it. Summarized, it provides
a wide variety of configurable interaction formats and items to your system.

## Installation

This package is the core package, which you can install via

```shell
$ meteor add claire:h5p
```

Dependeing on your client you need to install the client package either. CLAIRE provides animplementation for Blaze
via  `claire:h5p-client-blaze`.

After the package is installed you need to **initialize it** by providing proper configuration. You should do this
during startup:

```js
// on server
import H5P from 'meteor/claire:h5p'

H5P.config({
  core: {
    fetchingDisabled: 0,
    uuid: "8de62c47-f335-42f6-909d-2d8f4b7fb7f5",
    siteType: "local",
    sendUsageStatistics: false,
    hubRegistrationEndpoint: "https://api.h5p.org/v1/sites",
    hubContentTypesEndpoint: "https://api.h5p.org/v1/content-types/",
    contentTypeCacheRefreshInterval: 86400000,
    contentUserDataUrl: "/contentUserData",
    contentUserStateSaveInterval: 5000,
    enableLrsContentTypes: true,
    setFinishedEnabled: true,
    editorAddons: {
      "H5P.CoursePresentation": ["H5P.MathDisplay"],
      "H5P.InteractiveVideo": ["H5P.MathDisplay"],
      "H5P.DragQuestion": ["H5P.MathDisplay"]
    },
    theme: {
      backgroundColor: "#222b37",
      secondaryBackgroundColor: "#333d49",
      fontColor: "#ffffff",
      disabledFontColor: "#a0a0a1",
      primaryColor: "#7636dc",
      primaryContrastColor: "#ffffff",
      secondaryColor: "#3d66ff",
      secondaryContrastColor: "#ffffff",
      dividerColor: "#45505d",
      warningColor: "#e67e22",
      warningContrastColor: "#000000",
      successColor: "#27ae60",
      successContrastColor: "#FFFFFF",
      errorColor: "#c0392b",
      errorContrastColor: "#FFFFFF",
      fontFamily: "'Courier'",
      buttonBorderRadius: "0.5em"
    }
  },
  defaultUserPrivileges: {
    canInstallRecommended: false,
    canUpdateAndInstallLibraries: false,
    canCreateRestricted: false
  },
  maintenance: {
    cleanTempFiles: 300000,
    updateContentCache: 720000
  }
})
```

H5P allows you to translate the editor and certain content labels.
In order to support translations, you need to pass in the following
config, using a i18n provider of your choice:

```js
H5P.i18n({
  add: (config) => undefined,
  getLocale: () => String,
  translate: (key, lang) => String
})
```

You also need to create Methods, Endpoints, Publicatoins. In order to avoid unnecessary dependencies we provide a
callback based solution, so you can use your own environment to create the infrastructure:

```js
H5P.methods(definitions => Meteor.Method)
```

## How it works

- why this package
- what it all contains
    - collections
    - storages
    - methods
    - routes
- what you need to add yourself

## Development and testing

- read the lumi docs

## License and legal

This project has dervied from[@lumieducation/h5p-nodejs-library](https://github.com/Lumieducation/H5P-Nodejs-library),
which itself derived from the original h5p core code libraries [core](https://github.com/h5p/h5p-php-library), which is
GPL-3.0 licensed.

**Therefore, this package is also GPL-3.0 licensed.**

---
This work obtained financial support for development from the German BMBF-sponsored research project "lea.online -" (
FKN: 41200147). Read more about them at the following websites:

- lea.online Blog (German) - blogs.uni-bremen.de/leaonline
- University of Bremen - https://www.uni-bremen.de/en.html
- BMBF - https://www.bmbf.de/en/index.html

---
This work obtained financial support for development from the German BMBF-sponsored research project "CARO - Care
Reflection Online" (FKN: 01PD15012).

Read more about them at the following websites:

    CARO - https://blogs.uni-bremen.de/caroprojekt/
    University of Bremen - https://www.uni-bremen.de/en.html
    BMBF - https://www.bmbf.de/en/index.html
