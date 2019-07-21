DIST = dist
OBJDIR = .obj
GENERATED = src/generated
BIN = $(DIST)/hello

.PHONY: all
all: $(GENERATED)/js-entrypoint.c $(BIN)

.PHONY: clean
clean:
	-@$(RM) -rf $(DIST) $(OBJDIR) $(GENERATED)

$(GENERATED)/js-entrypoint.c:
	mkdir -p $(GENERATED)
	qjsc -c -o $@ src/entrypoint.js

$(BIN): $(OBJDIR)/entrypoint.o
	mkdir -p $(DIST)
	$(CC) `sdl2-config --libs` -L/usr/local/lib/quickjs -lquickjs -o $@ $^

$(OBJDIR)/%.o: src/%.c
	@mkdir -p $(OBJDIR)
	$(CC) `sdl2-config --cflags` -I/usr/local/include/quickjs -c -o $@ $<
