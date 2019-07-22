DIST = dist
OBJDIR = .obj
GENERATED = src/generated
NATIVE_SOURCES = $(wildcard src/native/*.c)
OBJECTS = $(patsubst src/native/%.c, $(OBJDIR)/%.o, $(NATIVE_SOURCES))
BIN = $(DIST)/app

.PHONY: all
all: $(GENERATED)/js-entrypoint.c $(BIN)

.PHONY: clean
clean:
	-@$(RM) -rf $(DIST) $(OBJDIR) $(GENERATED)

$(GENERATED)/js-entrypoint.c:
	mkdir -p $(GENERATED)
	qjsc -c -m -o $@ src/entrypoint.js

$(BIN): $(OBJECTS)
	mkdir -p $(DIST)
	$(CC) `sdl2-config --libs` -L/usr/local/lib/quickjs -lquickjs -o $@ $^

$(OBJDIR)/%.o: src/native/%.c
	@mkdir -p $(OBJDIR)
	$(CC) `sdl2-config --cflags` -I/usr/local/include/quickjs -c -o $@ $<
