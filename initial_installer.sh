#!/bin/bash
: '
Copyright (c) 2022 AItoAir. All rights reserved.
Licensed under Apache License 2.0 (see LICENSE)
Tinyboom Linux node CLI installation script.
'
set -e

CLI_REPO=https://github.com/AItoAir/tinyboom-linux-cli.git

# Root user detection
if [ "$(echo "$UID")" = "0" ]; then
    sudo_cmd=''
else
    sudo_cmd='sudo'
fi

$sudo_cmd apt-get update && 
$sudo_cmd apt-get install -y git \
gstreamer1.0-tools gstreamer1.0-plugins-good \
gstreamer1.0-plugins-base gstreamer1.0-plugins-base-apps

# remove cache files
$sudo_cmd apt-get clean && $sudo_cmd rm -rf /var/lib/apt/lists/*

# nvm install
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
# load nvm
source $HOME/.nvm/nvm.sh

# node install
nvm install 15

git clone $CLI_REPO
cd tinyboom-linux-cli/
npm install

printf "
Close this terminal and reopen it to enable node command in terminal.
You can now run Tinyboom Linux CLI under './tinyboom-linux-cli' directory.
'node tinyboom-cli --project PROJECT_ID --api-key PROJECT_API_KEY'

For more options, please check 'node tinyboom-cli --help'
"