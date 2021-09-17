#!/bin/bash
# https://unix.stackexchange.com/questions/284476/terminal-create-hyperlinks
echo -e '\e]8;;http://example.com\aThis is a link\e]8;;\a'
# https://gist.github.com/egmontkob/eb114294efbcd5adb1944c9f3cb5feda
printf '\e]8;;http://example.com\e\\This is a link\e]8;;\e\\\n'

