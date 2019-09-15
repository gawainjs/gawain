TMP = tmp
DIST = dist
OBJDIR_MACOS = tmp/macos/.obj
OBJDIR_WINDOWS = tmp/windows/.obj
QUICKJS_STATIC = node_modules/quickjs-static
GENERATED = src/generated
ENTRYPOINT_MACOS = $(OBJDIR_MACOS)/entrypoint.o
ENTRYPOINT_WINDOWS = $(OBJDIR_WINDOWS)/entrypoint.o
C_ENTRYPOINT = src/native/entrypoint.c
JS_ENTRYPOINT = $(GENERATED)/js-entrypoint.c
NATIVE_BINDINGS = $(wildcard src/native/binding/*.c)
BIN_MACOS = $(TMP)/macos/app
BIN_WINDOWS = $(TMP)/windows/app
BIN_DEV_MACOS = $(TMP)/macos/app-dev
SDL2_VERSION = 2.0.10
QUICKJS_VERSION = 2019-08-10
DOCKCROSS_WINDOWS = $(TMP)/dockcross-win
SDL2_FRAMEWORK_MACOS = $(TMP)/SDL2.framework
SDL2_MINGW_WINDOWS = $(TMP)/SDL2-$(SDL2_VERSION)/x86_64-w64-mingw32
CC_WINDOWS = $(DOCKCROSS_WINDOWS) x86_64-w64-mingw32.static-gcc
SDL2_CONFIG_WINDOWS = $(DOCKCROSS_WINDOWS) $(SDL2_MINGW_WINDOWS)/bin/sdl2-config
CC_SDL2_OPTIONS_MACOS = -rpath @executable_path/../Frameworks -F $(TMP) -framework SDL2
CC_SDL2_DEV_OPTIONS_MACOS = -rpath @executable_path/..
CC_SDL2_OPTIONS_WINDOWS = -I$(SDL2_MINGW_WINDOWS)/include/SDL2 -L$(SDL2_MINGW_WINDOWS)/lib $(shell $(SDL2_CONFIG_WINDOWS) --static-libs)
CC_QUICKJS_PATH_MACOS = $(QUICKJS_STATIC)/bin/macos/quickjs-$(QUICKJS_VERSION)
CC_QUICKJS_PATH_WINDOWS = $(QUICKJS_STATIC)/bin/windows/quickjs-$(QUICKJS_VERSION)
CC_QUICKJS_OPTIONS_MACOS = -I$(CC_QUICKJS_PATH_MACOS) -L$(CC_QUICKJS_PATH_MACOS) -lquickjs
CC_QUICKJS_OPTIONS_WINDOWS = -I$(CC_QUICKJS_PATH_WINDOWS) -L$(CC_QUICKJS_PATH_WINDOWS) -lquickjs
CC_MACOS_OPTIONS = $(CC_SDL2_OPTIONS_MACOS) $(CC_QUICKJS_OPTIONS_MACOS)
CC_WINDOWS_OPTIONS = -static $(CC_SDL2_OPTIONS_WINDOWS) $(CC_QUICKJS_OPTIONS_WINDOWS)

.PHONY: all
all: macos windows

.PHONY: clean
clean:
	-@$(RM) -rf $(TMP) $(DIST) $(GENERATED)

.PHONY: dev
dev: $(BIN_DEV_MACOS)
	$(BIN_DEV_MACOS)

.PHONY: macos
macos: $(BIN_MACOS)
	@mkdir -p $(DIST)
	cp -R dev/gawain.app $(DIST)/gawain.app
	@mkdir -p $(DIST)/gawain.app/Contents/MacOS
	cp $(BIN_MACOS) $(DIST)/gawain.app/Contents/MacOS/app
	@mkdir -p $(DIST)/gawain.app/Contents/Frameworks
	cp -R $(SDL2_FRAMEWORK_MACOS) $(DIST)/gawain.app/Contents/Frameworks/SDL2.framework

.PHONY: windows
windows: $(BIN_WINDOWS)
	@mkdir -p $(DIST)
	cp $(BIN_WINDOWS) $(DIST)/gawain.exe

$(BIN_MACOS): $(ENTRYPOINT_MACOS) $(patsubst src/native/binding/%.c, $(OBJDIR_MACOS)/%.o, $(NATIVE_BINDINGS))
	@mkdir -p $(TMP)/macos
	$(CC) $(CC_MACOS_OPTIONS) -o $@ $^

$(BIN_DEV_MACOS): $(ENTRYPOINT_MACOS) $(patsubst src/native/binding/%.c, $(OBJDIR_MACOS)/%.o, $(NATIVE_BINDINGS))
	@mkdir -p $(TMP)/macos
	$(CC) $(CC_SDL2_DEV_OPTIONS_MACOS) $(CC_MACOS_OPTIONS) -o $@ $^

$(ENTRYPOINT_MACOS): $(JS_ENTRYPOINT) $(C_ENTRYPOINT) $(SDL2_FRAMEWORK_MACOS)
	@mkdir -p $(OBJDIR_MACOS)
	$(CC) $(CC_MACOS_OPTIONS) -c -o $@ $(C_ENTRYPOINT)

$(OBJDIR_MACOS)/%.o: src/native/binding/%.c $(SDL2_FRAMEWORK_MACOS)
	@mkdir -p $(OBJDIR_MACOS)
	$(CC) $(CC_MACOS_OPTIONS) -c -o $@ $<

$(BIN_WINDOWS): $(ENTRYPOINT_WINDOWS) $(patsubst src/native/binding/%.c, $(OBJDIR_WINDOWS)/%.o, $(NATIVE_BINDINGS))
	@mkdir -p $(TMP)/windows
	$(CC_WINDOWS) -o $@ $^ $(CC_WINDOWS_OPTIONS)

$(ENTRYPOINT_WINDOWS): $(JS_ENTRYPOINT) $(C_ENTRYPOINT) $(SDL2_MINGW_WINDOWS) $(DOCKCROSS_WINDOWS)
	@mkdir -p $(OBJDIR_WINDOWS)
	$(CC_WINDOWS) $(CC_WINDOWS_OPTIONS) -c -o $@ $(C_ENTRYPOINT)

$(OBJDIR_WINDOWS)/%.o: src/native/binding/%.c $(SDL2_MINGW_WINDOWS) $(DOCKCROSS_WINDOWS)
	@mkdir -p $(OBJDIR_WINDOWS)
	$(CC_WINDOWS) $(CC_WINDOWS_OPTIONS) -c -o $@ $<

$(JS_ENTRYPOINT): src/entrypoint.js $(QUICKJS_STATIC)
	@mkdir -p $(GENERATED)
	npx qjsc -c -m -M sdl.so,sdl -o $@ src/entrypoint.js

$(QUICKJS_STATIC):
	npm install

$(SDL2_FRAMEWORK_MACOS):
	@mkdir -p $(TMP)
	curl -o "$(TMP)/SDL2-$(SDL2_VERSION).dmg" https://www.libsdl.org/release/SDL2-$(SDL2_VERSION).dmg
	hdiutil mount $(TMP)/SDL2-$(SDL2_VERSION).dmg
	cp -R /Volumes/SDL2/SDL2.framework $(SDL2_FRAMEWORK_MACOS)
	hdiutil unmount /Volumes/SDL2

$(SDL2_MINGW_WINDOWS):
	@mkdir -p $(TMP)
	curl -o "$(TMP)/sdl2-win.tar.gz" https://www.libsdl.org/release/SDL2-devel-$(SDL2_VERSION)-mingw.tar.gz
	tar -zxvf "$(TMP)/sdl2-win.tar.gz" -C $(TMP)

$(DOCKCROSS_WINDOWS):
	@mkdir -p $(TMP)
	docker run --rm dockcross/windows-static-x64 > $(DOCKCROSS_WINDOWS)
	chmod +x $(DOCKCROSS_WINDOWS)
