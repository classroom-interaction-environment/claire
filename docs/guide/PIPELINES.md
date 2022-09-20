# Pipelines and the build system

CLAIRE makes heavily use of the decorator pattern but in a custom way:

Context-categories share the same functionality and we use pipelines
to decorate contexts with these functionalities, depending on the categories
they are associated with.

For example:

An `ImageFiles` context may exist in all categories

- Classroom - because teachers may want to display images on the beamer
- Material - because we may want to upload images as part of a unit or task
- Curriculum - because we may need to define image material as part of our 
  master units
- Files - because the underlying storage is a FilesCollection, accessing GridFS

We therefore define `ImageFiles` with a minimal set of information that allows
the system to detect it's identity (like an interface) and then use the 
pipelines of each of these categories to  decorate properties to this context.

With all these properties we can send the `ImageFiles` to all the factories 
(Methods, Publications, Collection, FilesCollection) and can immediately use
the context in all views that are associated with the respective category.
