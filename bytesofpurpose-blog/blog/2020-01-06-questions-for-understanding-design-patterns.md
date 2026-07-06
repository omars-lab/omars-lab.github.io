---
slug: questions-for-understanding-design-patterns
title: "Questions for Understanding Design Patterns"
description: "A reader's question-set for working through the classic Gang of Four Design Patterns book — the questions that actually unlock object-oriented design."
authors: [oeid]
tags: [software-engineering, design-patterns, question-set, best-practices]
date: 2020-01-06
draft: true
---

When I first sat down with *Design Patterns: Elements of Reusable Object-Oriented Software* (Gamma, Helm, Johnson, and Vlissides — the "Gang of Four"), I didn't take notes the usual way. Instead of summarizing what the book said, I wrote down the **questions** each section was answering. A pattern only sticks once you can state the problem it solves, so a good question is worth more than a tidy summary.

What follows is that question-set: the questions I'd want a reader to be able to answer after a careful first pass through the book's introduction. Use them as a study guide, a self-quiz, or a checklist for whether a chapter actually landed.

<!-- truncate -->

## What design patterns are for

- How is the quality of an object-oriented system measured?
- How can developers leverage the expertise of other skilled architects and developers?
- How does one design reusable object-oriented software — and what constraints must the design meet to do so?
- How can a design be tested to ensure it is reusable?
- What do experienced designers know that beginners don't? What traps do they avoid, and how do they steer clear of design déjà vu — solving the same problem the same wrong way again?
- What activities do design patterns facilitate?
- What are the essential elements of a design pattern?

## Reading and organizing the catalog

- How can a developer's point of view change how they understand a pattern? What makes one person see a pattern where another just sees a building block?
- How can the choice of programming language change how a pattern is interpreted? Are all patterns applicable to every language? How do patterns translate between declarative and imperative languages?
- How do we describe a design pattern in detail?
- What is the *intent* of each pattern?
- How are the patterns organized, and what are the relationships between them?

## Solving design problems

- How do patterns help solve design problems?
- How do you decompose a problem into a relevant set of objects and the interactions between them?
  - What is the description of an object, and how do programming languages commonly interact with objects?
  - What is dynamic binding?
  - How do you decide what should be an object at all?
- How do patterns help you design interfaces, and how do they establish relationships between interfaces?

## Modeling classes and relationships

- How are object implementations (classes) represented in UML?
- How do you represent an abstract class in a UML diagram — and how do you tell that a class *is* abstract? What is an abstract class?
- How do you represent inheritance in a UML diagram? What is inheritance?
- What is the difference between a class and a type?
- What is the difference between class inheritance and interface inheritance?
- Why is it important to program to an interface, not an implementation?
- How does a class reference another class in UML?
- How is *acquaintance* modeled in UML, and what is an acquaintance?
- How is *aggregation* modeled in UML, and what is aggregation?

## Reuse: inheritance vs. composition

- How can functionality be reused in object-oriented systems?
- How does reuse through inheritance differ from reuse through composition?
  - What is white-box reuse? What is black-box reuse?
  - Why is "favor object composition over class inheritance" considered a principle of object-oriented design?
  - How can delegation make composition functionally equivalent to inheritance?
  - How can parameterized types be used to reuse functionality? In which languages are parameterized types available?
  - How does the runtime performance of composition compare to inheritance?
- What is the runtime versus compile-time structure of each pattern?

## Designing for change

- What must you consider when designing a system for change?
- How do design patterns help you design systems for change?
- How do patterns fit into the different ways a software application can be distributed?
  - What are the different ways a program can be distributed?
  - How do patterns benefit an *application*? What is an application?
  - How do patterns benefit a *toolkit*? What is a toolkit?
  - What is a *framework*? What is inversion of control? What are the pros and cons of using a framework, and what risks do you incur? How do patterns help you build good frameworks — and how do patterns differ from frameworks?
  - Which is harder to design: applications, toolkits, or frameworks?

## Actually using them

- How do you select which design pattern to use?
- How do you use a design pattern once you've chosen it?

---

> These questions follow the introduction of *Design Patterns: Elements of Reusable Object-Oriented Software* by Erich Gamma, Richard Helm, Ralph Johnson, and John Vlissides (Addison-Wesley, 1994). The questions are mine; the book is theirs — go read it.
