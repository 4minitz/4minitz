## How to build a docker image for a 4Minitz demo server

Hint: The BUILD.sh script below will not work on Windows.
Use MacOS or Linux to build a docker image.
Nevertheless - the resulting docker image should run on all platforms
that are officially supported by docker.

1. Install [docker](https://docs.docker.com/engine/installation/)
1. Inside the '.docker' directory run `./BUILD.sh` with an optional list of tags. E.g.:
    ````
    ./BUILD_DOCKER.sh 0 0.8 0.8.1 master stable latest
    ./BUILD_DOCKER.sh 0.9.x develop unstable edge
    ./BUILD_DOCKER.sh --imagename johndoe/4minitzdemo 0.9.x develop unstable edge
    ````

1. Push the tagged images to docker hub
    ````
    docker push 4minitz/4minitz
    docker push johndoe/4minitzdemo
   ````

Afterwards the image can be used via:

    docker run -it --rm -v $(pwd)/4minitz_storage:/4minitz_storage -p 3100:3333 4minitz/4minitz:stable
    docker run -it --rm -v $(pwd)/4minitz_storage:/4minitz_storage -p 3100:3333 johndoe/4minitzdemo
