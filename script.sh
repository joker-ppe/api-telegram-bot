#!/bin/bash
rm -r api-telegram-bot/

# open port
sudo ufw enable

sudo ufw allow 22/tcp

sudo ufw allow 443

sudo ufw allow 5432

sudo ufw allow 3004

sudo ufw allow 8080

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
sudo docker stop $(docker ps -a -q)
sudo docker rm $(docker ps -a -q)
sudo docker rmi -f $(docker images -aq)
sudo docker-compose up -d

sudo docker run -u 0 --privileged --name jenkins -p 8080:8080 -p 50000:50000 -v /var/run/docker.sock:/var/run/docker.sock -v $(which docker):/usr/bin/docker -v $(which docker-compose):/usr/bin/docker-compose -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts-jdk17


# sudo chmod 666 /var/run/docker.sock