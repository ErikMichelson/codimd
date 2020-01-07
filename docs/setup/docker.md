# CodiMD Docker Image
[Docker](https://docker.com) is a software to run containers with applications in a virtualized environment.
Hosted on quay.io you will find CodiMD Docker containers based on Debian and based on Alpine. The easiest way to run CodiMD with Docker is using [docker-compose](https://docs.docker.com/compose/).

You might want to try out the Docker image in beforehand at play-with-docker.com:  
[![Try in PWD](https://cdn.jsdelivr.net/gh/play-with-docker/stacks@latest/assets/images/button.png)](https://labs.play-with-docker.com/?stack=https://github.com/codimd/container/raw/master/docker-compose.yml&stack_name=codimd)


## Docker container
[![Docker Repository on Quay](https://quay.io/repository/codimd/server/status "Docker Repository on Quay")](https://quay.io/repository/codimd/server)  
If you have installed Docker, you can install CodiMD with the following command:
```bash
docker pull quay.io/codimd/server:latest
```
For the alpine-based version use:
```bash
docker pull quay.io/codimd/server:alpine
```

## Docker-compose
If you have docker-compose installed, you can generate and start the Docker container with just three commands:
```bash
git clone https://github.com/codimd/container.git codimd-container
cd codimd-container
docker-compose up
```

## More information
Read more about it in the [container repository](https://github.com/codimd/container).
