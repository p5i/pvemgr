#!/bin/false
# PODNAME: Net::Proxmox::VE::Nodes
# ABSTRACT: Functions for the 'nodes' portion of the API

use strict;
use warnings;

package Net::Proxmox::VE::Nodes;

use parent 'Exporter';

our @EXPORT  = qw( nodes );

=encoding utf8

=head1 SYNOPSIS

  # assuming $obj is a Net::Proxmox::VE object

=head1 METHODS

=head2 nodes

Returns the 'Cluster node index'

Note: Accessible by all authententicated users.

=cut

my $base = '/nodes';

sub nodes {

    my $self = shift or return;

    return $self->get($base)

}

=head2 get_nodes

Gets a single nodes details

  $ok = $obj->get_nodes('node')

node is a string in pve-node format

Note: Accessible by all authententicated users.

=cut

sub get_nodes {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes()';
    die 'node must be a scalar for get_nodes()' if ref $a;

    return $self->get( $base, $a )

}

=head2 get_nodes_aplinfo

Gets a single nodes list of appliances

  $ok = $obj->get_nodes_aplinfo('node')

node is a string in pve-node format

Note: Accessible by all authententicated users.

=cut

sub get_nodes_aplinfo {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes_aplinfo()';
    die 'node must be a scalar for get_nodes_aplinfo()' if ref $a;

    return $self->get( $base, $a, 'aplinfo' )

}

=head2 create_nodes_aplinfo

Create (upload) appliance templates.

  $ok = $obj->download_nodes_aplinfo('node',\%args)

node is a string in pve-node format

I<%args> may items contain from the following list

=over 4

=item storage

String. The storage to be used in pve-storage-id format. Required.

=item template

Data. The actual template. Required.

=back

Note: required permissions are ["perm","/storage/{storage}",["Datastore.AllocateTemplate"]]

=cut

sub create_nodes_aplinfo {

    my $self = shift or return;

    my $a = shift or die 'No node for create_nodes_aplinfo()';
    die 'node must be a scalar for create_nodes_aplinfo()' if ref $a;

    my @p = @_;

    die 'No arguments for create_nodes_aplinfo()' unless @p;
    my %args;

    if ( @p == 1 ) {
        die 'Single argument not a hash for create_nodes_aplinfo()'
          unless ref $a eq 'HASH';
        %args = %{ $p[0] };
    }
    else {
        die 'Odd number of arguments for create_nodes_aplinfo()'
          if ( scalar @p % 2 != 0 );
        %args = @p;
    }

    return $self->post( $base, $a, 'aplinfo', \%args )

}

=head2 get_nodes_dns

Get DNS settings.

  $ok = $obj->get_nodes_dns('node')

node is a string in pve-node format

Note: required permissions are ["perm","/nodes/{node}",["Sys.Audit"]]

=cut

sub get_nodes_dns {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes_dns()';
    die 'node must be a scalar for get_nodes_dns()' if ref $a;

    return $self->get( $base, $a, 'dns' )

}

=head2 update_nodes_dns

Updates (writes) DNS settings.

  $ok = $obj->update_nodes_dns('node', \%args)

node is a string in pve-node format

I<%args> may items contain from the following list

=over 4

=item search

String. Search domain for host-name lookup. Required.

=back

Note: required permissions are ["perm","/nodes/{node}",["Sys.Audit"]]

=cut

sub update_nodes_dns {

    my $self = shift or return;

    my $a = shift or die 'No node for update_nodes_dns()';
    die 'node must be a scalar for update_nodes_dns()' if ref $a;

    my @p = @_;

    die 'No arguments for update_nodes_dns()' unless @p;
    my %args;

    if ( @p == 1 ) {
        die 'Single argument not a hash for update_nodes_dns()'
          unless ref $a eq 'HASH';
        %args = %{ $p[0] };
    }
    else {
        die 'Odd number of arguments for update_nodes_dns()'
          if ( scalar @p % 2 != 0 );
        %args = @p;
    }

    return $self->put( $base, $a, 'dns', \%args )

}

=head2 get_nodes_rrd

Get nodes RRD statistics (returns PNG).

  $ok = $obj->get_nodes_rrd('node', \%args)

node is a string in pve-node format

I<%args> may items contain from the following list

=over 4

=item ds

String. The list of datasources you wish to see, in pve-configid-list format. Required.

=item timeframe

Enum. Is either hour, day, week, month or year. Required.

=item cf

Enum. Is either AVERAGE or MAX. Controls the RRD consolidation function. Optional.

=back

Note: required permissions are ["perm","/nodes/{node}",["Sys.Audit"]]

=cut

sub get_nodes_rrd {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes_rrd()';
    die 'node must be a scalar for get_nodes_rrd()' if ref $a;

    my @p = @_;

    die 'No arguments for get_nodes_rrd()' unless @p;
    my %args;

    if ( @p == 1 ) {
        die 'Single argument not a hash for get_nodes_rrd()'
          unless ref $a eq 'HASH';
        %args = %{ $p[0] };
    }
    else {
        die 'Odd number of arguments for get_nodes_rrd()'
          if ( scalar @p % 2 != 0 );
        %args = @p;
    }

    return $self->get( $base, $a, 'rrd', \%args )

}

=head2 get_nodes_rrddata

Get nodes RRD statistics.

  $ok = $obj->get_nodes_rrddata('node', \%args)

node is a string in pve-node format

I<%args> may items contain from the following list

=over 4

=item timeframe

Enum. Is either hour, day, week, month or year. Required.

=item cf

Enum. Is either AVERAGE or MAX. Controls the RRD consolidation function. Optional.

=back

Note: required permissions are ["perm","/nodes/{node}",["Sys.Audit"]]

=cut

sub get_nodes_rrddata {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes_rrddata()';
    die 'node must be a scalar for get_nodes_rrddata()' if ref $a;

    my @p = @_;

    die 'No arguments for get_nodes_rrddata()' unless @p;
    my %args;

    if ( @p == 1 ) {
        die 'Single argument not a hash for get_nodes_rrddata()'
          unless ref $a eq 'HASH';
        %args = %{ $p[0] };
    }
    else {
        die 'Odd number of arguments for get_nodes_rrddata()'
          if ( scalar @p % 2 != 0 );
        %args = @p;
    }

    return $self->get( $base, $a, 'rrddata', \%args )

}

=head2 get_nodes_status

Gets node status

  $ok = $obj->get_nodes_status('node')

node is a string in pve-node format

Note: required permissions are ["perm","/nodes/{node}",["Sys.Audit"]]

=cut

sub get_nodes_status {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes_status()';
    die 'node must be a scalar for get_nodes_status()' if ref $a;

    return $self->get( $base, $a, 'status' )

}


=head2 update_nodes_status

Reboot or shutdown a node

  $ok = $obj->updates_nodes_status('node', \%args)

node is a string in pve-node format

I<%args> may items contain from the following list

=over 4

=item command

Enum. Either reboot or shutdown. Specifies the command. Required.

=back

Note: required permissions are ["perm","/nodes/{node}",["Sys.PowerMgmt"]]

=cut

sub update_nodes_status {

    my $self = shift or return;

    my $a = shift or die 'No node for update_nodes_status()';
    die 'node must be a scalar for update_nodes_status()' if ref $a;

    my @p = @_;

    die 'No arguments for update_nodes_status()' unless @p;
    my %args;

    if ( @p == 1 ) {
        die 'Single argument not a hash for update_nodes_status()'
          unless ref $a eq 'HASH';
        %args = %{ $p[0] };
    }
    else {
        die 'Odd number of arguments for update_nodes_status()'
          if ( scalar @p % 2 != 0 );
        %args = @p;
    }

    return $self->post( $base, $a, 'status', \%args )


}

=head2 get_nodes_subscription

Read nodes subscription info

  $ok = $obj->get_nodes_subscription('node')

node is a string in pve-node format

Note: Root only.

=cut

sub get_nodes_subscription {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes_subscription()';
    die 'node must be a scalar for get_nodes_subscription()' if ref $a;

    return $self->get( $base, $a, 'subscription' )

}

=head2 create_nodes_subscription

Create/update nodes subscription info

  $ok = $obj->create_nodes_subscription('node', \%args)

node is a string in pve-node format

I<%args> may items contain from the following list

=over 4

=item force

Boolean. Always connect to the server, even if we have up to date info inside local cache. Optional.

=back

Note: Root only.

=cut

sub create_nodes_subscription {

    my $self = shift or return;

    my $a = shift or die 'No node for create_nodes_subscription()';
    die 'node must be a scalar for create_nodes_subscription()' if ref $a;

    my @p = @_;

    die 'No arguments for create_nodes_subscription()' unless @p;
    my %args;

    if ( @p == 1 ) {
        die 'Single argument not a hash for create_nodes_subscription()'
          unless ref $a eq 'HASH';
        %args = %{ $p[0] };
    }
    else {
        die 'Odd number of arguments for create_nodes_subscription()'
          if ( scalar @p % 2 != 0 );
        %args = @p;
    }

    return $self->post( $base, $a, 'subscription', \%args )

}

=head2 update_nodes_subscription_key

Updates/sets subscription key

  $ok = $obj->update_nodes_subscription_key('node', \%args)

node is a string in pve-node format

I<%args> may items contain from the following list

=over 4

=item key

Boolean. Proxmox VE subscription key. Required.

=back

Note: Root only.

=cut

sub update_nodes_subscription_key {

    my $self = shift or return;

    my $a = shift or die 'No node for update_nodes_subscription_key()';
    die 'node must be a scalar for update_nodes_subscription_key()' if ref $a;

    my @p = @_;

    die 'No arguments for update_nodes_subscription_key()' unless @p;
    my %args;

    if ( @p == 1 ) {
        die 'Single argument not a hash for update_nodes_subscription_key()'
          unless ref $a eq 'HASH';
        %args = %{ $p[0] };
    }
    else {
        die 'Odd number of arguments for update_nodes_subscription_key()'
          if ( scalar @p % 2 != 0 );
        %args = @p;
    }

    return $self->put( $base, $a, 'subscription', \%args )

}

=head2 get_nodes_syslog

Reads system log

  $ok = $obj->get_nodes_syslog('node', \%args)

node is a string in pve-node format

Note: required permissions are ["perm","/nodes/{node}",["Sys.Syslog"]]

=cut

sub get_nodes_syslog {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes_syslog()';
    die 'node must be a scalar for get_nodes_syslog()' if ref $a;

    my @p = @_;

    die 'No arguments for get_nodes_syslog()' unless @p;
    my %args;

    if ( @p == 1 ) {
        die 'Single argument not a hash for get_nodes_syslog()'
          unless ref $a eq 'HASH';
        %args = %{ $p[0] };
    }
    else {
        die 'Odd number of arguments for get_nodes_syslog()'
          if ( scalar @p % 2 != 0 );
        %args = @p;
    }

    return $self->get( $base, $a, 'syslog', \%args )

}

=head2 get_nodes_time

Read server time and time zone settings

  $ok = $obj->get_nodes_time('node')

node is a string in pve-node format

Note: required permissions are ["perm","/nodes/{node}",["Sys.Audit"]]

=cut

sub get_nodes_time {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes_time()';
    die 'node must be a scalar for get_nodes_time()' if ref $a;

    return $self->get( $base, $a, 'time' )

}

=head2 update_nodes_time

Updates time zone

  $ok = $obj->update_nodes_time('node', \%args)

node is a string in pve-node format

I<%args> may items contain from the following list

=over 4

=item timezone

String. Time zone to be used, see '/usr/share/zoneinfo/zone.tab'. Required.

=back

Note: required permissions are ["perm","/nodes/{node}",["Sys.Modify"]]

=cut

sub update_nodes_time {

    my $self = shift or return;

    my $a = shift or die 'No node for update_nodes_time()';
    die 'node must be a scalar for update_nodes_time()' if ref $a;

    my @p = @_;

    die 'No arguments for update_nodes_time()' unless @p;
    my %args;

    if ( @p == 1 ) {
        die 'Single argument not a hash for update_nodes_time()'
          unless ref $a eq 'HASH';
        %args = %{ $p[0] };
    }
    else {
        die 'Odd number of arguments for update_nodes_time()'
          if ( scalar @p % 2 != 0 );
        %args = @p;
    }

    return $self->put( $base, $a, 'time', \%args )

}

=head2 get_nodes_ubcfailcnt

Get user_beancounters failcnt for all active containers.

  $ok = $obj->get_nodes_ubcfailcnt('node')

node is a string in pve-node format

Note: required permissions are ["perm","/nodes/{node}",["Sys.Audit"]]

=cut

sub get_nodes_ubcfailcnt {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes_ubcfailcnt()';
    die 'node must be a scalar for get_nodes_ubcfailcnt()' if ref $a;

    return $self->get( $base, $a, 'ubcfailcnt' )

}

=head2 get_nodes_version

Get user_beancounters failcnt for all active containers.

  $ok = $obj->get_nodes_version('node')

node is a string in pve-node format

Note: Accessible by all authententicated users.

=cut

sub get_nodes_version {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes_version()';
    die 'node must be a scalar for get_nodes_version()' if ref $a;

    return $self->get( $base, $a, 'version' )

}

=head2 create_nodes_vncshell

Creates a VNC Shell proxy.

  $ok = $obj->create_nodes_vncshell('node')

node is a string in pve-node format

Note: Restricted to users on realm 'pam'. Required permissions are ["perm","/nodes/{node}",["Sys.Console"]]

=cut

sub create_nodes_vncshell {

    my $self = shift or return;

    my $a = shift or die 'No node for create_nodes_vncshell()';
    die 'node must be a scalar for create_nodes_vncshell()' if ref $a;

    return $self->post( $base, $a, 'vncshell' )

}

=head2 create_nodes_vzdump

Create backup.

  $ok = $obj->create_nodes_vzdump('node', \%args)

node is a string in pve-node format

I<%args> may items contain from the following list

=over 4

=item all

Boolean. Backup all known VMs on this host. Optional.

=item bwlimit

Integer. Limit I/O bandwidth (KBytes per second). Optional.

=item compress

Enum. Either 0, 1, gzip or lzo. Comress dump file. Optional

=item dumpdir

String. Store resulting files to specified directory. Optional.

=item exclude

String. Exclude specified VMs (assumes --all) in pve-vmid-list. Optional.

=item exclude-path

String. Exclude certain files/directories (regex) in string-alist. Optional.

=item ionice

Integer. Set CFQ ionice priority. Optional.

=item lockwait

Integer. Maximal time to wait for the global lock (minutes). Optional.

=item mailto

String. List of email addresses in string-list format. Optional.

=item maxfiles

Integer. Maximal number of backup files per vm. Optional.

=item mode

Enum. A value from snapshot, suspend or stop. Backup mode. Optional.

=item quiet

Boolean. Be quiet. Optional.

=item remove

Boolean. Remove old backup files if there are more than 'maxfiles' backup files. Optional.

=item script

String. Use specified hook script. Optional.

=item size

Integer. LVM snapshot size in MB. Optional.

=item stdexcludes

Boolean. Exclude temporary files and logs. Optional.

=item stdout

Boolean. Write tar to stdout rather than to a file. Optional.

=item stopwait

Integer. Maximal time to wait until a VM is stopped (minutes). Optional.

=item storage

String. Store resulting file to this storage, in pve-storage-id format. Optional.

=item tmpdir

String. Store temporary files to specified directory. Optional.

=item vmid

String. The ID of the VM you want to backup in pve-vm-list format. Optional.

=back

Note: The user needs 'VM.Backup' permissions on any VM, and 'Datastore.AllocateSpace' on the backup storage.

=cut

sub create_nodes_vzdump {

    my $self = shift or return;

    my $a = shift or die 'No node for create_nodes_vzdump()';
    die 'node must be a scalar for create_nodes_vzdump()' if ref $a;

    my @p = @_;

    die 'No arguments for create_nodes_vzdump()' unless @p;
    my %args;

    if ( @p == 1 ) {
        die 'Single argument not a hash for create_nodes_vzdump()'
          unless ref $a eq 'HASH';
        %args = %{ $p[0] };
    }
    else {
        die 'Odd number of arguments for create_nodes_vzdump()'
          if ( scalar @p % 2 != 0 );
        %args = @p;
    }

    return $self->post( $base, $a, 'dns', \%args )

}

=head2 nodes_network

List available networks on the node

  $ok = $obj->nodes_network('node', \%args)

node is a string in pve-node format

I<%args> may items contain from the following list

=over 4

=item type

Enum. One of bond, bridge, alias or eth. Only list specific interface types. Optional.

=back

Note: Accessible by all authententicated users.

=cut

sub nodes_network {

    my $self = shift or return;

    my $a = shift or die 'No node for nodes_network()';
    die 'node must be a scalar for nodes_network()' if ref $a;

    my @p = @_;

    die 'No arguments for nodes_network()' unless @p;
    my %args;

    if ( @p == 1 ) {
        die 'Single argument not a hash for nodes_network()'
          unless ref $a eq 'HASH';
        %args = %{ $p[0] };
    }
    else {
        die 'Odd number of arguments for nodes_network()'
          if ( scalar @p % 2 != 0 );
        %args = @p;
    }

    return $self->get( $base, $a, 'network', \%args )

}

=head2 create_nodes_network

Create network device configuration

  $ok = $obj->create_nodes_network('node', \%args)

node is a string in pve-node format

I<%args> may items contain from the following list

=over 4

=item iface

String. The network interface name in pve-iface format. Required.

=item address

String. The ipv4 network address. Optional.

=item autostart

Boolean. Automatically start interface on boot. Optional.

=item bond_mode

Enum. Either of balance-rr, active-backup, balance-xor, broadcast, 802.3ad, balance-tlb or balance-alb. Specifies the bonding mode. Optional.

=item bridge_ports

String. Specify the interfaces you want to add to your bridge in pve-iface-list format. Optional.

=item gateway

String. Default ipv4 gateway address. Optional.

=item netmask

String. Network mask for ipv4. Optional.

=item slaves

String. Specify the interfaces used by the bonding device in pve-iface-list format. Optional.

=back

Note: required permissions are ["perm","/nodes/{node}",["Sys.Modify"]]

=cut

sub create_nodes_network {

    my $self = shift or return;

    my $a = shift or die 'No node for create_nodes_network()';
    die 'node must be a scalar for create_nodes_network()' if ref $a;

    my @p = @_;

    die 'No arguments for create_nodes_network()' unless @p;
    my %args;

    if ( @p == 1 ) {
        die 'Single argument not a hash for create_nodes_network()'
          unless ref $a eq 'HASH';
        %args = %{ $p[0] };
    }
    else {
        die 'Odd number of arguments for create_nodes_network()'
          if ( scalar @p % 2 != 0 );
        %args = @p;
    }

    return $self->post( $base, $a, 'network', \%args )

}

=head2 revert_nodes_network

Revert network configuration changes.

  $ok = $obj->revert_nodes_network('node')

node is a string in pve-node format

Note: required permissions are ["perm","/nodes/{node}",["Sys.Modify"]]

=cut

sub revert_nodes_network {

    my $self = shift or return;

    my $a = shift or die 'No node for revert_nodes_network()';
    die 'node must be a scalar for revert_nodes_network()' if ref $a;

    return $self->delete( $base, $a )

}


=head2 get_nodes_network_iface

Read network device configuration

  $ok = $obj->get_nodes_network_iface('node', 'iface')

node is a string in pve-node format, iface is a string in pve-iface format

Note: required permissions are ["perm","/nodes/{node}",["Sys.Audit"]]

=cut

sub get_nodes_network_iface {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes_network_iface()';
    my $b = shift or die 'No iface for get_nodes_network_iface()';

    die 'node must be a scalar for get_nodes_network_iface()' if ref $a;
    die 'iface must be a scalar for get_nodes_network_iface()' if ref $b;

    return $self->get( $base, $a, 'network', $b )

}

=head2 update_nodes_network_iface

Create network device configuration

  $ok = $obj->update_nodes_network_iface('node', 'iface', \%args)

node is a string in pve-node format, iface is a string in pve-iface format

I<%args> may items contain from the following list

=over 4

=item address

String. The ipv4 network address. Optional.

=item autostart

Boolean. Automatically start interface on boot. Optional.

=item bond_mode

Enum. Either of balance-rr, active-backup, balance-xor, broadcast, 802.3ad, balance-tlb or balance-alb. Specifies the bonding mode. Optional.

=item delete

String. Settings you want to delete in pve-configid-list format. Optional.

=item bridge_ports

String. Specify the interfaces you want to add to your bridge in pve-iface-list format. Optional.

=item gateway

String. Default ipv4 gateway address. Optional.

=item netmask

String. Network mask for ipv4. Optional.

=item slaves

String. Specify the interfaces used by the bonding device in pve-iface-list format. Optional.

=back

Note: required permissions are ["perm","/nodes/{node}",["Sys.Modify"]]

=cut

sub update_nodes_network_iface {

    my $self = shift or return;

    my $a = shift or die 'No node for update_nodes_network_iface()';
    my $b = shift or die 'No iface for update_nodes_network_iface()';

    die 'node must be a scalar for update_nodes_network_iface()' if ref $a;
    die 'iface must be a scalar for update_nodes_network_iface()' if ref $b;

    my @p = @_;

    die 'No arguments for update_nodes_network_iface()' unless @p;
    my %args;

    if ( @p == 1 ) {
        die 'Single argument not a hash for update_nodes_network_iface()'
          unless ref $a eq 'HASH';
        %args = %{ $p[0] };
    }
    else {
        die 'Odd number of arguments for update_nodes_network_iface()'
          if ( scalar @p % 2 != 0 );
        %args = @p;
    }

    return $self->post( $base, $a, 'network', $b, \%args )

}

=head2 delete_nodes_network_iface

Delete network device configuration

  $ok = $obj->delete_nodes_network_iface('node', 'iface')

node is a string in pve-node format, iface is a string in pve-iface format

Note: required permissions are ["perm","/nodes/{node}",["Sys.Modify"]]

=cut

sub delete_nodes_network_iface {

    my $self = shift or return;

    my $a = shift or die 'No node for delete_nodes_network_iface()';
    my $b = shift or die 'No iface for delete_nodes_network_iface()';

    die 'node must be a scalar for delete_nodes_network_iface()' if ref $a;
    die 'iface must be a scalar for delete_nodes_network_iface()' if ref $b;

    return $self->get( $base, $a, 'network', $b )

}

=head2 nodes_openvz

OpenVZ container index (per node).

  $ok = $obj->nodes_openvz('node')

node is a string in pve-node format

Note: Only lists VMs where you have VM.Audit permissons on /vms/<vmid>.

=cut

sub nodes_openvz {

    my $self = shift or return;

    my $a = shift or die 'No node for nodes_openvz()';
    die 'node must be a scalar for nodes_openvz()' if ref $a;

    return $self->get( $base, $a, 'openvz')

}

=head2 create_nodes_openvz

Create or restore a container.

  $ok = $obj->create_nodes_openvz('node', \%args)

node is a string in pve-node format

I<%args> may items contain from the following list

=over 4

=item ostemplate

String. The OS template or backup file. Required.

=item vmid

Integer. The unique ID of the vm in pve-vmid format. Required.

=item cpus

Integer. The number of CPUs for this container. Optional.

=item cpuunits

Integer. CPU weight for a VM. Argument is used in the kernel fair scheduler. The larger the number is, the more CPU time this VM gets. Number is relative to weights of all the other running VMs.\n\nNOTE: You can disable fair-scheduler configuration by setting this to 0. Optional.

=item description

String. Container description. Only used in the web interface. Optional.

=item disk

Number. Amount of disk space for the VM in GB. A zero indicates no limit. Optional.

=item force

Boolean. Allow to overwrite existing container. Optional.

=item hostname

String. Set a host name for the container. Optional.

=item ip_address

String. Specifies the address the container will be assigned. Optional.

=item memory

Integer. Amount of RAM for the VM in MB. Optional.

=item nameserver

String. Sets DNS server IP address for a container. Create will automatically use the setting from the host if you neither set searchdomain or nameserver. Optional.

=item netif

String. Specifies network interfaces for the container in pve-openvz-netif format. Optional.

=item onboot

Boolean. Specifies weather a VM will be started during the system bootup. Optional.

=item password

String. Sets root password insider the container. Optional.

=item pool

String. Add the VM to a specified pool in pve-poolid format. Optional.

=item quotatime

Integer. Set quota grace period (seconds). Optional.

=item quotaugidlimit

Integer. Set maximum number of user/group IDs in a container for which disk quota inside the container will be accounted. If this value is set to 0, user and group quotas inside the container will not. Optional.

=item restore

Boolean. Mark this as a restore task. Optional.

=item searchdomain

String. Sets DNS search domains for a container. Create will automatically use the setting from the host if you neither set searchdomain or nameserver. Optional.

=item storage

String. Target storage in pve-storage-id. Optional.

=item swap

Integer. Amount of SWAP for the VM in MB. Optional

=back

Note: You need 'VM.Allocate' permissions on /vms/{vmid} or on the VM pool /pool/{pool}, and 'Datastore.AllocateSpace' on the storage.

required permissions are ["or",["perm","/vms/{vmid}",["VM.Allocate"]],["perm","/pool/{pool}",["VM.Allocate"],"require_param","pool"]]

=cut

sub create_nodes_openvz {

    my $self = shift or return;

    my $a = shift or die 'No node for create_nodes_openvz()';
    die 'node must be a scalar for create_nodes_openvz()' if ref $a;

    my @p = @_;

    die 'No arguments for create_nodes_openvz()' unless @p;
    my %args;

    if ( @p == 1 ) {
        die 'Single argument not a hash for create_nodes_openvz()'
          unless ref $a eq 'HASH';
        %args = %{ $p[0] };
    }
    else {
        die 'Odd number of arguments for create_nodes_openvz()'
          if ( scalar @p % 2 != 0 );
        %args = @p;
    }

    return $self->get( $base, $a, 'openvz', \%args )

}

=head2 get_nodes_openvz

Gets an openvz nodes details

  $ok = $obj->get_nodes_openvz('node','vmid')

node is a string in pve-node format

mvid is an integer in pve-vmid format

Note: Accessible by all authententicated users.

=cut

sub get_nodes_openvz {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes_openvz()';
    die 'node must be a scalar for get_nodes_openvz()' if ref $a;

    my $b = shift or die 'No node for get_nodes_openvz()';
    die 'node must be a scalar for get_nodes_openvz()' if ref $b;

    return $self->get( $base, $a, 'openvz', $b )

}

=head2 delete_nodes_openvz

Destroy the container (also delete all uses files).

  $ok = $obj->delete_nodes_openvz('node','vmid')

node is a string in pve-node format

mvid is an integer in pve-vmid format

Note: required permissions are ["perm","/vms/{vmid}",["VM.Allocate"]]

=cut

sub delete_nodes_openvz {

    my $self = shift or return;

    my $a = shift or die 'No node for delete_nodes_openvz()';
    die 'node must be a scalar for delete_nodes_openvz()' if ref $a;

    my $b = shift or die 'No node for delete_nodes_openvz()';
    die 'node must be a scalar for delete_nodes_openvz()' if ref $b;

    return $self->delete( $base, $a, 'openvz', $b )

}

=head2 get_nodes_openvz_status

Directory index

  $ok = $obj->get_nodes_openvz_status('node','vmid')

node is a string in pve-node format

mvid is an integer in pve-vmid format

Note: Accessible by all authententicated users.

=cut

sub get_nodes_openvz_status {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes_openvz_status()';
    die 'node must be a scalar for get_nodes_openvz_status()' if ref $a;

    my $b = shift or die 'No node for get_nodes_openvz_status()';
    die 'node must be a scalar for get_nodes_openvz_status()' if ref $b;

    return $self->get( $base, $a, 'openvz', $b, 'status' )

}

=head2 get_nodes_openvz_status_current

Get virtual machine status.

  $ok = $obj->get_nodes_openvz_status_current('node','vmid')

node is a string in pve-node format

mvid is an integer in pve-vmid format

Note: required permissions are ["perm","/vms/{vmid}",["VM.Audit"]]

=cut

sub get_nodes_openvz_status_current {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes_openvz_status_current()';
    die 'node must be a scalar for get_nodes_openvz_status_current()' if ref $a;

    my $b = shift or die 'No node for get_nodes_openvz_status_current()';
    die 'node must be a scalar for get_nodes_openvz_status_current()' if ref $b;

    return $self->get( $base, $a, 'openvz', $b, 'status', 'current' )

}

=head2 create_nodes_openvz_status_mount

Mounts container private area.

  $ok = $obj->create_nodes_openvz_status_mount('node','vmid')

node is a string in pve-node format

mvid is an integer in pve-vmid format

Note: required permissions are ["perm","/vms/{vmid}",["VM.PowerMgmt"]]

=cut

sub create_nodes_openvz_status_mount {

    my $self = shift or return;

    my $a = shift or die 'No node for create_nodes_openvz_status_mount()';
    die 'node must be a scalar for create_nodes_openvz_status_mount()' if ref $a;

    my $b = shift or die 'No node for create_nodes_openvz_status_mount()';
    die 'node must be a scalar for create_nodes_openvz_status_mount()' if ref $b;

    return $self->post( $base, $a, 'openvz', $b, 'status', 'mount' )

}

=head2 create_nodes_openvz_status_shutdown

Shutdown the container.

  $ok = $obj->create_nodes_openvz_status_shutdown('node','vmid', \%args)

node is a string in pve-node format

vmid is an integer in pve-vmid format

I<%args> may items contain from the following list

=over 4

=item forceStop

Boolean. Make sure the container stops. Note the capital S. Optional.

=item timeout

Integer. Wait maximal timeout seconds

=back

Note: required permissions are ["perm","/vms/{vmid}",["VM.PowerMgmt"]]

=cut

sub create_nodes_openvz_status_shutdown {

    my $self = shift or return;

    my $a = shift or die 'No node for create_nodes_openvz_status_shutdown()';
    die 'node must be a scalar for create_nodes_openvz_status_shutdown()' if ref $a;

    my $b = shift or die 'No node for create_nodes_openvz_status_shutdown()';
    die 'node must be a scalar for create_nodes_openvz_status_shutdown()' if ref $b;

    my @p = @_;

    die 'No arguments for create_nodes_openvz_status_shutdown()' unless @p;
    my %args;

    if ( @p == 1 ) {
        die 'Single argument not a hash for create_nodes_openvz_status_shutdown()'
          unless ref $a eq 'HASH';
        %args = %{ $p[0] };
    }
    else {
        die 'Odd number of arguments for create_nodes_openvz_status_shutdown()'
          if ( scalar @p % 2 != 0 );
        %args = @p;
    }

    return $self->post( $base, $a, 'openvz', $b, 'status', 'shutdown', \%args )

}

=head2 create_nodes_openvz_status_start

Start the container.

  $ok = $obj->create_nodes_openvz_status_start('node','vmid')

node is a string in pve-node format

vmid is an integer in pve-vmid format

Note: required permissions are ["perm","/vms/{vmid}",["VM.PowerMgmt"]]

=cut

sub create_nodes_openvz_status_start {

    my $self = shift or return;

    my $a = shift or die 'No node for create_nodes_openvz_status_start()';
    die 'node must be a scalar for create_nodes_openvz_status_start()' if ref $a;

    my $b = shift or die 'No node for create_nodes_openvz_status_start()';
    die 'node must be a scalar for create_nodes_openvz_status_start()' if ref $b;

    return $self->post( $base, $a, 'openvz', $b, 'status', 'start' )

}

=head2 create_nodes_openvz_status_stop

Stop the container.

  $ok = $obj->create_nodes_openvz_status_stop('node','vmid')

node is a string in pve-node format

vmid is an integer in pve-vmid format

Note: required permissions are ["perm","/vms/{vmid}",["VM.PowerMgmt"]]

=cut

sub create_nodes_openvz_status_stop {

    my $self = shift or return;

    my $a = shift or die 'No node for create_nodes_openvz_status_stop()';
    die 'node must be a scalar for create_nodes_openvz_status_stop()' if ref $a;

    my $b = shift or die 'No node for create_nodes_openvz_status_stop()';
    die 'node must be a scalar for create_nodes_openvz_status_stop()' if ref $b;

    return $self->post( $base, $a, 'openvz', $b, 'status', 'start' )

}

=head2 get_nodes_openvz_status_ubc

Get container user_beancounters.

  $ok = $obj->get_nodes_openvz_status_ubc('node','vmid')

node is a string in pve-node format

vmid is an integer in pve-vmid format

Note: required permissions are ["perm","/vms/{vmid}",["VM.Audit"]]

=cut

sub get_nodes_openvz_status_ubc {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes_openvz_status_ubc()';
    die 'node must be a scalar for get_nodes_openvz_status_ubc()' if ref $a;

    my $b = shift or die 'No node for get_nodes_openvz_status_ubc()';
    die 'node must be a scalar for get_nodes_openvz_status_ubc()' if ref $b;

    return $self->post( $base, $a, 'openvz', $b, 'status', 'ubc' )

}

=head2 get_nodes_openvz_status_umount

Unmounts container private area.

  $ok = $obj->get_nodes_openvz_status_umount('node','vmid')

node is a string in pve-node format

vmid is an integer in pve-vmid format

Note: required permissions are ["perm","/vms/{vmid}",["VM.PowerMgmt"]]

=cut

sub get_nodes_openvz_status_umount {

    my $self = shift or return;

    my $a = shift or die 'No node for get_nodes_openvz_status_umount()';
    die 'node must be a scalar for get_nodes_openvz_status_umount()' if ref $a;

    my $b = shift or die 'No node for get_nodes_openvz_status_umount()';
    die 'node must be a scalar for get_nodes_openvz_status_umount()' if ref $b;

    return $self->post( $base, $a, 'openvz', $b, 'status', 'umount' )

}

=head1 SEE ALSO

  L<Net::Proxmox::VE>

=cut

1;

__END__

# vim: softtabstop=2 tabstop=2 shiftwidth=2 ft=perl expandtab smarttab
