# pacifica-search

Pacifica Generalized Search Interface

This stack is intended to be co-located with the remainder of the Pacifica components in order to build correctly. From the top-level pacifica project, add this project as a sub-module and it will be able to properly reference the other required components in the system (namely, metadata and policy and their dependencies).

## Setting up the stack components

### Pull Source as Submodule into Pacifica
Change into your Pacifica main directory and pull this project in as a submodule.

    $ cd <local Pacifica directory>
    $ git submodule add https://github.com/kauberry/pacifica-search.git search

### Install Composer
If you haven't already installed Composer (the dependency manager for PHP), do so by running the following in your terminal.

    $ php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
    $ php -r "if (hash_file('SHA384', 'composer-setup.php') === '669656bab3166a7aff8a7506b8cb2d1c292f042046c5a994c43155c0be6190fa0355160742ab2e1c88d40d5be660b410') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"
    $ php composer-setup.php
    $ php -r "unlink('composer-setup.php');"

See the [Composer download site](https://getcomposer.org/download/) for more detailed instructions.

### Install the Symfony installer script
#### Linux and Mac OS X Systems

Open your command console and execute the following commands:

    $ sudo curl -LsS http://symfony.com/installer -o /usr/local/bin/symfony
    $ sudo chmod a+x /usr/local/bin/symfony

This will create a global `symfony` command in your system.

#### Windows Systems

Open your command console and execute the following command:

    c:\> php -r "readfile('http://symfony.com/installer');" > symfony

Then, move the downloaded `symfony` file to your project's directory and
execute it as follows:

    c:\> move symfony c:\projects
    c:\projects\> php symfony


### Install Symfony dependencies with Composer
Now that you've got Composer and the Symfony installer set up, let Composer do its thing. First change to the directory into which you pulled the project code.

    $ cd search

Next, run Composer to install everything from your `composer.json` file

    $ composer install

Composer will run for a few minutes and install a bunch of new stuff into a newly created `vendor` directory, including all the workings for Symfony.

### Generate a new application instance
Now, run the Symfony create script to make a new instance where you can work. `application name` is usually `app` or `application`

    $ symfony new <application name>

Follow the directions shown after the install to make sure that everything is working properly for the installation.

### Bring up the Docker instances
From your new `search` directory, run `docker-compose` to bring up your containers

    docker-compose up --build

This will run them non-daemonized so that you can see what they are doing in your console window. Add the `-d` option to the end of the command to run them as detached.

### Warm up the Symfony cache

    docker exec searchsite php /var/www/html/bin/console cache:warmup --env=prod

### Temporarily switch on debug mode for production
This is just for now until we figure out a fix. Edit `search/application/src/web/app.php` and change the following line...

    $kernel = new AppKernel('prod', false);

to...

    $kernel = new AppKernel('prod', true);

The last argument controls whether or not debugging mode is to be used. If we don't do this, any page other than the top-level root will give an unnecessary 404 Not Found error.

### Check out your new stack
Visit [http://127.0.0.1/](http://127.0.0.1/) in your browser, and you should see the Symfony "hello world" page staring back at you.
