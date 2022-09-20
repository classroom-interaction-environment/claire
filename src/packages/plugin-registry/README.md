# CLAIRE Plugin Registry

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
![GitHub](https://img.shields.io/github/license/leaonline/method-factory)

This package is required to register and dynamically load plugins into CLAIRE.
Every plugin type has it's own specific conventions, which are documented here.

## Teaching Material

TBD

## Task Elements

TBD

## Items

In order to register items, the `ItemPlugins` export is required:

```javascript
import { ItemPLugins } from 'meteor/claire:plugin-registry'
```

### Inject helpers

To ease development and prevent plugins from hard-wiring extra packages for 
common tasks (like translation) it provides a few helpers for injecting these
dependencies.

**Note:**

This guide covers the usage within the host application (CLAIRE or your
own system) and within the plugins. **If you are a plugin developer then you can
ignore the code examples for the host applications.**

### Method `translate`

Inject a function, that resolves a translation id (i18n String) to a translated
label. If called without arguments, returns the injected translator.


In your host application:
```javascript
import { ItemPlugins } from 'meteor/claire:plugin-registry'

ItemPlugins.translate((i18nString, ...options) => i18n.get(i18nString, ...options))
```

Use this inside your plugin package:

```javascript
import { ItemPlugins } from 'meteor/claire:plugin-registry'

const translate = ItemPlugins.translate() // returns the translator function
translate('example.title')
```

### Method `translateReactive`

Use this after the translator has been injected. Returns a function that calls
the translator. Use this to reactively translate labels in the schema.

In your host application:
```javascript
import { ItemPlugins } from 'meteor/claire:plugin-registry'

ItemPlugins.translate((i18nString, ...options) => i18n.get(i18nString, ...options))
```

Use this inside your plugin package:

```javascript
import { ItemPlugins } from 'meteor/claire:plugin-registry'

const translateReactive = ItemPlugins.translateReactive() // returns the translator function

export const ItemExample = {
  // ...
  edit () {
    return {
      minValue: {
        type: Number,
        label: translateReactive('form.minValue'),
        defaultValue: 0
      },
      maxValue: {
        type: Number,
        label: translateReactive('form.maxValue'),
        defaultValue: 100
      }
    }
  },
  // ...
}
```

### Method `onLanguageChange`

Plugins may define labels, which are not covered by the host's translation files
and therefore need to deliver their own translations.

The `ItemPlugins` offers a flexible way to reactively update labels for multiple
languages.

Host:

The host will have to implement a reactive language change-detection and 
passes the current locale code to the `ItemPlugins.onLanguageChange` function.

Since this function returns a promise the host will have to catch/then the
response and update the internal translation base for the given code:

```javascript
import { ItemPlugins } from 'meteor/claire:plugin-registry'

Tracker.autorun(() => {
  const langCode = currentLocal() // implement on your own, needs to be reactive
  
  ItemPlugins.onLanguageChange(langCode)
    .catch(e => console.error(e))
    .then(allTranslations => {
      allTranslations.forEach(lang => {
        updateLang(langCode, lang) // impement on your own to add new labels
      })
    }) 
})
```



Plugin:

First, there needs to be a language JSON file for each supported language.
Then there needs to be a function, where the file is dynamically loaded by a 
given language code. This function must be registered via `onLanguageChange`:

```javascript
import { ItemPlugins } from 'meteor/claire:plugin-registry'

ItemPlugins.onLanguageChange(langCode => {
  switch (langCode) {
    case 'de':
      return import('./de.json')
  } 
})
```


### Method `categories`

Register a function, that resolves to the current available categories.
Pass no value to get all the available categories:

 In your host application:
 ```javascript
 import { ItemPlugins } from 'meteor/claire:plugin-registry'
 
 // It's your responsibility to manage all categories in your own systems.
 // In CAIRE see the {Item} class.
 
 ItemPlugins.categories(() => Object.fromEntries(Item.categories.entries()))
 ```
 
 Use this inside your plugin package:
 
 ```javascript
 import { ItemPlugins } from 'meteor/claire:plugin-registry'
 
 const Categories = ItemPlugins.categories()
 
 export const ItemExample = {
  // ...
  category: Categories.numerical,
  // ...
 }
 ```

### Method `dataTypes`

Register a function, that resolves to the current available dataTypes.
Pass no value to get all the available dataTypes:

 In your host application:
 ```javascript
 import { ItemPlugins } from 'meteor/claire:plugin-registry'
 
 // It's your responsibility to manage all dataTypes in your own systems.
 // In CAIRE see the {ResponseDataTypes} class.
 
 ItemPlugins.dataTypes(() => ResponseDataTypes)
 ```
 
 Use this inside your plugin package:
 
 ```javascript
 import { ItemPlugins } from 'meteor/claire:plugin-registry'
 
 const DataTypes = ItemPlugins.dataTypes()
 
 export const ItemExample = {
  // ...
  dataType: DataTypes.numerical,
  // ...
 }
 ```

### Register Item

Registering an item plugin requires to be "added" in the package 
(so it auto-starts) at package build-time and should from there only dynamically
import the item plugin definition.

```javascript
Package.onUse(function (api) {
  api.versionsFrom('1.6')
  api.use('ecmascript')
  api.use('claire:plugin-registry') // required
  // ... add additional dependencies here
  api.addFiles('item-example.js')   // addFiles is required
})
```

In the added file the plugin is only registered, no additional imports should be
placed here:

*`item-example.js`*

```javascript
import { ItemPlugins } from 'meteor/claire:plugin-registry'

ItemPlugins.register('itemExample', async () => {
  const { ItemExample } = await import('./lib/ItemExample')
  return ItemExample
})
```

### Item Plugin Definitions

The plugin definitions requires certain definitions to categorize the plugin's
functionality and data-structure. The following is a general schema view of the
plugin:

```javascript
{
  name: String,
  label: String,
  icon: String,
  category: String|Object,
  dataType: String|Object,
  edit: injectedHelpers => Schema,
  item: injectedConfigs => Schema 
}
```

Let's take a closer look at the properties.

#### Property `name (String)`

Needs to exactly match the key, used to register the plugin.

#### Property `label (String)`

I18n compatible dot notation.

#### Property `icon (String)`

Font Awesome 4 or 5 compatible icon

#### Property `category (String|Object)`

The category is used to define a greater category from which this item extends
from. There are builtin categories, which define the most basic item types and
which can be used to extend items from:

```javascript
const TextItems = {
  name: 'textItems',
  label: 'itemTypes.text',
  icon: 'align-left',
  base: 'itemText' // base item is a default 'text' HTML input
}
```


```javascript
const ChoiceItems = {
  name: 'choiceItems',
  label: 'itemTypes.choices',
  icon: 'check-square',
  base: 'itemSingleSelect' // single choice with HTML select input 
}
```

```javascript
const MediaItems = {
  name: 'mediaItems',
  label: 'itemTypes.media',
  icon: 'upload' // base is an HTML file input 
}
```

```javascript
const NumericalItems = {
  name: 'numericalItems',
  label: 'itemTypes.numerical',
  icon: 'sliders',
  base: 'itemNumber' // base is an HTML number input
}
```

To list all the available categories, call `ItemPlugins.categories()`.

In order to use one of these categories, the `category` property should 
reference on of their `name` properties.

It is also possible to define an own category. If the `base` is a registered item
then all items from this category will extend this item's definition:

```javascript
{
  // ...
  category: {
    name: 'exampleItems',
    label: 'itemTypes.examples',
    icon: 'star',
    base: 'itemExample' // base is our above defined ItemExample
  }
  // ...
}
```


#### Property `dataType (Object)`

The datatype definition is important in order connect this item with a response
processor.

> A response processor uses the item's response (generated by user input) and 
> processes it to a defined output. The output can be anything imaginable, like
> a score, a chart, a text, a file a gallery etc.

The response processor, however is defined to use a certain schema of data. 
Only response processor with the same dataType definition can be connected with
responses from item-plugins registered.

If you introduce a new dataType, you need to create an register a response 
process that matches this dataType. Otherwise CLAIRE will fall back to a 
read-only display of the raw-response without further actions available.

The dataType is defined by the following schema:

```javascript
{
  name: String,
  type: Constructor,
  isArray: Boolean,
  from: response => Constructor(response)  
}
```

The current type requires a Constructor like `String`, `Number` etc. but 
supports custom constructors, like `function MyCustomConstructor () {}` or 
`class` based definitions.


To list all the available dataTypes, call `ItemPlugins.dataTypes()`.

#### Property `edit (Function)`

Returns the schema for the editor, that is used to edit (configure) the item's
appearance and behavior.

The edit function receives injected tools (currently only translation) and 
returns a schema definition that merges with the definition from the base schema
of the category. 

#### Property `item (Function)`

Returns the item schema, that is used to build and render the final item using
the configuration from the editor.

#### Full Example

*`lib/ItemExample.js`*

```javascript
import { ItemPlugins } from 'meteor/claire:plugin-registry'

export const ItemExample = {
  name: 'itemExample',
  label: 'item.example',
  icon: 'check',
  category: 'numerical',
  dataType: {
    name: 'numerical',
    type: Number,
    from: function (response) {
      return Number(response[0])
    }
  },
  edit () {
    return {
      minValue: {
        type: Number,
        label: translateReactive('form.minValue'),
        defaultValue: 0
      },
      maxValue: {
        type: Number,
        label: translateReactive('form.maxValue'),
        defaultValue: 100
      }
    }
  } ,
  item ({ itemId, minValue, maxValue }) {
    return {
      [itemId]: {
        type: Number,
        max: maxValue,
        min: minValue,
        autoform: {
          defaultValue: 0,
          type: 'number',
          class: 'my-4 p-4',
        }
      }
    }
  }
}
```

## Response Processors

TBD

## License

MIT License, see [LICENSE file](LICENSE)
