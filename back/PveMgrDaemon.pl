# #!/opt/perl/bin/perl

use common::sense;

# <DEBUGS>
use Data::Dump qw/pp dd ddx/;
$Data::Dump::INDENT = "| ";
use Carp;
$| = 1;
# </DEBUGS>

use FindBin;

BEGIN { # Maximum forks for AnyEvent::Util::fork_call
    $ENV{PERL_ANYEVENT_MAX_FORKS} = 200;
}
use AnyEvent::Strict;
use AnyEvent::HTTPD;
use AnyEvent::Util;

use List::Util qw(reduce);
use JSON; # decode_json, encode_json
use File::MimeInfo qw/mimetype/;
use POSIX qw/strftime/;
use IPC::Run;# qw/run/;
use Capture::Tiny qw'capture tee';    # Trying to catch warnings from Net::Proxmox::VE requests
use URI::Escape qw/uri_escape uri_escape_utf8/;
use lib "$FindBin::Bin/../lib";
use Net::Proxmox::VE;
use Proc::Daemon;
use Net::OpenSSH;
use Time::HiRes qw (sleep);
require Data::UUID;

use constant SRVHOME    => "$FindBin::Bin/..";
use constant FRONT      => SRVHOME . "/front";
use constant EXTJS      => SRVHOME . '/extjs/current';
use constant SCRIPTS    => SRVHOME . '/scripts/';

use constant PMGR_USER              => 'pvemgr';
use constant PMGR_GROUP             => 'pvemgr';
use constant PMGR_HOME              => '/var/lib/pvemgr';
use constant PMGR_LOGDIR            => PMGR_HOME . '/logs/';
use constant PMGR_SERVICE_PW_FILE   => PMGR_HOME . '/.priv/pvemgr';
use constant PMGR_TASKLOGS               => PMGR_HOME . '/tasklogs/';
use constant PMGR_MNT               => PMGR_HOME . '/mnt/';

#
# switching to pvemgr UID
#

my $uid = getpwnam(PMGR_USER);
my $gid = ( getgrnam(PMGR_GROUP) );

# Not strictly necessary to add kvm group,
# but with hardware virtualization libguestfs runs 6 time faster
my $kvmgid = ( getgrnam('kvm') );

$( = $) = "$gid " . ($kvmgid or $gid);
$< = $> = $uid;

ddx "UID: $<, $>; GID: $(, $)";

# Redefine some environment variables
delete $ENV{XDG_RUNTIME_DIR};   # used by libguestfs get-sockdir function
$ENV{USER} = PMGR_USER;         # used by libguestfs during appliance building

# Just another one workaround for libguestfs https://bugzilla.redhat.com/show_bug.cgi?id=991641
# Maybe only for old libguestfs versions. 1.34 seams to be unaffected
# chmod 0644, glob "/boot/vmlinuz*";


#
# Daemonizing
#
Proc::Daemon::Init({
    child_STDOUT    => '+>>' . PMGR_LOGDIR . 'out.log',
    child_STDERR    => '+>>' . PMGR_LOGDIR . 'debug.log',
    work_dir        => PMGR_HOME,
    dont_close_fd   => [3,4,5],                            # Not closing some descriptors like socket and AnyEvent inodes
});

#
# <CONFIGURE PVE CLUSTER HERE>
#

my $pvehost     = '10.14.31.21';
my $pvedebug    = 1;
my $pverealm    = 'pam';                    # 'pve' or 'pam'
my $pve;
my $pveservice;

use constant DEFAULT_PVE_NODE       => 'pve21'; # Used in deploy if target node not defined or logical false
use constant DEFAULT_TEMPLATE_ID    => '100';   # Used in deploy if template not defined or logical false

#
# </CONFIGURE PVE CLUSTER THERE>
#

my @pmgrSessions = ();

my $httpd = AnyEvent::HTTPD->new(
    port    => 3333,
    ssl     => {
        cert_file   => "/var/lib/pvemgr/.ssl/certs/ssl-cert-snakeoil.pem",
        key_file    => "/var/lib/pvemgr/.ssl/private/ssl-cert-snakeoil.key",
    }
);

$httpd->reg_cb (
    '/' => sub {
        my ($httpd, $req) = @_;
        $httpd->stop_request;

        open my $fhIndex, '<', SRVHOME . '/index.tpl'
            or die "error opening index.tpl: $!";
        $req->respond ({
            content => [
                'text/html; charset=UTF-8',
                do { local $/; <$fhIndex> },
            ]
        });
    },

    # Check and verify some asynchronous and multiprocess aspects
    # Must be disabled in production
    '/test' => sub {
        my ( $httpd, $req ) = @_;
        $httpd->stop_request;

        # Disabled here
        return;

        #~ ddx $httpd->{condvar};
        #~ $httpd->{condvar}->send;
        #~ ddx \$httpd->{condvar};

        # Test multiple parallel events with one final callback code 
        my $testtimer1;
        my $testtimer2;
        my $testtimer3;
        my $counter = 0;

        my $cb = sub {
            #$ENV{PATH} = '';
            ddx "Counter is $counter in callback";
            $counter--;
            sleep 2;
            if ($counter > 0) {return};
            ddx 'respond finally';
            my $txt = "CPU info:\n\n" . `/bin/cat /proc/cpuinfo`;
            undef $testtimer1;
            undef $testtimer2;
            undef $testtimer3;
            $req->respond ([
                200, "ok",
                {'Content-Type' => 'text/plain'}, encode_json [$txt],
            ]);
        };

        #~ ddx $cb;
        $counter++;
        fork_call {
            for (0..2) {
                ddx "Counter in fork $counter";
                sleep 1;
            }
        } sub {
            ddx "Counter after fork $counter";
            $counter--;
        };
        $testtimer1 = AnyEvent->timer (after => 2, cb => $cb);
        sleep 5;
        ddx "after first sleep";

        $counter++;
        $testtimer2 = AnyEvent->timer (after => 4, cb => $cb);
        sleep 5;
        ddx "after second sleep";

        $counter++;
        $testtimer3 = AnyEvent->timer (after => 7, cb => $cb);
    },

    '/extjs' => sub {
        my ( $httpd, $req ) = @_;
        $httpd->stop_request;

        my $path = $req->url()->path();
        $path =~ s#/[^/]+/#/#;
        substr $path, 0, 0, EXTJS;
        open my $fh, '<', $path
            or die "error opening file $path: $!";
        $req->respond ({
            content => [mimetype($path), do {local $/; <$fh>}]
        });
    },

    '/pvemgr' => sub {
        my ( $httpd, $req)  = @_;
        $httpd->stop_request;

        my $path = $req->url()->path();
        $path =~ s#/[^/]+/#/#;
        substr $path, 0, 0, FRONT;
        open my $fh, '<', $path
            or die "error opening file $path: $!";
        $req->respond ({
            content => [mimetype($path), do {local $/; <$fh>}]
        });
    },

    '' => sub {
        my ( $httpd, $req ) = @_;
        $httpd->stop_request;
        pmgr_wrong_path($req);
    },

    '/api' => \&pmgr_api_request,
    '/api-debug' => \&pmgr_api_request,
); # END OF $httpd->reg_cb

$httpd->run;


sub pmgr_api_request { # <API call>
    $httpd->stop_request;

    my ($httpd, $req) = @_;
    my $path = $req->url->path;
    my ($pve, $PMGR_APIDEBUG);


    ddx "Processing request " . $req->method . ' ' . $req->url
        ."; Client: $req->{host}:$req->{port}";

    ddx $path;

    if ($path =~ m{ ^/api-debug/ }x) {
        $path =~ s|^/api-debug/|/api/|;
        $PMGR_APIDEBUG = 1;
    }

    ddx $path;

    if ($path =~ m{ ^/api/realms/?$ }x) {
        pmgr_realms($req);
        return;
    }

    # <Authentication>
    if ($path =~ m{ ^/api/login/? }x) {

        my $sid = 0;
        eval { $sid = pmgr_login($req) };
        ddx $@ if $@;

        if ($@ || !$sid) {
            pmgr_fiasco($req, "Login Failed");
        } else {
            pmgr_success( $req, { pmgrLoginCookie => $sid } );
        }
        return;
    } elsif (my $cookie = $req->headers->{"cookie"}) { # sic!
        require CGI::Cookie;
        my %cookies = parse CGI::Cookie($cookie);
        my $sid = $cookies{pmgrLoginCookie}->value;
        my ($session) = grep { $_->{sid} eq $sid } @pmgrSessions;
        $pve = $session->{pve};

        eval {
            if ( $pve && $pve->check_login_ticket ) {
                ddx 'GOOD TICKET'; #, 'version: ', $pve->api_version; 
            } else {
                die 'BAD TICKET or SESSION';
            }
        };
        if ($@ || !$pve) {
            ddx $@ if $@;
            pmgr_http_respond ( $req, '401', 'Login Failed' );
            return;
        }

    } else {
        pmgr_http_respond ( $req, '401', 'Login Failed' );
        return;
    } # </Authentication>

    # Now user authenticated and logged to PVE API
    if ( $path eq '/api/vms' ) {
        pmgr_success ($req, pmgr_vms($pve));

    } elsif ( $path eq '/api/storages' ) {
        pmgr_success ($req, pmgr_storages($pve));

    } elsif ( $path eq '/api/nodes' ) {
        pmgr_success ($req, pmgr_nodes($pve));

    } elsif ( substr($path, 0, 13) eq '/api/tasklogs' ) {
        pmgr_tasklogs(
            $req->url()->path() =~ s|.*tasklogs/?||r,
            sub { $req->respond( {content => shift} ) }
        );

    } elsif ( $path eq '/api/newid' ) {
        pmgr_newid( $pve, $req->parm('vmid'), sub {
            pmgr_success( $req, {vmid => $_[0]} );
        } );

    } elsif ( $path eq '/api/vmdeploy' ) {

        fork_call {
            my $content = decode_json($req->content);
            my $poolid = $content->{poolid} or die 'Не задан пул!';

            #~ pmgr_pool_lock($poolid);

            my @vms = @{ $content->{vms} };

            pmgr_validate_or_die( map {%$_} @vms, $content->{poolid} );

            my $pool = pmgr_poolresources( $pve, [$poolid] )->[0];

            eval {
                $pool->{quota} = pmgr_calc_pool_quota_or_die($pool);
            };
            die "Квоты не заданы, или ошибка при обработке квот пула $poolid"
                . "Текст ошибки: $@"
            if $@;

            my $deployParams =
                pmgr_vmdeploy_prepare_or_die( $pve, $content, $pool );

            pmgr_quota_check(   $deployParams->{vms},
                                $pool->{quota},
                                $pool->{allocated} );

            return @vms;

        } sub {
            my @vms = @_;
            pmgr_fiasco($req, $@) unless @_;

            eval {
                my $msg = pmgr_vmsdeploy( $pve, \@vms, sub {
                    ddx "After deploy callback";
                    ddx @_;
                    # There whill be after deploy handlers
                    # MAYBE!
                    pmgr_success($req, @_);
                } );

                ddx "After deploy eval";
                #~ pmgr_success($req, $msg);
            };
            ddx "Fiasco after deploy eval: $@" if $@;
            pmgr_fiasco($req, $@) if $@;
        };


    } elsif ( $path eq '/api/vmaction' ) {
        my %params = $req->vars;
        pmgr_vmaction( $pve, \%params, sub {
            pmgr_respond( $req, shift );
        } );

    } elsif ( $path eq '/api/script' ) {
        my $params = pmgr_reqcontent($req);
        pmgr_respond( $req, pmgr_run_script($params) );

    } elsif ( $path eq '/api/cmd' ) {

        my ($content, %params);

        eval {
            $content = decode_json($req->content);
            %params = %{ $content->{params} };
            foreach my $k (keys %params) {
                pmgr_validate($params{$k}) or die "Недопустимый параметр "
                    . "$k: $params{$k} (" . pmgr_dump($params{$k})
                    . ")";
            }
            pmgr_cmd($req, $pve, $content->{cmd}, \%params);
        };
        if ($@) {
            pmgr_fiasco($req, $@);
        }

    } elsif ($path eq '/api/poolresources') {
        fork_call {
            pmgr_poolresources($pve);
        } sub {
            pmgr_fiasco($req, $@) if $@;
            pmgr_success( $req, shift );
        }

    } elsif ($path eq '/api/vmsnapshots') {
        fork_call {
            my $content = decode_json($req->content);
            pmgr_vm_snapshots($content, $pve);
        } sub {
            pmgr_fiasco($req, $@) if $@;
            pmgr_success( $req, shift );
        }

    } elsif ($path eq '/api/poolquotasave') {
        fork_call {
            my $content = decode_json($req->content);
            pmgr_validate_or_die(values %$content);
            my $pool = delete $content->{pool};
            pmgr_set_pool_quota_or_die($pve, $pool, $content);
        } sub {
            pmgr_fiasco($req, $@) if $@;
            pmgr_success( $req, "Сохранено" );
        }

    } elsif ($path eq '/api/qagentaction') {
        fork_call {
            local $SIG{__DIE__} = \&Carp::confess if $PMGR_APIDEBUG;
            my $content = decode_json($req->content);
            my $data = delete $content->{data};
            my ($qCommand, $qArgs);

            if ($content->{action} eq 'shellexec') {
                pmgr_validate_or_die(values %$content);

                my @privs = pmgr_vm_privileges_get($pve, $content->{vmid});
                die "Access Denied" if !grep(/^VM.Console$/, @privs)
                                    or !grep(/^VM.Monitor$/, @privs);

                $qCommand = 'guest-exec';
                $qArgs = {
                    path => 'sh',
                    arg => ['-c', $data->{cmd}],
                    'capture-output' => JSON::true,
                };

            } else {
                pmgr_validate_or_die(values %$content, values %$data);
                $qCommand = $content->{action};
                $qArgs = $data->{args};
            }

            my $nodeip =  pmgr_node($pve, $content->{node})->{ip};

            pmgr_qagent_exec_or_die($nodeip, $content->{vmid}, $qCommand, $qArgs);

        } sub {
            pmgr_fiasco($req, $@) if $@;
            pmgr_success( $req, shift );
        }

    } elsif ($path eq '/api/test') {
        fork_call {
            my $content = decode_json($req->content);
            pmgr_validate_or_die(values %$content);
            my $vm = pmgr_vm( { vmid => $content->{vmid} }, $pve);
        } sub {
            pmgr_fiasco($req, $@) if $@;
            pmgr_success( $req, shift );
        }

    } else {
        pmgr_wrong_path($req);
    }

} # </API call>

sub pmgr_http_respond {
    my ($req, $httpCode, $httpMsg, $data) = @_;
    my $hResp = [
        $httpCode, $httpMsg,
        { 'Content-Type' => 'text/plain' },
    ];
    push($hResp, encode_json $data) if $data;
    $req->respond($hResp);
}

sub pmgr_fiasco {
    my ($req, $err) = @_;
    my $resp = {
        success => 0,
        errorMsg => "Server Error:\n$err",
    };

    ddx "Fiasco! " . $req->method . ' ' . $req->url
        ."; Client: $req->{host}:$req->{port}";
    print "$err$/";

    pmgr_respond($req, $resp);
}

sub pmgr_success {
    my ($req, $data) = @_;
    my $respdata = { success => 1 };
    if (ref $data) {
        $respdata->{data} = $data;
    } elsif (defined $data) {
        $respdata->{msg} = $data;
    }
    ddx "Successful response: " . $req->method . ' ' . $req->url
        ."; Client: $req->{host}:$req->{port}";
    pmgr_respond($req, $respdata);    
}

sub pmgr_respond {
    my ($req, $respdata) = @_;
    $req->respond ([
        200, "ok", { 'Content-Type' => 'text/plain' },
        encode_json $respdata,
    ]);    
}

sub pmgr_reqcontent {
    my $req = shift;
    my $reqparams = eval {decode_json($req->content)};
    if($@) {
        pmgr_fiasco($req, $@);
        return 0;
    }
    return $reqparams;
}

sub pmgr_validate_or_die {
    my @params = @_;
    foreach my $param (@params) {
        pmgr_validate($param) or die
            "Недопустимый параметр: $param 0x(" . pmgr_dump($param) . ")";
    }
    return 1;
}

sub pmgr_validate {
    my $param = shift;
    if (    shift
         or ref($param)
         or $param =~ m/[^A-Za-z0-9_. -]/s) {
        ddx 'Bad param', $param;
        return 0;
    }
    return 1;
}

sub pmgr_dump {
    (my $dmp = shift) =~ s/(.)/sprintf("0x%X, ", ord($1))/esg;
    return "0x(" . $dmp  . ")";
}

sub pmgr_vmsdeploy {
    my ($pve, $vms, $callback) = @_;

    my $logfile = strftime( "%Y-%m-%d_%T", localtime )
                . "-deploy.log";
    my @logfiles = ($logfile);

    open my $logfh, '>', PMGR_TASKLOGS.$logfile;
    say $logfh "deploying " . join( ', ', map { $_->{hostname} } @{$vms} );

    my ( @started, @returned, @finished );

    foreach my $vm ( @{$vms} ) {

        push @started, $vm;

        my $vmlogfile = strftime("%Y-%m-%d_%T", localtime)
            . "-deploy-$vm->{vmid}-$vm->{hostname}.log";
        push @logfiles, $vmlogfile;

        system "id";
        ddx "system";
        fork_call {

            pmgr_vmdeploy( $pve, $vm, $vmlogfile);

        } sub {

            my $result = shift;
            ddx $result;

            if ( !$result->{success} ) {
                say $logfh "Error deploying $result->{vmid}; "
                    . join( '; ', @{$result->{deployErrors}} );
            } else {
                say $logfh @_ ? "Finished deploying $result->{vmid}" :  
                push @finished, $result;
            }

            push @returned, $result;

            ddx scalar @started, scalar @returned, scalar @finished;

            if ( @returned == @started ) {
                if ( defined $callback ) {
                    ddx @started;
                    ddx @finished;
                    ddx @started == @finished;
                    $callback->({
                        error => $@,
                        complete => @started == @finished,
                        started => \@started,
                        finished => \@finished,
                    });
                }
            }
        };
        ddx "Started deploy of $vm->{vmid}";

    }

    return "Журналы:\n" . join("\n", @logfiles);
}

sub pmgr_vmdeploy {
    my ( $pve, $vm, $logfile ) = @_;

        my $nodename = $vm->{node} || DEFAULT_PVE_NODE;
        my $node = pmgr_node( $pve, $nodename );
        my $tmplId = $vm->{template} || DEFAULT_TEMPLATE_ID;
        my $newid = $vm->{vmid} || pmgr_newid();
        my $mask = $vm->{mask} || 24;
        my $ip = $vm->{ip};
        my $gw = $vm->{gateway};

        my $actualNewId;
        my $dplOpts = {};
        $dplOpts->{pool} = $vm->{poolid} if $vm->{poolid};
        $dplOpts->{storage} = $vm->{storage} if $vm->{storage};
        my $format = 'raw';
        $dplOpts->{full} = 1;
        if ( defined $vm->{full} && $vm->{full} == 0 ){
            $dplOpts->{full} = 0;
            $format = 'qcow2';
        } else {
            $dplOpts->{full} = 1;
        }

        eval {

            for (my $i = 0;; $i++) {
                die "Error deploying VM $newid after "
                    . ($i-1) . " retries. "
                    . "Last tried VMID $actualNewId."
                if $i > 20; # TODO: remove hardcoded number and add option

                $actualNewId = $newid + $i;
                $dplOpts->{newid} = $actualNewId;

                my $result = $pve->post(
                    "/nodes/$nodename/qemu/$tmplId/clone",
                    $dplOpts
                );
                ddx $result;

                last if $result;
            }

            my $tmpdir = PMGR_MNT . "sshfs_$node->{ip}_${actualNewId}_"
                . substr( Data::UUID->new->create_hex(), 2 );
            my $mntTarget = "root\@$node->{ip}:/var/lib/vz/images/$actualNewId";

            my ($out, $err, $res) = capture {
                system("id; mkdir $tmpdir && sshfs -ouid=999 -ogid=999 $mntTarget $tmpdir");
            };

            ddx ($out, $err, $res);
            die "Error accessing VM image; Ошибки'$err'; Вывод: '$out'"
            if $res or $err;

            my $prepcmd1 =
                    "virt-sysprep --format $format --operations lvm-uuids,customize "
                  . "--hostname $vm->{hostname} "
                  . "-a $tmpdir/vm-$actualNewId-disk-1.$format";
            $prepcmd1 = "time guestfish -a /dev/null run";
            ddx $prepcmd1;

            #~ sleep 15; # TODO implement task completion checking instead of timeout
            open ( FH, '>', PMGR_TASKLOGS . $logfile );

            my @c1 = split(/\s/, $prepcmd1);
            ddx @c1;
            use IO::Tee;
            use IO::File;
            my $tee = new IO::Tee(\*STDOUT, '>' . PMGR_TASKLOGS . $logfile);
            print $tee "1234567";
            #~ IPC::Run::run( \@c1, '>&', $tee );

            #~ (my $out, my $res) = tee { system($prepcmd1) };
            #~ print FH $out;
            #~ my ($out, $err, $res) capture { system($prepcmd1) };

            ddx ($out, $err, $res);
            die "Error первого sysprep; Ошибки'$err'; Вывод: '$out'"
            if $res or $err;

            my $commandplus='';
            if ($ip) {
                if ($gw) {
                    $commandplus .= "; sed -ri 's/(iface .* )dhcp/\1static\n\taddress $ip\n\tnetmask $mask\n\tgateway $gw/' /etc/network/interfaces"
                } else {
                    $commandplus .= "; sed -ri 's/(iface .* )dhcp/\1static\n\taddress $ip\n\tnetmask $mask/' /etc/network/interfaces"
                }
            }

            my $prepcmd2 = "virt-sysprep --operations customize "
                  . "-a $tmpdir/vm-$actualNewId-disk-1.qcow2";
                  "--run-command \"update-grub;grub-install /dev/sda$commandplus\"";

            ddx $prepcmd2;

            #~ my ($out, $err, $res) = capture { system($prepcmd1) };

            ddx ($out, $err, $res);
            die "Error второго sysprep; Ошибки'$err'; Вывод: '$out'"
                if $res or $err;

        };
        if ($@) {
            push @{$vm->{deployErrors}},$@;
            $vm->{success} = 0;
        } else {
            $vm->{success} = 1;
        }

        return $vm;
}
sub pmgr_vmdeploy_bash {
    my ($pve, $vm, $logfile) = @_;
        my @cloncmd = (SCRIPTS . 'prepclone.sh');
        if($vm->{template}) {
            push @cloncmd, '-s', $vm->{template};
        } else {
            push @cloncmd, '-s', '100';
        }
        if(my $node = $vm->{node}) {
            my $nodes = $pve->get('/cluster/status');
            my @node = grep {$_->{name} eq $node} @$nodes;
            my $addr = $node[0]{ip};
            push  @cloncmd, '-n', $node, '--node-address', $addr;
        } else {
            push  @cloncmd, '-n', 'pve21', '--node-address', '10.14.31.21';
        };

        push @cloncmd, ("-i", $vm->{vmid})
            if defined $vm->{vmid};
        push @cloncmd, ("-t", $vm->{hostname})
            if defined $vm->{hostname};
        push @cloncmd, ("-v", $vm->{vlans}[0])
            if defined $vm->{vlans} && $vm->{vlans}[0];
        push @cloncmd, ("-a", $vm->{ip})
            if defined $vm->{ip};
        push @cloncmd, ("-V", $vm->{name})
            if defined $vm->{name};
        push @cloncmd, ("-m", $vm->{mask})
            if defined $vm->{mask};
        push @cloncmd, ("-g", $vm->{gateway})
            if defined $vm->{gateway};
        push @cloncmd, ("-p", $vm->{poolid})
            if defined $vm->{poolid};
        push @cloncmd, ("--DO_START")
            if $vm->{start};
        push @cloncmd, ("--DO_PVE")
            if $vm->{dopve};

        ddx join ( ' ', @cloncmd );
        IPC::Run::run( \@cloncmd,
            '>&', PMGR_TASKLOGS . $logfile);

        return ($vm->{vmid}, $vm->{name});
}

 # pmgr_login
 # Checks credentials against PVE cluster
 # and generats new PveMgr session
 # returns SID or 0
sub pmgr_login {
    my ($req) = @_;
    my $creds = pmgr_reqcontent($req);

    my $session = {
        sid => substr ( Data::UUID->new->create_hex(), 2 )
    };

    $session->{pve} = Net::Proxmox::VE->new(
        host     => $pvehost,
        username => $creds->{username},
        password => $creds->{password},
        debug    => $pvedebug,
        realm    => $creds->{realm} || $pverealm,
        ssl_opts => {
            SSL_verify_mode => 0,
            verify_hostname => 0
        },
    );

    if ($session->{pve}->login) {
        ddx "SUCCESSFUL LOGIN, SID: $session->{sid}";
        die "unsupported api version\n"
            unless $session->{pve}->api_version_check();
        $session->{username} = $creds->{username};
        $session->{ctime} = time();
        push( @pmgrSessions, $session );
        return $session->{sid};
    } else {
        ddx "FAILED PVE LOGIN $creds->{username} at $pvehost";
        return 0;
    }
}

sub pmgr_realms {
    my ($req) = @_;
    my $pve = Net::Proxmox::VE->new(
        host     => $pvehost,
        debug    => $pvedebug,
        password => 'fake',
        ssl_opts => {
            SSL_verify_mode => 0,
            verify_hostname => 0
        },
    );
    my $realms;
    eval {
        $realms = $pve->access_domains;
    };
    ddx $@ if $@;
    pmgr_success ($req, $realms);
}

sub pmgr_vms {
    my ($pve) = @_;

    my $vms = $pve->get_cluster_resources( type => 'vm' );

    foreach my $vm ( @{$vms} ) {
        $vm->{config} =
            $pve->get("/nodes/$vm->{node}/$vm->{id}/config"); 
    }
    return $vms;
}

sub pmgr_vm_snapshots {
    my ($opts, $pve) = @_;

    my $vm = { vmid => $opts->{vmid}, node => $opts->{node} };
    if( !$vm->{node} ) {
        ($vm) = grep { $_->{vmid} eq $vm->{vmid} }
                $pve->get_cluster_resources( type => 'vm' );
    };
    if ( !$vm || !$vm->{node} || !$vm->{vmid} ) {
        return;
    }

    my $result;

    if ($opts->{snapAction} eq 'get') {
        my @snaps = $pve->get("/nodes/$vm->{node}/qemu/$vm->{vmid}/snapshot");
        for (@snaps) {
            if ($_->{name} ne 'current') {
                $_->{config} = $pve->get(
                    "/nodes/$vm->{node}/qemu/$vm->{vmid}/snapshot/$_->{name}/config"
                );
            }
        }
        return \@snaps; 

    } elsif ($opts->{snapAction} eq 'modify') {

        $pve->put(
            "/nodes/$vm->{node}/qemu/$vm->{vmid}/snapshot/$opts->{snapname}/config",
            { description => $opts->{description} }
        );

        # This request returns undef data on success and now there is no sane way to check success of request.
        # Client side solutions include: 1. Capture and parse output fo WARNING messages
        # 2. Capture output in list context and verify number ofarguments (2 on error and 3 on success)
        # 3. Try to access output and catch exception (e.g. with eval {})
        # 4. Do manual HTTP request
        # None of options is proper and reliable. Modification of PVE module is necessary again.

        # TODO: Modify 'action' method in Net::Proxmox::VE module to return something defined on success

        $result = "Задача на изменение снэпшота $opts->{snapname} отправлена";

    } elsif ($opts->{snapAction} eq 'takenew') {
        $result = $pve->post(
            "/nodes/$vm->{node}/qemu/$vm->{vmid}/snapshot",
            {
                snapname => $opts->{snapname},
                description => $opts->{description},
                vmstate => $opts->{vmstate} ? 1 : 0,
            }
        );
        die "Ошибка снятия снэпшота" unless defined $result;

    } elsif ($opts->{snapAction} eq 'rollback') {
        my $url = "/nodes/$vm->{node}/qemu/$vm->{vmid}/snapshot/$opts->{snapname}/rollback";
        $result = $pve->post($url);
        die "Ошибка отката на снэпшот" unless defined $result;

    } elsif ($opts->{snapAction} eq 'del') {
        $result = $pve->delete(
            "/nodes/$vm->{node}/qemu/$vm->{vmid}/snapshot/$opts->{snapname}"
        );
        die "Ошибка при удалениии" unless defined $result;

    } else {
        die "Неизвестное действие '$opts->{snapAction}'";
    }

    return $result;
}

sub pmgr_storages {
    my ($pve) = @_;
    my $strgsConf = $pve->get('/storage');
    my $strgsRes = $pve->get('/cluster/resources?type=storage');
    foreach my $s (@$strgsConf) {
        my @ar = grep {$_->{storage} eq $s->{storage}} @$strgsRes;
        $s->{resources} = \@ar;
    }
    return $strgsConf;
}

sub pmgr_nodes {
    my ($pve) = @_;

    my $nodes1 = $pve->get('/cluster/resources?type=node');
    my $nodes2 = $pve->get('/cluster/status');
    my $nodes = [];
    my @n = sort {$a->{id} cmp $b->{id}} @$nodes1;
    $nodes1 = [@n];
    @n = grep {$_->{type} eq 'node'} @$nodes2;
    @n = sort {$a->{id} cmp $b->{id}} @n;
    my @c = grep {$_->{type} eq 'cluster'} @$nodes2;
    my $c = $nodes2->[0]{name};
    $nodes2 = \@n;
    foreach my $i (0 .. @$nodes1 - 1) {
        $nodes->[$i] = $nodes1->[$i];
        $nodes->[$i]{ip} = $nodes2->[$i]{ip};
        $nodes->[$i]{nodeid} = $nodes2->[$i]{nodeid};
        $nodes->[$i]{status} = $pve->get("/nodes/$nodes->[$i]{node}/status");
        $nodes->[$i]{cluster} = $c;
    }
    return $nodes;
}

sub pmgr_newid {
    my ( $pve, $id, $callback ) = @_;
    my ($nextid, $url);
    fork_call {
        do {
            $url = '/cluster/nextid' . ($id ? "?vmid=$id" : '');
            $nextid = $pve->get($url);
            $id++;
        } until ($nextid);
    } sub {
        my ($newid) = @_;
        $callback->($newid);
    };
}

sub pmgr_vmaction {
    my ($pve, $params, $callback) = @_;

    my $result = { success => 0 };
    my $url;
    my $method = 'post';
    my $action = $params->{'action'};
    if ($action eq 'start') {
        $url = "/nodes/$params->{node}/qemu/$params->{vmid}/status/start";
    } elsif ($action eq 'stop') {
        $url = "/nodes/$params->{node}/qemu/$params->{vmid}/status/stop";
    } elsif ($action eq 'delete') {
        $url = "/nodes/$params->{node}/qemu/$params->{vmid}";
        $method = 'delete';
    } else {
        $result->{errorMsg} = $params->{'action'} . " not implemented";
        $callback->($result);
        return;
    }
    fork_call {
        local $| = 1; # Or some output may be lost
        my @outs = capture { # Catching both STD outputs and return value
            $pve->$method($url);
        };
        return (@outs);
    } sub {
        my ($stdout, $stderr, $res) = @_;
        unless ($res) {
            map {s/^CSRFPreventionToken: .*//m} ($stdout, $stderr);
            map {s/^Cookie: .*//m} ($stdout, $stderr);
            map {s/^User-Agent: .*//m} ($stdout, $stderr);
            my $out = join("\n", $stdout, $stderr);
            $out =~ s/\n+/\n/gs;
            $result->{data}{output} = $out;
            $result->{errorMsg} = "Неудачное действие на ВМ $params->{'vmid'}";
        } else {
            $result->{data}{msg} = $res;
            $result->{success} = 1;
        }
        $callback->($result);
    };
}

sub pmgr_run_script {
    my $params = shift;

    my $cmd;
    my $logtime = strftime("%Y-%m-%d_%H-%M-%S", localtime);
    if($params->{script} eq 'dopve') {
        $cmd = 'scripts/dopve_.sh ';
        $cmd .= " $params->{firstvm} $params->{lastvm}";
    } elsif ($params->{script} eq 'testsleep'){
        $cmd = './scripts/testsleep.sh';
        $cmd .= " $params->{duration}" if $params->{duration};
    } else {
        return {
            success => 0,
            errorMsg => 'Неизвестный скрипт ' . $params->{script},
        };
    }
    $cmd .= ' > ' . PMGR_TASKLOGS . "$logtime-$params->{script}.log 2>&1 &";
    ddx system( $cmd );
    return {
        success => 1,
        msg => "Скрипт запущен. Журнал: $logtime-$params->{script}",
    };
}

sub pmgr_cmd {
    my ($req, $pve, $cmd, $params) = @_;

    my $logfile = strftime("%Y-%m-%d_%T", localtime);
    my ($ runcmd, $vmid );
    if ( $cmd eq 'getaddress' ) {

        unless ($pveservice && $pveservice->check_login_ticket) {
            pmgr_service_login();
        }

        my $nodes = $pveservice->get('/cluster/status');
        my @node = grep {$_->{name} eq $params->{node}} @$nodes;
        $vmid = $params->{vmid};
        $runcmd = "ssh -vv root@" . $node[0]{ip}
            . ' "bash -s" < ' . SCRIPTS . "/agent_ip.sh $vmid";
        $logfile .= "-ip-$vmid";
    } else {
        pmgr_fiasco( $req, "Неизвестная команда: $cmd" );
        return;
    }
    open my $logfh, '>', PMGR_TASKLOGS . "$logfile.log";
    capture { system($runcmd . '&') } stdout => $logfh, stderr => $logfh;

    pmgr_success( $req, "Команда '$cmd' отправлена "
        . "Журнал: $logfile" );
}

# "Returns" content array [ Content-Type, Content body ]
# Body may represent JSON array of files in directory or
# file content, depending on "$path" parameter.
sub pmgr_tasklogs { 
    my ( $path, $callback ) = @_;

    fork_call {
        if(!$path) {
            my $tasklogs = PMGR_TASKLOGS;
            my @files;
            for my $file (`ls -t $tasklogs | head -n 1000`) {
                next if $file =~ /^\./;
                push @files, {name => $file =~ s/\.[^.]+$//r};
            }
            return [ 'text/plain', encode_json(\@files) ];

        } else {
            substr $path, 0, 0, PMGR_TASKLOGS;
            open my $fh, '<', $path . '.log'
                or die "error opening file $path: $!";
            return [ mimetype($path . '.log'), do {local $/; <$fh>} ];
        }

    } sub {
        $callback->(shift);
    };

}

sub pmgr_conf_to_resources {
    my (%conf) = @_;
    my %res;
    $res{disks} = {
        map { $_ => $conf{$_} }
        grep { $conf{$_} =~ /^(?!none,).*/ }
        grep { /^scsi\d+$|^virtio\d+$|^ide\d+$|^sata\d+$/ }
        keys %conf
    };
    $res{diskSize} =
        reduce { $a + $b } 0,
        map { $_ =~ s/.*,size=(\d+)G.*/$1/r }
        values %{ $res{disks} };
    $res{vlans} = [
        map { $conf{$_} =~ s/.*,tag=(\d+).*/$1/ || 0 and $conf{$_} }
        grep { /^net\d+$/ }
        keys %conf
    ];
    return \%res;
}

# Takes ref to array of 'poolids' and
# returns ref to arrayr of pools with resources
sub pmgr_poolresources {
    my ( $pve, $poolids ) = @_;
    my $result = [];

    $poolids ||= [ map { $_->{poolid} } $pve->pools() ];

    foreach my $poolid (@$poolids) {
        my $pool = $pve->get( "/pools/$poolid" );
        $pool->{poolid} = $poolid;
        $pool->{vms} = [
            grep { $_->{type} eq 'qemu' } @{ $pool->{members} } ];

        foreach my $vm ( @{ $pool->{vms} } ) {
            $vm = pmgr_vm( $vm, $pve );
        }

        $pool->{allocated} = pmgr_vm_totals( $pool->{vms} );

        push( $result, $pool );
    }

    return $result;
}

# Takes hash refeerence defining vm and
# returns vm hash reference filled with data
# $pve is optional, depending on pasased vm properties
# on failure to get vm data, returns undef
sub pmgr_vm {
    my ($vm, $pve ) = @_;

    if( !$vm->{node} ) {
        ($vm) = grep { $_->{vmid} eq $vm->{vmid} }
                $pve->get_cluster_resources( type => 'vm' );
    };

    if ( !$vm || !$vm->{node} || !$vm->{id} ) {
        return;
    }

    if( !$vm->{config} ) {
        $vm->{config} = $pve->get(
                "/nodes/$vm->{node}/$vm->{id}/config" );
    };

    my $vmres = pmgr_conf_to_resources( %{ $vm->{config} } );
    @{$vm}{ keys %$vmres } = values %$vmres;

    return $vm;
}

sub pmgr_vm_totals {
    my @vms = @{ shift() };
    my %alloc;

    $alloc{diskSize} = reduce { $a + $b } 0,
        map { $_->{diskSize} } @vms;
    $alloc{cpu} = reduce { $a + $b } 0,
        map { $_->{maxcpu} } @vms;
    $alloc{mem} = reduce { $a + $b } 0,
        map { $_->{maxmem} } @vms;
    $alloc{vlans} = [ keys {
        map { $_, 1 }
        map { @{ $_->{vlans} } } @vms } ];

    return \%alloc;
}

sub pmgr_calc_pool_quota_or_die {
    my $comment = %{ shift() }{comment};
    my $quota = $comment =~ s/.*___QUOTA: (.*); QUOTA___/$1/r;
    ddx $quota;
    return decode_json($quota);
;
}

sub pmgr_set_pool_quota_or_die {
    my ($pve, $pool, $quota) = @_;
    my $comment = $pve->get_pool($pool)->{comment};
    $quota = encode_json($quota);
    $comment =~ s/(.*___QUOTA: ).*(; QUOTA___)/$1$quota$2/ or 
        $comment = $comment . '___QUOTA: ' . $quota . '; QUOTA___';
    $pve->update_pool( $pool, { comment => uri_escape_utf8($comment) } );
    return 1;
}

sub pmgr_wrong_path {
    my $req = shift;

    ddx 'wrong path: ' . $req->url;
    $req->respond ([
        404, "Not Found",
        { 'Content-Type' => 'text/plain' }, '404 NOT FOUND',
    ]);
}

# Verify and fill given deploy parameters
sub pmgr_vmdeploy_prepare_or_die {
    my ( $pve, $inparams, $pool ) = @_;

    my @templates = keys {
        map { $_ => 1 }
        map { $_->{template} } @{ $inparams->{vms} }
    };
    eval {
        @templates = map { pmgr_vm( { vmid => $_ }, $pve ) } @templates;
    };
    if ($@) {
        ddx $@;
        die "Не корректные шаблоны ВМ " . pp (@templates);
    }
    foreach my $vm ( @{$inparams->{vms}} ) {
        my $template = shift([
            grep { $_->{vmid} eq $vm->{template} } @templates
        ]);
        $vm->{poolid} = $pool->{poolid};
        $vm->{config} = $template->{config};
        $vm->{diskSize} = $template->{diskSize};
        $vm->{vlans} ||= [ $pool->{quota}{vlanMin} ];
        ddx $vm->{vmid};
        if ( !$vm->{vmid} ) {
            my @vmids = map { $_->{vmid } } @{ $pool->{vms} };
            for my $vmid ( $pool->{quota}{vmidMin} .. $pool->{quota}{vmidMax} ) {
                ddx $vmid, @vmids;
                if ( ! grep { $vmid == $_ } @vmids ) {
                    $vm->{vmid} = $vmid;
                    last;
                }
            }
            die "Невозможно назначить VMID" if $vm->{vmid} ==  $pool->{quota}{vmidMax};
        } 
        ddx $vm;
    }
    return $inparams;
}

sub pmgr_calc_vmdeploy {
    my $vms = shift;
    ddx scalar @$vms;
    return 1;
}

sub pmgr_quota_check {
    my ( $vms, $quota, $alloc ) = @_;
    ddx $quota;
    ddx $vms;
    my $cpuReq = reduce { $a + $b } 0,
        map { $_->{config}{cores} } @{ $vms };
    my $memReq = reduce { $a + $b } 0,
        map { $_->{config}{memory} } @{ $vms };
    my $diskReq = reduce { $a + $b } 0,
        map { $_->{diskSize} } @{ $vms };
    ddx $cpuReq, $memReq, $diskReq, $alloc;

    die "Квота ЦПУ исчерпана"
        if $quota->{cpuMax} < $alloc->{cpu} + $cpuReq;

    die "Квота ОЗУ исчерпана"
        if $quota->{memMax} < $alloc->{mem}/1024/1024/1024 + $memReq/1024;

    die "Дисковая квота исчерпана"
        if $quota->{diskMax} < $alloc->{diskSize} + $diskReq;
}

# Send request to QEMU Guest Agent over ssh tunnel and return result as hash.
# Using Net:^Openssh module instead of socat for performance and stability reasons

# TODO: saner tunnel and timeout implementation
# TODO: accounting and logging of forked processes,
#       so they can be monitored and stopped

sub pmgr_qagent_query_or_die {

    my $p = shift;
    my $vmid = $p->{vmid};
    my $nodeip = $p->{nodeip};
    my $nosync = $p->{nosync};

    my $aQuery =  encode_json {
        execute => $p->{command},
        arguments => $p->{args},
    };

    ddx 'Sending agent command', $aQuery;

    my $cmd = [<<'EOC'];
local $| = 1;
use IO::Socket::UNIX;
my $sock = IO::Socket::UNIX->new(
    Type => SOCK_STREAM(),
    Peer => '/var/run/qemu-server/_VMID_PLACEHOLDER_.qga',
);
$sock->autoflush();
EOC
    $cmd->[0] =~ s/_VMID_PLACEHOLDER_/$vmid/;

    if (!$nosync) {
        push(@$cmd, <<'EOC');
send( $sock, chr(255) , 0 );
<$sock>;
my $line = '{"execute":"guest-sync", "arguments":{"id":' . int( rand(10000) ) . "}}$/";
send( $sock, $line , 0 );
print 'Sync response: ' . <$sock>;
EOC
    }

    $aQuery =~ s/[#\\]/\\$&/g; # escape '\' and '#' in order for quoting to work properly  
    push( @$cmd, q{send( $sock, q#} . $aQuery . q{# . $/, 0 );} );
    push( @$cmd, 'print "" . <$sock>;' );

    $cmd = join($/, @$cmd);


    my ($result, $writer, $reader, $error, $pid);
    {
        # Timeout can be implemented better; TODO
        local $SIG{ALRM} = sub {
            die "Qemu Agent execution timeout";
        };
        alarm 60; # TODO: Configure and modify parameter

        my $ssh = Net::OpenSSH->new("root\@$nodeip");
        $ssh->error and
            die "Couldn't establish SSH connection: ". $ssh->error;
        ( $writer, $reader, $error, $pid ) =
            $ssh->open3( 'perl' );
        $ssh->error and
            die "starting remote command failed: " . $ssh->error;

        $writer->autoflush();
        print $writer $cmd;

        # Timeout is nesessary according to QGA specification
        # https://wiki.qemu.org/Features/GuestAgent#QEMU_Guest_Agent_Protocol
        # But implementation should be more sane and without hardcode (TODO!)

        #    sleep 0.5;

        $ssh->error and
            die "operation didn't complete successfully: ". $ssh->error;

        close($writer);

        # Experemental error output handling
        # Probably not proper reason to die here
        my @errors = <$error>;
        die join( $/, @errors ) if @errors;

        $result = [<$reader>];

        alarm 0;
    }


    ddx $result;
    my $result = decode_json( join( '', $result->[1] ) );

    close($reader);
    close($error);

    return $result;
}

sub pmgr_qagent_exec_or_die {

    my ($nodeip, $vmid, $command, $args) = @_;

    my $execresult = pmgr_qagent_query_or_die( {
        vmid => $vmid,
        nodeip => $nodeip,
        command => $command,
        args => $args,
    } );

    return $execresult if $execresult->{error};


    # Timeout can be implemented better; TODO
    local $SIG{ALRM} = sub {
        die "Qemu Agent waiting for command return timeout";
    };
    alarm 600; # TODO: Configure and modify parameter

    my $statusresult;
    do {
        sleep 0.1;

        $statusresult = pmgr_qagent_query_or_die( {
            vmid => $vmid,
            nodeip => $nodeip,
            command => 'guest-exec-status',
            args => { pid => int $execresult->{return}{pid} },
        } );

    } until ( $statusresult->{return}{exited}
            || $statusresult->{error} );

    alarm 0;

    $statusresult;
}

# Get node
sub pmgr_node {
    my ( $pve, $nodename ) = @_;
    my $nodes = $pve->get('/cluster/status');

# User may not have privileges to access /cluster/status
# One solution is generate special service user
# Other solution is to read node data over ssh
# Using latter. Could be changed later

    if ($nodes) {
        my @node = grep {
            $_->{name} eq $nodename and
            $_->{type} eq 'node'
        } @$nodes;

        return $node[0];

    } else {
        my $ssh = Net::OpenSSH->new("root\@$pvehost");
        $nodes = $ssh->capture('cat /etc/pve/.members');

        $nodes =~ s/\n//g;
        $nodes = decode_json($nodes);

        return $nodes->{nodelist}{$nodename};
    }
}

sub pmgr_vm_privileges_get {
    my ($pve, $vmid) = @_;

    unless ($pveservice && $pveservice->check_login_ticket) {
        pmgr_service_login();
    }

    my $vm = pmgr_vm( {vmid => $vmid}, $pveservice )
        or die "Can't get VM data";
    my $poolid = $vm->{pool};
    my @aclpaths = ("/vms/$vmid", "/pool/$poolid", '/');
    my $uid = $pve->{ticket}{username};
    my @privs;

    my $groups = $pveservice->get_access_users($uid)->{groups};

    my @acls = $pveservice->get_access_acl();

    my @userAcls = grep
            { $_->{type} eq 'user' and $_->{ugid} eq $uid }
            @acls;

    my @groupAcls = grep {
        my $ugid = $_->{ugid};
        $_->{type} eq 'group' and grep { $_ eq $ugid } @$groups; 
    } @acls;

    @acls = (@userAcls, @groupAcls);

    @acls = grep {
        my $path = $_->{path};
        grep { $path eq $_ } @aclpaths;
    } @acls;

    my @roles = map { $_->{roleid} } @acls;

    my @roleprivs = $pveservice->access_roles();
    foreach my $rolepriv (@roleprivs) {
        if ( grep { $rolepriv->{roleid} eq $_ } @roles ) {
            push( @privs, split(',', $rolepriv->{privs}) );
        }
    }

    @privs = keys { map {$_ => 1} @privs };
}

sub pmgr_service_login {
    open my $fh, '<', PMGR_SERVICE_PW_FILE or die "Can't open file $!";
    my $pw = <$fh>;
    chomp $pw;

    $pveservice = Net::Proxmox::VE->new(
        host     => $pvehost,
        username => 'pvemgr',
        password => $pw,
        debug    => $pvedebug,
        realm    => 'pve',
        ssl_opts => {
            SSL_verify_mode => 0,
            verify_hostname => 0
        },
    );

    $pveservice->login;
}
