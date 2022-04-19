#!/usr/bin/env python3

# https://realpython.com/lessons/ansi-escape-sequences/

def link(text, link):
    return f'\033]8;;{link}\a{text}\033]8;;\a'

# The following two are equivalent ...
print('\033]8;;http://example.com\aThis is a link\033]8;;\a')
print(link('This is a link.', 'http://example.com'))
