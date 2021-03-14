#!/usr/bin/env perl
use strict;
use utf8;
use 5.010;
# use AnyEvent; # libanyevent-perl
# use EV; # libev-perl
use Mojolicious::Lite;
use Mojo::Log;
# binmode STDOUT, ':encoding(UTF-8)';
use DBI;
use Data::Dumper;
# use Encode;
use Mojolicious::Plugin::Authentication;
use Mojolicious::Plugin::RemoteAddr;
use Mojolicious::Plugin::Config;
use HTTP::BrowserDetect; # libtest-most-perl libhttp-browserdetect-perl 
# use DBIx::Connector; # libdbix-connector-perl
 # use List::MoreUtils qw(uniq);


 # say app->sessions->default_expiration(3600); # set expiry to 1 hour
 app->sessions->default_expiration(60*60);
 # say app->sessions->default_expiration(); # set expiry to 1 hour

# my $random_number = int(rand($range));


use Time::HiRes qw/gettimeofday/;

# Disable IPv6, epoll and kqueue
# BEGIN { $ENV{MOJO_NO_IPV6} = $ENV{MOJO_POLL} = 1 }
my $cfg = plugin Config => {file => 'graph.conf'};
plugin('RemoteAddr');
app->config(hypnotoad => {
	listen => ['http://*:'.$cfg->{port}],
	proxy => 1,
	workers => 1
	});
app->secrets(['7b840960b54f7dd5b0c263f44ce273d36b1cd55cbf1b4375961123131f012e5055039']);
app->defaults(gzip => 1);
app->mode($cfg->{mode});
# push @{app->static->paths}, '/d/viz/graph';
push @{app->static->paths}, '../';

my $log = Mojo::Log->new(path => $cfg->{log});

app->attr(dbh => sub { # dbh attribute
	my $c = shift;
	my $dbh = DBI->connect("dbi:SQLite:".$cfg->{db},"","", {sqlite_unicode => 1,  AutoCommit => 1, RaiseError => 1, sqlite_use_immediate_transaction => 1,});

	$log->info( $dbh ? "DB connect": "DB error"); 
	return $dbh;
	
	# my $conn = DBIx::Connector->new("dbi:SQLite:".$cfg->{db}, "", "", {sqlite_unicode => 1,  AutoCommit => 0, RaiseError => 1});
});


helper db => sub { app->dbh };

$log->format(sub {	
    my ($time, $level, @lines) = @_;
    return "[".localtime(time)."]  [$level] ". join("\n", @lines) . "\n";
 });

hook before_dispatch => sub {
   my $c = shift;
   # notice: url must be fully-qualified or absolute, ending in '/' matters.
   $c->req->url->base(Mojo::URL->new($cfg->{site}));
};  

helper log => sub {
	my $c = shift;
	my $text = shift;
	my $uid = $c->current_user->{'id'};
	if ($uid > 1){
		# my $r_ip = $c->tx->remote_address;
		my $r_ip = $c->remote_addr;
		$log->info($r_ip.' {'.$uid.'} '.$c->current_user->{'name'}." • ".$text);
	}
};

any '/' => sub {                
    my $c = shift;
	# $c->req->param('u'), $c->req->param('p')
	$c->reply->static('index.html');
	
};

any '/save' => sub {                
    my $c = shift;
	
	my $graph = $c->param('graph');
	my $name = $c->param('name');
	my $id = $c->param('id');
	my $res_id = $id;
	my $dbh = $c->app->dbh;
	
	my $user_id = 1; # must be set from SESSION
	
	# SELECT * FROM table ORDER BY column DESC LIMIT 1;
	say "request to save: id $id, name $name";
	
	unless($id) { # id is empty - do INSERT
		say "INSERT";
		my $sql = "INSERT INTO graphs ('tm', 'graph_name', 'graph_json', 'user_id') VALUES (datetime('NOW'), ?, ?, ?)";
		my $sth = $dbh->prepare($sql) or die "Cannot prepare: " . $dbh->errstr();
		$sth->execute($name, $graph, $user_id) or die "Cannot execute: " . $sth->errstr();
		$sth->finish();
		my $new_id = $dbh->last_insert_id("", "", "graphs", "");
		say "new id $new_id";
		$res_id = $new_id;
	} else { # UPDATE
		say "UPDATE";
		my $sth = eval { $dbh->prepare("UPDATE graphs SET graph_json = ?, graph_name =? WHERE id =?" ) } || return undef;
		$sth->execute($graph, $name, $id) or die "Cannot execute: " . $sth->errstr();
		$sth->finish();
	}
	$c->render(text => $res_id );
};
any '/rename' => sub {                
    my $c = shift;
	
	my $name = $c->param('name');
	my $id = $c->param('id');
	my $res = 'fail';
	my $dbh = $c->app->dbh;
	if ($id) {
		say "rename to ".$name;
		my $sth = eval { $dbh->prepare("UPDATE graphs SET graph_name =? WHERE id =?" ) } || return undef;
		$sth->execute($name, $id) or die "Cannot execute: " . $sth->errstr();
		$sth->finish();
		$res = 'ok';
	} else {
		$res = 'no id!';
	}
	$c->render(text => $res);
};


any '/last' => sub {                
    my $c = shift;
	my $id = $c->param('id');
	
	my $user_id = 1;
	
	my $res = 'fail';
	my $dbh = $c->app->dbh;
	if ($id) {
		my $sth = eval { $dbh->prepare("UPDATE users SET last_graph = ? WHERE id =?" ) } || return undef;
		$sth->execute($id, $user_id) or die "Cannot execute: " . $sth->errstr();
		$sth->finish();
		$res = $id + " ok";
	} else {
		$res = 'no id!';
	}
	$c->render(text => $res);
};



any '/load.json' => sub {
	
	my $c = shift;
	my $q = $c->req->params->[0];
	# say Dumper ($q);
	my $dbh = $c->app->dbh;
	# my $ref;
	my $ref;
	# say $q;
	if ($q =~ /\d/) {
		($ref) = $dbh->selectrow_array("select graph_json from graphs where id = ".$q);
	}
	$c->render(json => $ref );
};
any '/user.json' => sub {
	my $c = shift;
	my $q = $c->req->params->[0];
	# say Dumper ($q);
	my $dbh = $c->app->dbh;
	my $ref = $dbh->selectall_arrayref("select * from users where id = 1", { Slice => {} });
	$c->render(json => $ref );
};

any '/list.json' => sub {
	my $c = shift;
	my $dbh = $c->app->dbh;
	my $ref = $dbh->selectall_arrayref("select id, graph_name from graphs where user_id = 1", { Slice => {} });
	$c->render(json => $ref );
};

app->start;