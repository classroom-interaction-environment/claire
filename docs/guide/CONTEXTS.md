# Contexts

In CLAIRE we have defined a way to communicate various educational domains
through context-categories and aspects of these through static contexts.

The current supported categories are

- System
- Curriculum
- Material
- Files
- Classroom

A category summarizes common properties and behavior of contexts, 
if they belong to this category.

For example:

- A Files context will always define an object with `files` properties like
  `maxSize` for upload size or a `converter` function to create compressed 
  versions of the file.
- it will also be decorated with default methods and publications, that are 
  solely purposed for Files functionality
  
- A material context will always define `renderers` which are required to 
  properly render the material in lists, previews or tasks
  
- it will also be decorated with methods and publications that are required for
  use with the unit editor or task editor
  
See more in the category-specific sections below

## System

## Curriculum

## Material

A material context will always define a `material` property, which is an Object
with the following members:

```js
{
  renderer: {} // see below  
}
````


`renderer` - An object with several renderer definitions, where a renderer is a
             Blaze Template, which receives the material document to render the 
             material
             
It is defined as

```js
{
  name: String, // name of the entry in the object
  template: String, // name of the Template
  load: async function // returns a dynamic import to the template
}
```

Possible entries are

- `default` - a fallback that is used if the specific renderer is not found
- `preview` - for previewing the material in the editor
- `list` - display material properties in a list
- `task` - to display material within a task

## Files

```js
{
  debug: Boolean | undefined,   // debug upload / download
  bucketName: String,           // bucket used to store binary
  type: FileTypes,              // one of the primary file types
  extensions: [String],         // like ['jpg', 'png'] no dots allowed here
  accept: String,               // accept string like 'adio/*'  or '.jpg,.png'
  maxSize: Number,              // integer; bytes size for upload limit
  usePartialResponse: Boolean | undefined // prefer 206 for streaming
}
```

## Classroom

## Response Processor

This category has intersections with classroom but can also be used outside.
It defines contexts, where responses are "processed" to a certain output.

For example:

- inquired responses from the class are aggregated into a visualization
- personal responses from a single user is piped into an evaluation editor

An RP can create artifacts, for example an evaluation editor may result into
a "score" artifact for the given item.

A response processor is a context, that defines the `responseProcessor` 
property, which itself contains the following definitions:

```js
{
  type: ResponseProcessorTypes,    // aggregate or evaluate
  dataTypes: [ResponseDataTypes],  // multiple types are allowed
  fileType: FileTypes | undefined, // only if targeting files
  renderer: {                      // renderer Template
    template: String,
    load: async function
  }
}
```