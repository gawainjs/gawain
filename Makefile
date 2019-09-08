TMP = tmp
DIST = dist
OBJDIR_MACOS = tmp/macos/.obj
OBJDIR_WINDOWS = tmp/windows/.obj
GENERATED = src/generated
ENTRYPOINT_MACOS = $(OBJDIR_MACOS)/entrypoint.o
ENTRYPOINT_WINDOWS = $(OBJDIR_WINDOWS)/entrypoint.o
C_ENTRYPOINT = src/native/entrypoint.c
JS_ENTRYPOINT = $(GENERATED)/js-entrypoint.c
NATIVE_BINDINGS = $(wildcard src/native/binding/*.c)
BIN_MACOS = $(TMP)/macos/app
BIN_WINDOWS = $(TMP)/windows/app
SDL2_VERSION = 2.0.10
SDL2_FRAMEWORK = $(TMP)/SDL2.framework
CC_SDL2_OPTIONS_MACOS = -rpath @executable_path/../Frameworks -F $(TMP) -framework SDL2

.PHONY: all
all: clean macos

.PHONY: clean
clean:
	-@$(RM) -rf $(TMP) $(DIST) $(OBJDIR_MACOS) $(OBJDIR_WINDOWS) $(GENERATED)

.PHONY: macos
macos: $(BIN_MACOS)
	@mkdir -p $(DIST)
	cp -R dev/gawain.app $(DIST)/gawain.app
	@mkdir -p $(DIST)/gawain.app/Contents/MacOS
	cp $(BIN_MACOS) $(DIST)/gawain.app/Contents/MacOS/app
	@mkdir -p $(DIST)/gawain.app/Contents/Frameworks
	cp -R $(SDL2_FRAMEWORK) $(DIST)/gawain.app/Contents/Frameworks/SDL2.framework

$(BIN_MACOS): $(ENTRYPOINT_MACOS) $(patsubst src/native/binding/%.c, $(OBJDIR_MACOS)/%.o, $(NATIVE_BINDINGS))
	@mkdir -p $(TMP)/macos
	$(CC) $(CC_SDL2_OPTIONS_MACOS) -L/usr/local/lib/quickjs -lquickjs -o $@ $^

$(ENTRYPOINT_MACOS): $(JS_ENTRYPOINT) $(C_ENTRYPOINT)
	@mkdir -p $(OBJDIR_MACOS)
	$(CC) $(CC_SDL2_OPTIONS_MACOS) -I/usr/local/include/quickjs -c -o $@ $(C_ENTRYPOINT)

$(OBJDIR_MACOS)/%.o: src/native/binding/%.c $(SDL2_FRAMEWORK)
	@mkdir -p $(OBJDIR_MACOS)
	$(CC) $(CC_SDL2_OPTIONS_MACOS) -I/usr/local/include/quickjs -c -o $@ $<

$(JS_ENTRYPOINT): src/entrypoint.js
	@mkdir -p $(GENERATED)
	qjsc -c -m -M sdl.so,sdl -o $@ src/entrypoint.js

$(SDL2_FRAMEWORK):
	@mkdir -p $(TMP)
	curl -o "$(TMP)/SDL2-$(SDL2_VERSION).dmg" https://www.libsdl.org/release/SDL2-$(SDL2_VERSION).dmg
	hdiutil mount $(TMP)/SDL2-$(SDL2_VERSION).dmg
	cp -R /Volumes/SDL2/SDL2.framework $(SDL2_FRAMEWORK)
	hdiutil unmount /Volumes/SDL2
