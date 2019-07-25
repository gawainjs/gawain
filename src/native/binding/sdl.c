#include "SDL.h"
#include "quickjs.h"

#define countof(x) (sizeof(x) / sizeof((x)[0]))

static JSValue js_sdl_SDL_CreateWindow(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    SDL_Window *window;
    const char *title;
    int x, y, w, h;
    Uint32 flags;
    title = JS_ToCString(ctx, argv[0]);
    if (
        JS_ToInt32(ctx, &x, argv[1]) ||
        JS_ToInt32(ctx, &y, argv[2]) ||
        JS_ToInt32(ctx, &w, argv[3]) ||
        JS_ToInt32(ctx, &h, argv[4]) ||
        JS_ToUint32(ctx, &flags, argv[5])
    ) {
        return JS_EXCEPTION;
    }
    window = SDL_CreateWindow(title, x, y, w, h, flags);
    if (window == NULL) {
        return JS_ThrowInternalError(ctx, "%s", SDL_GetError());
    }
    Uint32 window_id = SDL_GetWindowID(window);
    JSValue js_window_id = JS_NewInt32(ctx, window_id);
    return js_window_id;
}

static JSValue js_sdl_SDL_DestroyWindow(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    Uint32 window_id;
    if (JS_ToUint32(ctx, &window_id, argv[0])) {
        return JS_EXCEPTION;
    }
    SDL_Window *window = SDL_GetWindowFromID(window_id);
    if (window == NULL) {
        return JS_ThrowInternalError(ctx, "Invalid window");
    }
    SDL_DestroyWindow(window);
    return JS_UNDEFINED;
}

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

static JSValue js_sdl_SDL_Quit(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    SDL_Quit();
    return JS_UNDEFINED;
}

static const JSCFunctionListEntry js_sdl_funcs[] = {
    JS_CFUNC_DEF("SDL_Init", 1, js_sdl_SDL_Init),
    JS_CFUNC_DEF("SDL_CreateWindow", 6, js_sdl_SDL_CreateWindow),
    JS_CFUNC_DEF("SDL_DestroyWindow", 1, js_sdl_SDL_DestroyWindow),
    JS_CFUNC_DEF("SDL_Quit", 0, js_sdl_SDL_Quit),
    JS_PROP_INT32_DEF("SDL_INIT_VIDEO", SDL_INIT_VIDEO, JS_PROP_ENUMERABLE),
    JS_PROP_INT32_DEF("SDL_WINDOWPOS_UNDEFINED", SDL_WINDOWPOS_UNDEFINED, JS_PROP_ENUMERABLE),
    JS_PROP_INT32_DEF("SDL_WINDOW_OPENGL", SDL_WINDOW_OPENGL, JS_PROP_ENUMERABLE),
};

static int js_sdl_init(JSContext *ctx, JSModuleDef *m) {
    JS_SetModuleExportList(ctx, m, js_sdl_funcs, countof(js_sdl_funcs));
    return 0;
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
