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

commit_change() {
  git commit -a -m "auto-commit $(date --iso-8601)"
  git push origin master
}

# deploy the document to github page
deploy() {
    git -C ${DOC_REPO} checkout master
    git -C ${DOC_REPO} status .
    rm -rf ${DOC_REPO}/*
    cp -rf ${DEMO}/www/* ${DOC_REPO}
    git -C ${DOC_REPO} add --all
    git -C ${DOC_REPO} commit -a -m "auto commit"
    git -C ${DOC_REPO} push origin master
}

publish() {
  cat npmrc.template > .npmrc
  npm publish
}

install
build
build_demo
commit_change
deploy
