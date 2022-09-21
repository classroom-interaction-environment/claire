# Curriculum

CLAIRE uses a fixed entity system for curriculum building. The concepts should apply to many 
curricular macro-structures, while it keep the constraints to an interactionistic didactical model (a model
contrary to behaviourist models).
If the model does not fit your needs you may rather use a classical LMS, instead of CLAIRE.

## Blueprints vs custom units

The curriculum allows to create blueprints or templates that can later be used by teachers.
Teachers can still modify these units to their custom needs to prepare for their next lessons.
Finally, teachers can also create completely custom units!

A mix of all three is possible, too. For example: 

- the macro curriculum could define overall topics and units but not how units are structured
- teachers can pick up the units but are entirely free to build them on their own

in contrast:

- the curriculum could even define entire units including material and phase schemas
- teachers would just need to review these materials and instantly start the lesson the next day

or:

- instituions do not provide any structure or have it defined externally
- teachers can use CLAIRE for just a few single custom units, built from scratch

Many combinaitons are posisble.

## Macrostructure

The following macrostructure can be leveraged to model a curriculum:

| Name      | Description                                                                                                                | Example                                     |
|-----------|----------------------------------------------------------------------------------------------------------------------------|---------------------------------------------|
| Dimension | An element of the overall didactical model, that defines aspects of the nature of the topic.                               ||
| Objective | An achievable goal, such as competencies or informal achievements.                                                         | Can read a simple text; First unit completed |
| Pocket    | A collection of units with a contextual base or base-topic. Alternatively named modules.                                   | Fundamentals of XYZ                         |
| Unit      | A blueprint for a topic or subject within the larger pocket (module). Can spread across one or many lessons.               | Introduction to fundamentals of XYZ         |
| Phase*    | A specific part within a unit, executed in the lessons, often bonud to certain material, social states, interactions, etc. ||

You can use CLAIRE to model a curriclum only using these macro structures

*The phase is in between macro- and microstructures, because they usually already define how certain aspects 
of a unit is designed. However it's possible to model phases without linking concrete methods or material and let this
decision to remain open to teachers' individual preferences.

The macrostructure can only be edited by users with the `curriculum` role using the curriculum editor.

## Microstructure

While macrostructure targets rather institutional requirements there is also a way to model
the microstructures of a single unit. This is mostly the realm of the teachers that will execute the lessons.

### Phase microstructure

The `Phase` acts as a bridge between the macro- and microstructure. 
It contains a few definitions, that are crucial parts of the classroom situation:

- title
- period (in minutes; an estimation or expected value; used only for teacher's self-guidance)
- method (the teaching method)
- social state (single, plenum, group work)
- referenced material (1..n)

### Material

CLAIRE defines a few default materials, that are a fundamental part of the teaching.
They make up the microstructure of a unit and can be linked to Phases or uses as "global" materials
during a lesson.

Every material that is added to a Unit can be activated for display on the student devices, as well as the beamer.

| Name             | Description                                                                   | Example                           |
|------------------|-------------------------------------------------------------------------------|-----------------------------------|
| Task             | Contains static and interactive parts (items) that require student responses. | See the [tasks guide](./TASKS.md) |
| ImageFiles       |||
| AudioFiles       |||
| VideoFiles       |||
| LinkedResource   |||
| EmbeddedResource |||
| Literature       |||

Custom materials can soon be registered using the plugin registry.
