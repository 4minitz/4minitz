## How to build a dockerfile for a 4Minitz demo server

Hint: The BUILD.sh script below will not work on Windows.
Use MacOS or Linux to build a docker image.
Nevertheless - the resulting docker image should run on all platforms
that are officially supported by docker. 

1. Install [docker](https://docs.docker.com/engine/installation/)
1. Run `./BUILD.sh` with an optional list of tags. E.g.: 
    ````
    ./BUILD.sh 0 0.8 0.8.1 master stable
    ./BUILD.sh 0.9.x develop unstable edge
    ````
    
1. Push the tagged images to docker hub
    ````
    docker push derwok/4minitz
    docker push derwok/4minitz:0
   docker push derwok/4minitz:0.8
   docker push derwok/4minitz:0.8.1
   docker push derwok/4minitz:master
   docker push derwok/4minitz:stable
   ````

Afterwards the image can be used via:

    docker run -it --rm -v $(pwd)/4minitz_storage:/4minitz_storage -p 3100:3333 derwok/4minitz:stable
    
