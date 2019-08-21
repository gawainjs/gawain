#!/usr/bin/env bash

BASEDIR=$(dirname "$0")
TEMPDIR="$BASEDIR/../tmp"
mkdir -p $TEMPDIR

# quickjs
# curl -o "$TEMPDIR/quickjs.tar.xz" https://bellard.org/quickjs/quickjs-2019-08-18.tar.xz
# tar -zxvf "$TEMPDIR/quickjs.tar.xz" -C $TEMPDIR
curl -o "$TEMPDIR/quickjs-windows.zip" https://codeload.github.com/quickjs-zh/quickjs-windows/zip/master
unzip -d $TEMPDIR "$TEMPDIR/quickjs-windows.zip"

# sdl2
curl -o "$TEMPDIR/sdl2-win.tar.gz" https://www.libsdl.org/release/SDL2-devel-2.0.10-mingw.tar.gz
tar -zxvf "$TEMPDIR/sdl2-win.tar.gz" -C $TEMPDIR
