#!/usr/bin/env nix-shell
#!nix-shell "<nixpkgs>" -i bash -p nodePackages.node2nix

exec node2nix \
     --nodejs-12 \
     --input ../package.json \
     --development
