---
title: 'JQ Mechanics'
description: 'What JQ mechanics do I commonly leverage?'
slug: jq-mechanics
authors: [oeid]
tags: []
image: https://i.imgur.com/mErPwqL.png
---

Bookmark of Instructions:

`cortex_cli_command v3/agents/instances/5b7daaf1d042e3552a1b73f5/dataset/activations | jq -r '[ .activations | .[] | .start] | sort | reverse | .[]' | xargs -I {} bash -c 'date -r $(expr {} / 1000) 2>/dev/null || date -d @$(expr {} / 1000)  2>/dev/null' | head -n 12`

`cortex tasks list noop --json | jq '.tasks|.[]|.createdAt' | sort -r | xargs -n 1 bash -c 'date -d @$(expr ${0} / 1000) '`