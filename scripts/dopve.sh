set -x

startvm=$1
endvm=$2
numguests=${3:-4}
NUMs=$(seq $startvm $endvm)
IPs=$(for i in $(seq $startvm $endvm); do printf "10.14.31.$i "; done)
vNODEs=$(for i in $(seq $startvm $endvm); do printf "pve%02d " $i; done)
GUESTs=$(for g in $(seq 1 $numguests); do printf "2%03d " $g; done)
echo First $startvm
echo Last $endvm
echo NUMs $NUMs
echo IPs $IPs
echo vNODEs $vNODEs
echo GUESTs $GUESTs

echo "Пробный запуск"
exit

read -s -n1 -r -p "Press any key to continue..."$'\n' key

# Clone and start nodes
for i in $NUMs; do ~/PVE/deploy/prepclone.sh -i 92$i -s 9203 -V pve$i -t pve$i.medlinx.corp -v 1431 -a 10.14.31.$i -g 10.14.31.254 --DO_PVE; done
for i in $NUMs; do ssh root@rox01 pvesh create nodes/rox01/qemu/92$i/status/start; done
sleep 120
for i in $NUMs; do ssh rox01 "bash -s" < PVE/agent_ip.sh 92$i; done
for i in $NUMs; do ssh-keygen -R 10.14.31.$i; done

#Upgrade
parallel-ssh -O StrictHostKeyChecking=no -H "$IPs" -i apt update
parallel-ssh -O StrictHostKeyChecking=no -H "$IPs" -i apt -y dist-upgrade

# Add disks
for i in $NUMs; do PVE/deploy/add-disk.sh rox01 92$i scsi1 20 adm; PVE/deploy/add-disk.sh rox01 92$i scsi2 20 adm; done

# Create cluster
ssh 10.14.31.$startvm pvecm create PVE00
sleep 30
for i in $(seq $((startvm+1)) $endvm); do ssh 10.14.31.$i cat .ssh/id_rsa.pub | ssh 10.14.31.$startvm 'cat >> .ssh/authorized_keys' ; done
for i in $(seq $((startvm+1)) $endvm); do ssh 10.14.31.$i ssh-keyscan 10.14.31.$startvm '>>' .ssh/known_hosts  ; done
for i in $(seq $((startvm+1)) $endvm); do ssh 10.14.31.$i pvecm add 10.14.31.$startvm; sleep 10 ; done
ssh 10.14.31.$startvm pvecm status

# Add NFS storage
ssh 10.14.31.$startvm 'pvesm add nfs NFSTEST --server 10.10.10.22 --export /RAID6/PVETEST1 --content "vztmpl backup images iso"'

# Deploying guests
ssh 10.14.31.$startvm 'qmrestore NFSTEST:backup/vzdump-qemu-9006-2017_09_06-13_02_22.vma.lzo 100'
ssh 10.14.31.$startvm "pvesh set /nodes/pve$startvm/qemu/100/config -net0 'model=virtio,bridge=vmbr0'"
ssh 10.14.31.$startvm "pvesh create /nodes/pve$startvm/qemu/100/template"
for i in $GUESTs; do ~/PVE/deploy/prepclone.sh -n pve$startvm --node-address 10.14.31.$startvm -i $i -s 100 -t t$i; done
exit
for i in $GUESTs; do ssh 10.14.31.$startvm pvesh create nodes/pve$startvm/qemu/$i/status/start; done
sleep 60
for i in $GUESTs; do ssh 10.14.31.$startvm "bash -s" < PVE/agent_ip.sh $i; done

