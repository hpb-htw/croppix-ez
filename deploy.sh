#!/bin/bash

DEMO=demo
DOC_REPO=croppix-ez-doc

install() {
    npm install
    pushd DEMO
    npm install
    popd
}


build() {
    npm run clean
    npm run build
    npm pack
}

build_demo() {
    pushd $DEMO
    npm run build
    popd
}

# deploy the document to github page
deploy() {
    git -C ${DOC_REPO} checkout master
    git -C ${DOC_REPO} status .
    rm -rf ${DOC_REPO}/*
    cp -rfv ${DEMO}/www/* ${DOC_REPO}
    git -C ${DOC_REPO} add --all
    git -C ${DOC_REPO} commit -a -m "auto commit"
    git -C ${DOC_REPO} push origin master
}

build
build_demo
deploy
