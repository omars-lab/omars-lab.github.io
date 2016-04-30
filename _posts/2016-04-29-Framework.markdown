---
published: true
title: Framework
layout: post
---

An example of all the blogging tools I currently have set up  


# Code Blocks
```python
print "Hello World"
```

# Flow Chart
<div id="flowchart_diagram"></div>
<script>
  var diagram = flowchart.parse(
    "st=>start: Start:>http://www.google.com[blank]" + "\n" +
    "e=>end:>http://www.google.com" + "\n" +
    "op1=>operation: My Operation" + "\n" +
    "sub1=>subroutine: My Subroutine" + "\n" +
    "cond=>condition: Yes" + "\n" +
    "or No?:>http://www.google.com" + "\n" +
    "io=>inputoutput: catch something..."" + "\n" +
    "st->op1->cond" + "\n" +
    "cond(yes)->io->e" + "\n" +
    "cond(no)->sub1(right)->op1" + "\n"
  );
  diagram.drawSVG('flowchart_diagram');
</script>

# Sequence Diagram
<div id="sequence_diagram"></div>
<script>
  var diagram = Diagram.parse("A->B: Message");
  diagram.drawSVG("sequence_diagram", {theme: 'hand'});
</script>

# Embedded Gists
{% gist 5555251 %}

# Single File From Gist
{% gist 5555251 gist.md %}

# Embedded Youtube
<div class="youtube" id="29MAL8pJImQ"></div>

# Embedded MindNodes
<div class="mindnode" id="hUeMkB8zxTG87BXHyJJWziGRgXTxyrTNqrk7yjYw"></div>

# Embedded HTML
<div><p align="center"><iframe width="800" height="800" src="/me.html" frameborder="0" allowfullscreen></iframe></p></div>
