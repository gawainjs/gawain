#!/usr/bin/env bash

BASEDIR=$(dirname "$0")
TEMPDIR="$BASEDIR/../tmp"

# sdl2
mkdir -p $TEMPDIR
curl -o "$TEMPDIR/sdl2-win.tar.gz" https://www.libsdl.org/release/SDL2-devel-2.0.10-mingw.tar.gz
tar -zxvf "$TEMPDIR/sdl2-win.tar.gz" -C $TEMPDIR
