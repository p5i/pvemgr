#!/bin/bash

#
# Creating new VM by cloning from template then cleaning and preparing image
# Tested on Ubuntu 16.04
# Working with PVE default local storage directory in /var/lib/vz
# Parameters:
# -t | --target-name (tname) -- target hostname and VM name
# -s | --template-vmid (tmpl) -- VMID of template
# -n | --node (node) -- PVE host
# --node-address (nodeaddress) -- PVE host address if differ from node name
# -i | --target-vmid (id) -- try use this id for new VM
# -d | --temp-dir (tmpdir) -- directory to mount SSHFS
# -a | --ip-address (ip) -- ip address for new VM; if not provided, no static network configured
# -m | --mask (mask) -- netmask
# -g | --gateway (gateway) -- default gateway used in case of network configuration
# -S | --storage (storage) -- target storage ID
# -v | --vlan (vlan) -- Change interface VLAN tag to specified
# -V | --vm (vm) -- VM name if different from hostname
# -p | --pool (pool) -- Pool ID
# --DO_PVE (do_pve) -- add commands to create clone from PVE template
# --DO_START (do_start) -- start new VM
#
# Usage example:
#   ./prepclone.sh -a 10.10.10.117 -t sa-prephost02 -S local -g 10.10.10.254 -i 9360 -s 9005 -v 10
#

# Default values
tname=sa-newclone00
tmpl=9004
node=rox01
id=9101
mask=255.255.255.0


# FUNCTIONS
# HELP
display_help () {
   echo Read comments and code
}
 
while :
do
    case "$1" in
      -t | --target-name)
      tname="$2"
      shift 2
      ;;
      -s | --template-vmid)
      tmpl="$2"
      shift 2
      ;;
      -i | --target-vmid)
      id="$2"
      shift 2
      ;;
      -n | --node)
      node="$2"
      shift 2
      ;;
      -d | --temp-dir)
      tmpdir="$2"
      shift 2
      ;;
      -a | --ip-address)
      ip="$2"
      shift 2
      ;;
      -S | --storage)
      storage="$2"
      shift 2
      ;;
      -m | --mask)
      mask="$2"
      shift 2
      ;;
      -g | --gateway)
      gateway="$2"
      shift 2
      ;;
      -v | --vlan)
      vlan="$2"
      shift 2
      ;;
      -V | --vm)
      vm="$2"
      shift 2
      ;;
      --node-address)
      nodeaddress="$2"
      shift 2
      ;;
      -p | --pool)
      pool="$2"
      shift 2
      ;;
      --DO_PVE)
      do_pve=1
      shift
      ;;
      --DO_START)
      do_start=1
      shift
      ;;
      -h | --help)
      display_help  # Call your function
      # no shifting needed here, we're done.
      exit 0
      ;;
      --) # End of all options
      shift
      break;
      ;;
      -*)
      echo "Error: Unknown option: $1" >&2
      exit 1
      ;;
      *)  # No more options
      break
      ;;
    esac
done
 
MYPID=$$
nodeaddress=${nodeaddress:-$node}
vm=${vm:-$tname}
if [ -z "$tmpdir" ]; then
   tmpdir=/mnt/tmpsshfs_${nodeaddress}_$MYPID
fi

trap "umount $tmpdir" EXIT

echo cloning $tmpl to $vm $id $ip on $node, working in $tmpdir
umount $tmpdir
mkdir $tmpdir
sshfs root@$nodeaddress:/var/lib/vz/images/ $tmpdir || { echo "error mounting sshfs" ; exit; }
for newid in $(seq $id $((id+20))); do
   echo trying: ssh $nodeaddress pvesh create /nodes/$node/qemu/$tmpl/clone -newid $newid -name $vm
   (ssh $nodeaddress "pvesh create /nodes/$node/qemu/$tmpl/clone -newid $newid -name $vm") && break
   false
done
(($? != 0)) && { echo "Too many create VM retries; Probably wrong VMID" ; exit; }

echo $newid

if [ -n "$pool" ]; then
   ssh $nodeaddress "pvesh set pools/$pool -vms $newid"
fi

if [ -n "$ip" ]; then
   if [ -n "$gateway" ]; then
      commandplus="$commandplus; sed -ri 's/(iface .* )dhcp/\1static\n\taddress $ip\n\tnetmask $mask\n\tgateway $gateway/' /etc/network/interfaces"
   else
      commandplus="$commandplus; sed -ri 's/(iface .* )dhcp/\1static\n\taddress $ip\n\tnetmask $mask/' /etc/network/interfaces"
   fi
fi
if [ -n "$do_pve" ]; then
   commandplus=$(cat <<-EOF
	$commandplus
	sed -ri 's/^.* pvelocalhost$/$ip $tname ${tname%%.*} pvelocalhost/' /etc/hosts
	rm /etc/issue
	sed -ri 's/^myhostname=.*/myhostname=$tname/' /etc/postfix/main.cf
	newaliases
	rm -r /var/lib/rrdcached/db/pve2-node/* /var/lib/rrdcached/db/pve2-storage/* /var/lib/rrdcached/journal/*
	EOF
   )
   fbcmdplus=$(cat <<-EOF
	$fbcmdplus
	date
	echo waiting for PVE cluster services to start
	sleep 30
	echo reconfiguring openssh-server
	dpkg-reconfigure --frontend=noninteractive openssh-server
	echo changing root ssh key
	rm /root/.ssh/id_rsa
	ssh-keygen -q -t rsa -N "" -f /root/.ssh/id_rsa
	sed -i '/ root@/d' /etc/pve/priv/authorized_keys
	cat /root/.ssh/id_rsa.pub >> /etc/pve/priv/authorized_keys
	echo restarting pve-cluster service to update PVE ssh key files like /etc/pve/priv/known_hosts, if not updated already
	systemctl restart pve-cluster
	echo removing pve00 node files
	rm -r /etc/pve/nodes/pve00
	echo updating certificates
	rm /etc/pve/pve-root-ca.* /etc/pve/nodes/*/pve-ssl.*
	pvecm updatecerts -f
	systemctl restart pveproxy.service
	echo end of firstboot script
	date
	EOF
   )
fi
virt-sysprep --operations lvm-uuids,customize --hostname $tname -a $tmpdir/$newid/vm-$newid-disk-1.qcow2
virt-sysprep --operations customize -a $tmpdir/$newid/vm-$newid-disk-1.qcow2 \
  --run-command "update-grub;grub-install /dev/sda$commandplus" \
  --firstboot-command ":$fbcmdplus"
if [ -n "$storage" ]; then
   ssh $nodeaddress "pvesh create /nodes/$node/qemu/$newid/move_disk -disk scsi0 -storage $storage -delete 1"
fi
if [ -n "$vlan" ]; then
   strNet0=$( ssh $nodeaddress pvesh get /nodes/$node/qemu/$newid/config 2>/dev/null | jq .net0 | sed -r "s/tag=[0-9]+/tag=$vlan/" )
   ssh $nodeaddress pvesh set /nodes/$node/qemu/$newid/config  -net0 $strNet0
fi
if [ -n "$do_start" ]; then
   ssh $nodeaddress pvesh create /nodes/$node/qemu/$newid/status/start
fi
