# Developer Readme for 4Minitz

## General Info
* We use this [successful git branching strategy](http://nvie.com/posts/a-successful-git-branching-model/)
* For generating the UML figures in this doc we use [PlantUML](http://plantuml.com/)
  (respective the [PlantUML plugin](https://plugins.jetbrains.com/plugin/7017?pr=) for JetBrains products)
* We use ES2015 (ES6) as we make progress in learning it.

## Where to start
Our work-horses are the classes in /imports/ (e.g. meetingseries.js, minutes.js).
They build a facade for the underlying MongoCollections and enrich them with convencience methods.

## Use Cases
![Use Case: Roles](./figures/usecases1.png)


## Class Diagrams
![Classes: Basic](./figures/classdiagram1.png)


## Sequence Diagrams
![Sequence: Add Minutes to MeetingSeries](./figures/seqMinutesAdd.png)

