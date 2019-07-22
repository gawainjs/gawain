#include "SDL.h"
#include "quickjs.h"

#define countof(x) (sizeof(x) / sizeof((x)[0]))

static JSValue js_sdl_SDL_Init(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    Uint32 flags;
    int res;
    if (JS_ToUint32(ctx, &flags, argv[0]))
        return JS_EXCEPTION;
    res = SDL_Init(flags);
    return JS_NewInt32(ctx, res);
}

static const JSCFunctionListEntry js_sdl_funcs[] = {
    JS_CFUNC_DEF("SDL_Init", 1, js_sdl_SDL_Init),
};

static int js_sdl_init(JSContext *ctx, JSModuleDef *m) {
    return JS_SetModuleExportList(
        ctx,
        m,
        js_sdl_funcs,
        countof(js_sdl_funcs)
    );
}

#ifdef JS_SHARED_LIBRARY
#define JS_INIT_MODULE js_init_module
#else
#define JS_INIT_MODULE js_init_module_sdl
#endif

JSModuleDef *JS_INIT_MODULE(JSContext *ctx, const char *module_name)
{
    JSModuleDef *m;
    m = JS_NewCModule(ctx, module_name, js_sdl_init);
    if (!m)
        return NULL;
    JS_AddModuleExportList(ctx, m, js_sdl_funcs, countof(js_sdl_funcs));
    return m;
}
