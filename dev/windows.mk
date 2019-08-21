CC = x86_64-w64-mingw32-gcc
SDL2 = tmp/SDL2-2.0.10/x86_64-w64-mingw32
# QUICKJS = tmp/quickjs-2019-08-18
QUICKJS_LIB = tmp/quickjs-windows-master/build
QUICKJS_INCLUDE = tmp/quickjs-windows-master/quickjs-2019-08-10

TMP = tmp
DIST = dist
OBJDIR = .obj
GENERATED = src/generated
ENTRYPOINT = $(OBJDIR)/entrypoint.o
C_ENTRYPOINT = src/native/entrypoint.c
JS_ENTRYPOINT = $(GENERATED)/js-entrypoint.c
NATIVE_BINDINGS = $(wildcard src/native/binding/*.c)
BIN = $(DIST)/app

.PHONY: all
all: $(BIN)

.PHONY: clean
clean:
	-@$(RM) -rf $(TMP) $(DIST) $(OBJDIR) $(GENERATED)

$(BIN): $(ENTRYPOINT) $(patsubst src/native/binding/%.c, $(OBJDIR)/%.o, $(NATIVE_BINDINGS))
	@mkdir -p $(DIST)
	$(CC) -static -mwindows -L/usr/local/lib -lmingw32 -L$(SDL2)/lib -lSDL2main -lSDL2 -L$(QUICKJS_LIB) -lquickjs -o $@ $^

$(ENTRYPOINT): $(JS_ENTRYPOINT) $(C_ENTRYPOINT)
	@mkdir -p $(OBJDIR)
	$(CC) -I$(SDL2)/include/SDL2 -D_THREAD_SAFE -I$(QUICKJS_INCLUDE) -c -o $@ $(C_ENTRYPOINT)

$(OBJDIR)/%.o: src/native/binding/%.c
	@mkdir -p $(OBJDIR)
	$(CC) -I$(SDL2)/include/SDL2 -D_THREAD_SAFE -I$(QUICKJS_INCLUDE) -c -o $@ $<

$(JS_ENTRYPOINT): src/entrypoint.js
	@mkdir -p $(GENERATED)
	qjsc -c -m -M sdl.so,sdl -o $@ src/entrypoint.js
