#!/bin/bash

# exit when any command fails
set -e

validate_frontmatter () {
    grep -r '^title: ' app | while read MATCH
    do
        FILE=`echo $MATCH | cut -f 1 -d ':'`
        TITLE=`echo $MATCH | cut -f 2- -d ':' | sed 's/^title: //'`
        if echo $TITLE | grep ':' | grep -q -v [\'\"]
        then
            echo "Invalid YAML: $FILE needs title quoted"
            return 1
        fi
    done
}

if validate_frontmatter
then
    docker compose run -e JEKYLL_ENV=production jekyll jekyll build --trace
    java -jar node_modules/vnu-jar/build/dist/vnu.jar --skip-non-html --errors-only --filterfile tests/config/vnufilter.txt build/
    echo "$(find ./build -type f -name "*.html" | wc -l) files validated"
else
    exit 1
fi
