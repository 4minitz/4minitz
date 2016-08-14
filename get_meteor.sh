#!/bin/bash

if [ ! -f ~/.meteor/meteor ]; then
    curl https://install.meteor.com | /bin/sh
fi
