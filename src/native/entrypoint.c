#include <stdio.h>
#include "SDL.h"
#include "quickjs-libc.h"

#include "../generated/js-entrypoint.c"

int main(int argc, char* argv[]) {
    JSRuntime *rt;
    JSContext *ctx;
    rt = JS_NewRuntime();
    ctx = JS_NewContextRaw(rt);
    JS_AddIntrinsicBaseObjects(ctx);
    js_std_add_helpers(ctx, argc, argv);
    {
        extern JSModuleDef *js_init_module_sdl(JSContext *ctx, const char *name);
        js_init_module_sdl(ctx, "sdl.so");
    }
    js_std_eval_binary(ctx, entrypoint, entrypoint_size, 0);
    JS_FreeContext(ctx);
    JS_FreeRuntime(rt);

    SDL_Window* window;
    // SDL_Init(SDL_INIT_VIDEO);
    window = SDL_CreateWindow(
        "Hello",
        SDL_WINDOWPOS_UNDEFINED,
        SDL_WINDOWPOS_UNDEFINED,
        640,
        480,
        SDL_WINDOW_OPENGL
    );
    if (window == NULL) {
        printf("Could not create window: %s\n", SDL_GetError());
        return 1;
    }
    while (1) {
        SDL_Event event;
        while (SDL_PollEvent(&event)) {
            switch (event.type) {
                case SDL_QUIT:
                    goto quit;
            }
        }
    }
quit:
    SDL_DestroyWindow(window);
    SDL_Quit();
    return 0;
}
