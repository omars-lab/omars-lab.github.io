---
title: 'JQ Mechanics'
description: 'What JQ mechanics do I commonly leverage?'
slug: jq-mechanics
authors: [oeid]
tags: []
image: https://i.imgur.com/mErPwqL.png
---

# JQ Command Examples

This document demonstrates powerful jq commands for JSON processing and manipulation.

## Mock Data Setup

First, let's create a mock JSON file to work with:

```bash
cat > mock_data.json << 'EOF'
{
  "logs": [
    {
      "id": "act_001",
      "eventTime": 1704067200000,
      "message": "Hello"
    },
    {
      "id": "act_002", 
      "eventTime": 1704153600000,
      "user": "How"
    },
    {
      "id": "act_003",
      "eventTime": 1704240000000,
      "user": "Are You?"
    }
  ]
}
EOF
```

## Example 1: Extract and Format Timestamps

**Command:**
```bash
cat mock_data.json \
    | jq -r '[ .logs | .[] | .eventTime] | sort | reverse | .[]' \
    | xargs -I {} bash -c 'date -r $(expr {} / 1000) 2>/dev/null || date -d @$(expr {} / 1000) 2>/dev/null'
```

**What this does:**
1. `cat mock_data.json` - Reads the JSON file
2. `jq -r '[ .logs | .[] | .eventTime] | sort | reverse | .[]'` - Extracts all eventTime timestamps, sorts them in reverse order, and outputs raw values
3. `xargs -I {} bash -c '...'` - For each timestamp, converts it to a readable date format
4. `date -r $(expr {} / 1000)` - Converts Unix timestamp (milliseconds) to date (macOS)
5. `date -d @$(expr {} / 1000)` - Converts Unix timestamp (milliseconds) to date (Linux)

**Expected Output:**
```
Fri Jan 05 12:00:00 UTC 2024
Thu Jan 04 12:00:00 UTC 2024
Wed Jan 03 12:00:00 UTC 2024
```

**Use Case**
I was debugging a systems logs to determine what the most recent time a set of logs occured on.


## Additional JQ Examples

### Filter by Status
```bash
cat mock_data.json | jq '.logs[] | select(.status == "completed")'
```

### Count Items
```bash
cat mock_data.json | jq '.logs | length'
```

### Group by User
```bash
cat mock_data.json | jq '.logs | group_by(.user) | map({user: .[0].user, count: length})'
```

### Extract Specific Fields
```bash
cat mock_data.json | jq '.logs[] | {id, user, duration: (.end - .eventTime)}'
```