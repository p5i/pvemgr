# #!/opt/perl/bin/perl

use common::sense;

# switching to nobody UID
#pp __LINE__ , $> = 65534;

# <DEBUGS>
use Data::Dump qw/pp dd ddx/;
$Data::Dump::INDENT = "| ";
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
use IPC::Run qw/run/;
use Capture::Tiny qw'capture tee';    # Trying to catch warnings from Net::Proxmox::VE requests
use URI::Escape qw/uri_escape uri_escape_utf8/;
use lib "$FindBin::Bin/../lib";
use Net::Proxmox::VE;

use constant SRVHOME    => "$FindBin::Bin/..";
use constant FRONT      => SRVHOME . "/front";
use constant EXTJS      => SRVHOME . '/extjs/current';
use constant TASKLOGS   => SRVHOME . '/tasklogs/';
use constant SCRIPTS    => SRVHOME . '/scripts/';

my $pvehost     = '10.100.9.100';
#my $pvehost     = '10.14.31.21';
my $pvedebug    = 1;
my $pverealm    = 'pam'; # 'pve' or 'pam'
my $pve;

my @pmgrSessions = ();

my $httpd = AnyEvent::HTTPD->new(
    port    => 3333,
    ssl     => {
        cert_file   => "/etc/ssl/certs/ssl-cert-snakeoil.pem",
        key_file    => "/etc/ssl/private/ssl-cert-snakeoil.key",
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
    
    '/test' => sub {
        my ( $httpd, $req ) = @_;
        $httpd->stop_request;
 
        ddx, $httpd->{condvar};
        #~ $httpd->{condvar}->send;
        ddx, $httpd->{condvar};
        # Test multiple parallel events with one final callback code 
        my $testtimer1;
        my $testtimer2;
        my $testtimer3;
        my $counter = 0;
        my $cb = sub {
            #$ENV{PATH} = '';
            pp __LINE__, $counter;
            $counter--;
            if ($counter > 0) {return};
            pp __LINE__, 'respond finally';
            my $txt = "CPU info:\n\n" . `/bin/cat /proc/cpuinfo`;
            undef $testtimer1;
            undef $testtimer2;
            undef $testtimer3;
            $req->respond ([
                200, "ok",
                {'Content-Type' => 'text/plain'}, encode_json [$txt],
            ]);
        };
        pp __LINE__, $cb;
        $counter++;
        $testtimer1 = AnyEvent->timer (after => 2, cb => $cb);
        $counter++;
        $testtimer2 = AnyEvent->timer (after => 4, cb => $cb);
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
); # END OF $httpd->reg_cb
 
$httpd->run;


sub pmgr_api_request { # <API call>
    $httpd->stop_request;
    
    my ($httpd, $req) = @_;
    my $path = $req->url->path;
    my $pve;
    
    ddx "Processing request " . $req->method . ' ' . $req->url
        ."; Client: $req->{host}:$req->{port}";

    if ($path =~ m{ /api/realms/?$ }x) {
        pmgr_realms($req);
        return;
    }
    if ($path =~ m{ /api/login/? }x) {
        
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
        my @session = grep { $_->{sid} eq $sid } @pmgrSessions;
        $pve = $session[0]->{pve};
        
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
        my (@vms, $vm);
        
        eval {
            my $content = decode_json($req->content);
            my $poolid = $content->{poolid};
            #~ pmgr_pool_lock($poolid);
            @vms = @{ $content->{vms} };
            
            pmgr_validate_or_die( map {%$_} @vms, $content->{poolid} );
            
            my $pool = pmgr_poolresources( $pve, [$poolid] )->[0];
            my $pool->{acls} = pmgr_calc_pool_acl_or_die($pool);
            my $dplParams = pmgr_vmdeploy_prepare_or_die($pve, $content, $pool);
            
            #~ pmgr_success( $req, $content );
            #~ return;
            
            pmgr_vmsdeploy($req, $pve, @vms);
        };
        if ($@) {
            ddx $@;
            pmgr_fiasco($req, $@);
            return;
        }
        

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

    } elsif ($path eq '/api/poolaclsave') {
        fork_call {
            my $content = decode_json($req->content);
            pmgr_validate_or_die(values %$content);
            my $pool = delete $content->{pool};
            pmgr_set_pool_acl_or_die($pve, $pool, $content);
        } sub {
            pmgr_fiasco($req, $@) if $@;
            pmgr_success( $req, "Сохранено" );
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
    ddx "Fiasco",  . $req->method . ' ' . $req->url
        ."; Client: $req->{host}:$req->{port}";
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

sub pmgr_vmdeploy {
    my ($pve, $vm, $fhResultlog) = @_; # vm hash and result log file handle
    my $logfile = strftime("%Y-%m-%d_%H-%M-%S", localtime)
            . "-deploy-$vm->{vmid}-$vm->{hostname}.log";
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
    ddx $vm;
    push @cloncmd, ("-i", $vm->{vmid})
        if defined $vm->{vmid};
    push @cloncmd, ("-t", $vm->{hostname})
        if defined $vm->{hostname};
    push @cloncmd, ("-v", $vm->{vlan})
        if defined $vm->{vlan};
    push @cloncmd, ("-a", $vm->{ip})
        if defined $vm->{ip};
    push @cloncmd, ("-V", $vm->{name})
        if defined $vm->{name};
    push @cloncmd, ("-m", $vm->{mask})
        if defined $vm->{mask};
    push @cloncmd, ("-g", $vm->{gateway})
        if defined $vm->{gateway};
    push @cloncmd, ("--DO_START")
        if $vm->{start};
    push @cloncmd, ("--DO_PVE")
        if $vm->{dopve};
    ddx @cloncmd;
    fork_call {
        run( \@cloncmd,
            '>&', TASKLOGS . $logfile);
        return ($vm->{vmid}, $vm->{name});
    } sub {
        unless (@_) {
            say $fhResultlog "Deploy error, check logfiles. $@; $!";
        } else {
            say $fhResultlog "VM deploy finished. " . join(',', @_);
        }
    };
    return $logfile;
}

 # pmgr_login
 # Checks credentials against PVE cluster
 # and generats new PveMgr session
 # returns SID or 0
sub pmgr_login {
    my ($req) = @_;
    my $creds = pmgr_reqcontent($req);

    require Data::UUID;
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
        ddx @_;
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
    $cmd .= ' > ' . TASKLOGS . "$logtime-$params->{script}.log 2>&1 &";
    ddx system( $cmd );
    return {
        success => 1,
        msg => "Скрипт запущен. Журнал: $logtime-$params->{script}",
    };
}

sub pmgr_cmd {
    my ($req, $pve, $cmd, $params) = @_;

    my $logfile = strftime("%Y-%m-%d_%H-%M-%S", localtime);
    my ($ runcmd, $vmid );
    if ( $cmd eq 'getaddress' ) {
        my $nodes = $pve->get('/cluster/status');
        my @node = grep {$_->{name} eq $params->{node}} @$nodes;
        $vmid = $params->{vmid};
        $runcmd = "ssh -vv root@" . $node[0]{ip}
            . ' "bash -s" < ./scripts/agent_ip.sh ' . $vmid;
        $logfile .= "-ip-$vmid";
    } else {
        pmgr_fiasco( $req, "Неизвестная команда: $cmd" );
        return;
    }
    open my $logfh, '>', TASKLOGS . "$logfile.log";
    capture { system($runcmd . '&') } stdout => $logfh, stderr => $logfh;

    pmgr_success( $req, "Команда '$cmd' отправлена "
        . "Журнал: $logfile" );
}

sub pmgr_vmsdeploy {
    my ($req, $pve, @vms) = @_;
    
    my $logfile = strftime( "%Y-%m-%d_%H-%M-%S", localtime )
                . "-deploy.log";
    my @logfiles = ($logfile);
    open my $logfh, '>', TASKLOGS.$logfile;
    say $logfh "deploying " . join( ', ', map { $_->{hostname} } @vms );
    fork_call {
        #~ my $deployres = pmgr_calc_vmdeploy(\@vms);
        #~ return $deployres;
        #~ my $poolres = pmgr_poolresources($pve);
        
        foreach my $vm (@vms) {
            $logfile = pmgr_vmdeploy($pve, $vm, $logfh);
            push @logfiles, $logfile;
            ddx $logfile;
        }
    } sub {
        ddx @logfiles;
        pmgr_fiasco($req, $@) if $@;
        
        #~ pmgr_success( $req, shift );
        #~ return;
        
        pmgr_success( $req, "Журналы:\n" . join("\n", @logfiles) );
    };
}

# "Returns" content array [ Content-Type, Content body ]
# Body may represent JSON array of files in directory or
# file content, depending on "$path" parameter.
sub pmgr_tasklogs { 
    my ( $path, $callback ) = @_;

    fork_call {
        if(!$path) {
            my $tasklogs = TASKLOGS;
            my @files;
            for my $file (`ls -t $tasklogs | head -n 1000`) {
                next if $file =~ /^\./;
                push @files, {name => $file =~ s/\.[^.]+$//r};
            }
            return [ 'text/plain', encode_json(\@files) ];
            
        } else {
            substr $path, 0, 0, TASKLOGS;
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
sub pmgr_vm {
    my ($vm, $pve ) = @_;
    ddx $vm;
    if( !$vm->{node} ) {
        #~ my @vm0 =  grep { $_->{vmid} eq $vm->{vmid} }
                #~ $pve->get_cluster_resources( type => 'vm' );
        #~ ddx \@vm0;
        $vm = shift [
                grep { $_->{vmid} eq $vm->{vmid} }
                $pve->get_cluster_resources( type => 'vm' ) ];
    };
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

sub pmgr_calc_pool_acl_or_die {
    my $comment = %{ shift() }{comment};
    my $acl = $comment =~ s/.*___ACL: (.*); ACL___/$1/r;
    return decode_json($acl);
}

sub pmgr_set_pool_acl_or_die {
    my ($pve, $pool, $acl) = @_;
    my $comment = $pve->get_pool($pool)->{comment};
    $acl = encode_json($acl);
    $comment =~ s/(.*___ACL: ).*(; ACL___)/$1$acl$2/ or 
        $comment = $comment . '___ACL: ' . $acl . '; ACL___';
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

sub pmgr_vmdeploy_prepare_or_die {
    my ( $pve, $inparams, $pool ) = @_;
    ddx $inparams;
    
    my @templates = keys {
        map { $_ => 1 }
        map { $_->{template} } @{ $inparams->{vms} }
    };
    @templates = map { pmgr_vm( { vmid => $_ }, $pve ) } @templates;
    ddx \@templates;
    foreach my $vm ( @{$inparams->{vms}} ) {
        my $template = shift([
            grep { $_->{vmid} eq $vm->{template} } @templates
        ]);
        $vm->{vlans} ||= [ $pool->{acls}{vlanMin} ];
        #~ $vm->{maxcpu} = 
    }
    return 1;
}

sub pmgr_calc_vmdeploy {
    my $vms = shift;
    ddx scalar @$vms;
    return 1;
}