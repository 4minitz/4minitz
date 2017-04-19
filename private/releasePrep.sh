#!/usr/bin/env bash

# Prepare release

#### Prepare package.json
packageJson=../package.json
packageJsonBak=$packageJson.bak

if [ -f "$packageJson" ]
then
    echo "Patching $packageJson"
    cp $packageJson $packageJsonBak
    echo "Stored backup in $packageJsonBak"
    branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')
    commitshort=$(git rev-parse --short HEAD 2> /dev/null | sed "s/\(.*\)/\1/")
    commitlong=$(git rev-parse HEAD 2> /dev/null | sed "s/\(.*\)/\1/")
    tag=$(git describe --tags --abbrev=0)
    releasedate=$(git show -s --format=%ci $commitlong | cut -c 1-10)

    echo "   Version:        \"$tag\""
    echo "   Branch:         \"$branch\""
    echo "   Commit short:   \"$commitshort\""
    echo "   Commit long:    \"$commitlong\""
    echo "   Releasedate:    \"$releasedate\""

    sed -i '' 's/"version":.*"[^\"]*"/"version": "'$tag'"/' $packageJson
    sed -i '' 's/"4m_branch":.*"[^\"]*"/"4m_branch": "'$branch'"/' $packageJson
    sed -i '' 's/"4m_commitshort":.*"[^\"]*"/"4m_commitshort": "'$commitshort'"/' $packageJson
    sed -i '' 's/"4m_commitlong":.*"[^\"]*"/"4m_commitlong": "'$commitlong'"/' $packageJson
    sed -i '' 's/"4m_releasedate":.*"[^\"]*"/"4m_releasedate": "'$releasedate'"/' $packageJson
else
    echo "$packageJson not found."
fi
