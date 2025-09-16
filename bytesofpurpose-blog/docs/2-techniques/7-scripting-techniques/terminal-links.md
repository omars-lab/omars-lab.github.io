---
title: 'Terminal Links'
description: 'How can I embedd a link in terminal output?'
slug: mechanic-terminal-links
authors: [oeid]
tags: []
image: https://i.imgur.com/mErPwqL.png
---
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<!-- https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda -->

<Tabs>

<TabItem value="py" label="Python">

```py
#!/usr/bin/env python3
# https://realpython.com/lessons/ansi-escape-sequences/
def link(text, link):
    return f'\033]8;;{link}\a{text}\033]8;;\a'
# The following two are equivalent ...
print('\033]8;;http://example.com\aThis is a link\033]8;;\a')
print(link('This is a link.', 'http://example.com'))
```
</TabItem>

<TabItem value="bash" label="Bash">

```shell
#!/bin/bash
# https://unix.stackexchange.com/questions/284476/terminal-create-hyperlinks
echo -e '\e]8;;http://example.com\aThis is a link\e]8;;\a'
# https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda
printf '\e]8;;http://example.com\e\\This is a link\e]8;;\e\\\n'
```

</TabItem>

</Tabs>
