#!/bin/bash

sleep 10

# $1 == VMID
VMID=$1

pid=$( (echo -e '{"execute": "guest-exec", "arguments": {"path": "ip", "arg": ["-o", "-4", "addr", "show", "scope", "global"], "capture-output": true}}'; sleep 0.5 ) \
   | socat - UNIX-CONNECT:/run/qemu-server/$VMID.qga \
   | jq .return.pid )
addrs=$( (echo -e '{"execute": "guest-exec-status", "arguments": {"pid": '$pid'}}'; sleep 0.5 ) \
   | socat - UNIX-CONNECT:/run/qemu-server/$VMID.qga \
   | jq .return.\"out-data\" \
   | base64 -di \
   | awk '{print $4}' \
)
[ -z "$addrs" ] && exit
addrs=$( echo IP: $addrs )
echo $addrs
Notes=$( qm config $VMID | sed -n '/^description: /s/^description: //p')
if [ -n "$Notes" ]; then
   if grep -qE 'IP%3A[^;]*;' <<< $Notes; then
      Notes=$( sed -r "s|IP%3A[^;]*;|$addrs;|" <<< $Notes )
   else
      Notes="$Notes%0A$addrs;"
   fi
else
   Notes="$addrs;"
fi
qm set $VMID -description "$Notes"
