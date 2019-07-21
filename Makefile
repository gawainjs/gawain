BIN = dist/hello
OBJDIR = .obj

.PHONY: all
all: $(BIN)

.PHONY: clean
clean:
	-@$(RM) -rf $(BIN) $(OBJDIR)

$(BIN): $(OBJDIR)/hello.o
	$(CC) `sdl2-config --libs` -o $@ $^

$(OBJDIR)/%.o: %.c
	@mkdir -p $(OBJDIR)
	$(CC) `sdl2-config --cflags` -c -o $@ $<
