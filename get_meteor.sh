#!/bin/bash

if [ ! -d ~/.meteor ]; then
    curl https://install.meteor.com | /bin/sh
fi
