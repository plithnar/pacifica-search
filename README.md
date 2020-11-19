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

### Install Symfony dependencies with Composer
Now that you've got Composer and the Symfony installer set up, let Composer do its thing. First change to the directory into which you pulled the project code.

    $ cd search

Next, run Composer to install everything from your `composer.json` file

    $ composer install

Composer will run for a few minutes and install a bunch of new stuff into a newly created `vendor` directory, including all the workings for Symfony.

You will also need to run Composer inside the `application` directory

    $ cd application
    $ composer install

### Bring up the Docker instances
From your new `search` directory, run `docker-compose` to bring up your containers

    $ docker-compose up --build

This will run them non-daemonized so that you can see what they are doing in your console window. Add the `-d` option to the end of the command to run them as detached.

### Updating the Search React system
If you need to make updates to the React system for the Search UI, you will need to perform the following steps:

#### Installing Node Version Manager and proper version of Node
To install or update nvm, you should run the [install script](https://github.com/nvm-sh/nvm/blob/v0.37.0/install.sh). To do that, you may either download and run the script manually, or use the following cURL or Wget command:

    $ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.0/install.sh | bash
    $ wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.0/install.sh | bash

Running either of the above commands downloads a script and runs it. The script clones the nvm repository to ~/.nvm, and attempts to add the source lines from the snippet below to the correct profile file (~/.bash_profile, ~/.zshrc, ~/.profile, or ~/.bashrc).


    $ export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")" [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

Once the NVM has been installed, you will need to change your running version of node to version 11.15.0

    $ nvm install 11.15.0
    $ nvm use 11.15.0
    
#### Install NPM packages
Navigate to the Javascript section of the project. From the top level directory, perform the following commands:

    $ cd application/web/assets/js
    $ npm install
    
#### Run the 'watch' script to start Laravel watching for changes
Once the packages have been installed, the following command will start up Laravel. This process will watch for code changes on the appropriate files, and generate a new ReactJS file for the system to use when rendering the UI.

    $ npm run watch

### Check out your new stack
Visit [http://127.0.0.1/](http://127.0.0.1/) in your browser to load the Pacifica Search app.
