#!/bin/bash

npm run clean
npm run build
npm run build:demo
npm pack

# deploy the document to github page
DOC_REPO=croppix-ez-doc
git -C ${DOC_REPO} checkout master
git -C ${DOC_REPO} status .
rm -rf ${DOC_REPO}/*
cp -rfv www/* ${DOC_REPO}
git -C ${DOC_REPO} add --all
git -C ${DOC_REPO} commit -a -m "auto commit"
git -C ${DOC_REPO} push origin master
