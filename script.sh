#!/bin/bash
rm -r nestjs-api-thesis/

# open port
sudo ufw enable

sudo ufw allow 22/tcp

sudo ufw allow 5432

sudo ufw allow 3003

sudo ufw allow ssh

# install Docker
sudo apt-get update

sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list &gt; /dev/null

sudo apt-get update

sudo apt-get install docker-ce docker-ce-cli containerd.io

sudo docker run hello-world

sudo docker rm -f $(docker ps -aq)

# install Docker Compose
sudo curl -L https://github.com/docker/compose/releases/download/v2.5.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

sudo chmod 666 /var/run/docker.sock

docker-compose --version

# build docker-compose
sudo docker-compose up -d