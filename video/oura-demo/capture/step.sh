#!/bin/bash
# usage: step.sh '[["kind","val"],...]'  appends to /tmp/A.json and runs
A=$(python3 -c "import json,sys;a=json.load(open('/tmp/A.json'));a+=json.loads(sys.argv[1]);print(json.dumps(a))" "$1")
echo "$A" > /tmp/A.json
timeout 170 python3 quiz_probe.py "$A" | grep -v "^BUTTONS" | head -60
