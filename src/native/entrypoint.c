#include <stdio.h>
#if defined __APPLE__ && defined __MACH__
    #include <SDL2/SDL.h>
#else
    #include "SDL.h"
#endif
#include "quickjs-libc.h"

#include "../generated/js-entrypoint.c"

int main(int argc, char* argv[]) {
    JSRuntime *rt;
    JSContext *ctx;
    rt = JS_NewRuntime();
    ctx = JS_NewContextRaw(rt);
    JS_AddIntrinsicBaseObjects(ctx);
    JS_AddIntrinsicTypedArrays(ctx);
    js_std_add_helpers(ctx, argc, argv);
    {
        extern JSModuleDef *js_init_module_sdl(JSContext *ctx, const char *name);
        js_init_module_sdl(ctx, "sdl.so");
    }
    js_std_eval_binary(ctx, entrypoint, entrypoint_size, 0);
    JS_FreeContext(ctx);
    JS_FreeRuntime(rt);
    return 0;
}
