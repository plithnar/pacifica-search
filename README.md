# pacifica-search

Pacifica Generalized Search Interface

This stack is intended to be co-located with the remainder of the Pacifica components in order to build correctly. From the top-level pacifica project, add this project as a sub-module and it will be able to properly reference the other required components in the system (namely, metadata and policy and their dependencies).

## Setting up the stack components

### Clone or use existing pacifica distribution

    git clone git@github.com:pacifica/pacifica.git <local Pacifica directory>

### Pull Source as Submodule into Pacifica
Change into your Pacifica main directory and pull this project in as a submodule.

    $ cd <local Pacifica directory>
    $ git submodule add git@github.com:mvaliev/pacifica-search.git search

### Install Symfony dependencies with Composer
Change into
application subdirectory

    cd <local Pacifica directory>/search/application
    
and install Composer following instructions 
from  '[Composer download site](https://getcomposer.org/download/) 

Next, run Composer to install everything from your `composer.json` file

    $ php composer.phar install

Composer will run for a few minutes and install a bunch of new stuff into a newly created `vendor` directory, including all the workings for Symfony.

### Install javascript dependencies

    cd <local Pacifica directory>/search/application/web/assets/js/
    npm install

### Set up tunnel to remote server
Create subdirectory tunnel-config
in the local .ssh directory

Populate tunnel-config with appropriate ssh keys naming them as

    tunnel_id_rsa		tunnel_id_rsa.pub

Create config file in tunnel-config with the following contents:

    Host pacifica-tunnel
        HostName myemsl-dev-mgmt.emsl.pnl.gov
        IdentityFile /root/.ssh/tunnel_id_rsa
        User root
        ForwardAgent yes
        TCPKeepAlive yes
        ConnectTimeout 5
        ServerAliveCountMax 10
        ServerAliveInterval 15

### Bring up the Docker instances
From your new `search` directory, run `docker-compose` to bring up your containers

    $ docker-compose up --build

This will run them non-daemonized so that you can see what they are doing in your console window. Add the `-d` option to the end of the command to run them as detached.

### Check out your new stack
Visit [http://127.0.0.1/](http://127.0.0.1/) in your browser to load the Pacifica Search app.
