#include "SDL.h"
#include "quickjs.h"

#define countof(x) (sizeof(x) / sizeof((x)[0]))

// event start
static JSClassID js_sdl_event_class_id;
typedef struct {
    SDL_Event *event;
} JSSDLEvent;
static void js_sdl_event_finalizer(JSRuntime *rt, JSValue val) {
    JSSDLEvent *sdl_event = JS_GetOpaque(val, js_sdl_event_class_id);
    free(sdl_event->event);
    if (sdl_event) js_free_rt(rt, sdl_event);
}
static JSClassDef js_sdl_event_class = {
    "SDL_Event",
    .finalizer = js_sdl_event_finalizer,
};
static SDL_Event *js_sdl_event_get(JSContext *ctx, JSValueConst obj) {
    JSSDLEvent *js_sdl_event = JS_GetOpaque2(ctx, obj, js_sdl_event_class_id);
    if (!js_sdl_event) return NULL;
    if (!js_sdl_event->event) {
        JS_ThrowInternalError(ctx, "Invalid event");
        return NULL;
    }
    return js_sdl_event->event;
}
static JSValue js_new_sdl_event(JSContext *ctx, SDL_Event *event) {
    JSValue js_event = JS_NewObjectClass(ctx, js_sdl_event_class_id);
    if (JS_IsException(js_event)) return js_event;
    JSSDLEvent *js_sdl_event = js_mallocz(ctx, sizeof(*js_sdl_event));
    if (!js_sdl_event) {
        JS_FreeValue(ctx, js_event);
        return JS_EXCEPTION;
    }
    js_sdl_event->event = event;
    JS_SetOpaque(js_event, js_sdl_event);
    return js_event;
}
static JSValue js_sdl_event_type_getter(
    JSContext *ctx,
    JSValueConst this_val
) {
    SDL_Event *sdl_event = js_sdl_event_get(ctx, this_val);
    if (!sdl_event) return JS_EXCEPTION;
    return JS_NewInt32(ctx, sdl_event->type);
}
static const JSCFunctionListEntry js_sdl_event_proto_funcs[] = {
    JS_CGETSET_DEF("type", js_sdl_event_type_getter, NULL),
};
// event end

// renderer start
static JSClassID js_sdl_renderer_class_id;
typedef struct {
    SDL_Renderer *renderer;
} JSSDLRenderer;
static void js_sdl_renderer_finalizer(JSRuntime *rt, JSValue val) {
    JSSDLRenderer *sdl_renderer = JS_GetOpaque(val, js_sdl_renderer_class_id);
    if (sdl_renderer) js_free_rt(rt, sdl_renderer);
}
static JSClassDef js_sdl_renderer_class = {
    "SDL_Renderer",
    .finalizer = js_sdl_renderer_finalizer,
};
static SDL_Renderer *js_sdl_renderer_get(JSContext *ctx, JSValueConst obj) {
    JSSDLRenderer *js_sdl_renderer = JS_GetOpaque2(ctx, obj, js_sdl_renderer_class_id);
    if (!js_sdl_renderer) return NULL;
    if (!js_sdl_renderer->renderer) {
        JS_ThrowInternalError(ctx, "Invalid renderer");
        return NULL;
    }
    return js_sdl_renderer->renderer;
}
static JSValue js_new_sdl_renderer(JSContext *ctx, SDL_Renderer *renderer) {
    JSValue js_renderer = JS_NewObjectClass(ctx, js_sdl_renderer_class_id);
    if (JS_IsException(js_renderer)) return js_renderer;
    JSSDLRenderer *js_sdl_renderer = js_mallocz(ctx, sizeof(*js_sdl_renderer));
    if (!js_sdl_renderer) {
        JS_FreeValue(ctx, js_renderer);
        return JS_EXCEPTION;
    }
    js_sdl_renderer->renderer = renderer;
    JS_SetOpaque(js_renderer, js_sdl_renderer);
    return js_renderer;
}
// renderer end

static JSValue js_sdl_SDL_SetHint(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    const char *name = JS_ToCString(ctx, argv[0]);
    const char *value = JS_ToCString(ctx, argv[1]);
    SDL_bool hint_was_set = SDL_SetHint(name, value);
    return JS_NewBool(ctx, (int) hint_was_set);
}

static JSValue js_sdl_SDL_Init(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    Uint32 flags;
    int res;
    if (JS_ToUint32(ctx, &flags, argv[0])) return JS_EXCEPTION;
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

static JSValue js_sdl_SDL_PollEvent(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    SDL_Event* event = malloc(sizeof(*event));
    int has_pending_events = SDL_PollEvent(event);
    JS_SetPropertyStr(ctx, argv[0], "current", js_new_sdl_event(ctx, event));
    return JS_NewInt32(ctx, has_pending_events);
}

static JSValue js_sdl_SDL_GetKeyboardState(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    int numkeys;
    const Uint8* sdl_keyboard_state = SDL_GetKeyboardState(&numkeys);
    if (!JS_IsUndefined(argv[0])) JS_SetPropertyStr(ctx, argv[0], "current", JS_NewInt32(ctx, numkeys));
    return JS_NewArrayBuffer(ctx, (uint8_t *) sdl_keyboard_state, (size_t) numkeys, NULL, NULL, 1);
}

static JSValue js_sdl_SDL_CreateRenderer(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    int index;
    Uint32 window_id, flags;
    if (
        JS_ToUint32(ctx, &window_id, argv[0]) ||
        JS_ToInt32(ctx, &index, argv[1]) ||
        JS_ToUint32(ctx, &flags, argv[2])
    ) {
        return JS_EXCEPTION;
    }
    SDL_Window *window = SDL_GetWindowFromID(window_id);
    SDL_Renderer* renderer = SDL_CreateRenderer(window, index, flags);
    return js_new_sdl_renderer(ctx, renderer);
}

static JSValue js_sdl_SDL_DestroyRenderer(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    SDL_Renderer *sdl_renderer = js_sdl_renderer_get(ctx, argv[0]);
    if (!sdl_renderer) return JS_EXCEPTION;
    SDL_DestroyRenderer(sdl_renderer);
    return JS_UNDEFINED;
}

static JSValue js_sdl_SDL_SetRenderDrawColor(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    SDL_Renderer *sdl_renderer = js_sdl_renderer_get(ctx, argv[0]);
    if (!sdl_renderer) return JS_EXCEPTION;
    Uint32 r, g, b, a;
    if (
        JS_ToUint32(ctx, &r, argv[1]) ||
        JS_ToUint32(ctx, &g, argv[2]) ||
        JS_ToUint32(ctx, &b, argv[3]) ||
        JS_ToUint32(ctx, &a, argv[4])
    ) {
        return JS_EXCEPTION;
    }
    int result = SDL_SetRenderDrawColor(sdl_renderer, (Uint8) r, (Uint8) g, (Uint8) b, (Uint8) a);
    return JS_NewInt32(ctx, result);
}

static JSValue js_sdl_SDL_RenderClear(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    SDL_Renderer *sdl_renderer = js_sdl_renderer_get(ctx, argv[0]);
    if (!sdl_renderer) return JS_EXCEPTION;
    int result = SDL_RenderClear(sdl_renderer);
    return JS_NewInt32(ctx, result);
}
static JSValue js_sdl_SDL_RenderPresent(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    SDL_Renderer *sdl_renderer = js_sdl_renderer_get(ctx, argv[0]);
    if (!sdl_renderer) return JS_EXCEPTION;
    SDL_RenderPresent(sdl_renderer);
    return JS_UNDEFINED;
}

static JSValue js_sdl_SDL_RenderDrawPoint(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    SDL_Renderer *sdl_renderer = js_sdl_renderer_get(ctx, argv[0]);
    if (!sdl_renderer) return JS_EXCEPTION;
    int x, y;
    if (
        JS_ToInt32(ctx, &x, argv[1]) ||
        JS_ToInt32(ctx, &y, argv[2])
    ) {
        return JS_EXCEPTION;
    }
    int result = SDL_RenderDrawPoint(sdl_renderer, x, y);
    return JS_NewInt32(ctx, result);
}

static JSValue js_sdl_SDL_RenderDrawLine(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    SDL_Renderer *sdl_renderer = js_sdl_renderer_get(ctx, argv[0]);
    if (!sdl_renderer) return JS_EXCEPTION;
    int x1, y1, x2, y2;
    if (
        JS_ToInt32(ctx, &x1, argv[1]) ||
        JS_ToInt32(ctx, &y1, argv[2]) ||
        JS_ToInt32(ctx, &x2, argv[3]) ||
        JS_ToInt32(ctx, &y2, argv[4])
    ) {
        return JS_EXCEPTION;
    }
    int result = SDL_RenderDrawLine(sdl_renderer, x1, y1, x2, y2);
    return JS_NewInt32(ctx, result);
}

static JSValue js_sdl_SDL_RenderDrawRect(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    SDL_Renderer *sdl_renderer = js_sdl_renderer_get(ctx, argv[0]);
    if (!sdl_renderer) return JS_EXCEPTION;
    int x, y, w, h;
    if (
        JS_ToInt32(ctx, &x, JS_GetPropertyStr(ctx, argv[1], "x")) ||
        JS_ToInt32(ctx, &y, JS_GetPropertyStr(ctx, argv[1], "y")) ||
        JS_ToInt32(ctx, &w, JS_GetPropertyStr(ctx, argv[1], "w")) ||
        JS_ToInt32(ctx, &h, JS_GetPropertyStr(ctx, argv[1], "h"))
    ) {
        return JS_EXCEPTION;
    }
    SDL_Rect sdl_rect = { .x = x, .y = y, .w = w, .h = h };
    int result = SDL_RenderDrawRect(sdl_renderer, &sdl_rect);
    return JS_NewInt32(ctx, result);
}

static JSValue js_sdl_SDL_RenderFillRect(
    JSContext *ctx,
    JSValueConst this_val,
    int argc,
    JSValueConst *argv
) {
    SDL_Renderer *sdl_renderer = js_sdl_renderer_get(ctx, argv[0]);
    if (!sdl_renderer) return JS_EXCEPTION;
    int x, y, w, h;
    if (
        JS_ToInt32(ctx, &x, JS_GetPropertyStr(ctx, argv[1], "x")) ||
        JS_ToInt32(ctx, &y, JS_GetPropertyStr(ctx, argv[1], "y")) ||
        JS_ToInt32(ctx, &w, JS_GetPropertyStr(ctx, argv[1], "w")) ||
        JS_ToInt32(ctx, &h, JS_GetPropertyStr(ctx, argv[1], "h"))
    ) {
        return JS_EXCEPTION;
    }
    SDL_Rect sdl_rect = { .x = x, .y = y, .w = w, .h = h };
    int result = SDL_RenderFillRect(sdl_renderer, &sdl_rect);
    return JS_NewInt32(ctx, result);
}

static const JSCFunctionListEntry js_sdl_funcs[] = {
    JS_CFUNC_DEF("SDL_SetHint", 2, js_sdl_SDL_SetHint),
    JS_CFUNC_DEF("SDL_Init", 1, js_sdl_SDL_Init),
    JS_CFUNC_DEF("SDL_Quit", 0, js_sdl_SDL_Quit),
    JS_CFUNC_DEF("SDL_CreateWindow", 6, js_sdl_SDL_CreateWindow),
    JS_CFUNC_DEF("SDL_DestroyWindow", 1, js_sdl_SDL_DestroyWindow),
    JS_CFUNC_DEF("SDL_PollEvent", 1, js_sdl_SDL_PollEvent),
    JS_CFUNC_DEF("SDL_GetKeyboardState", 1, js_sdl_SDL_GetKeyboardState),
    JS_CFUNC_DEF("SDL_CreateRenderer", 3, js_sdl_SDL_CreateRenderer),
    JS_CFUNC_DEF("SDL_DestroyRenderer", 1, js_sdl_SDL_DestroyRenderer),
    JS_CFUNC_DEF("SDL_SetRenderDrawColor", 5, js_sdl_SDL_SetRenderDrawColor),
    JS_CFUNC_DEF("SDL_RenderClear", 1, js_sdl_SDL_RenderClear),
    JS_CFUNC_DEF("SDL_RenderPresent", 1, js_sdl_SDL_RenderPresent),
    JS_CFUNC_DEF("SDL_RenderDrawPoint", 3, js_sdl_SDL_RenderDrawPoint),
    JS_CFUNC_DEF("SDL_RenderDrawLine", 5, js_sdl_SDL_RenderDrawLine),
    JS_CFUNC_DEF("SDL_RenderDrawRect", 2, js_sdl_SDL_RenderDrawRect),
    JS_CFUNC_DEF("SDL_RenderFillRect", 2, js_sdl_SDL_RenderFillRect),
    JS_PROP_STRING_DEF("SDL_HINT_RENDER_VSYNC", SDL_HINT_RENDER_VSYNC, JS_PROP_ENUMERABLE),
    JS_PROP_INT32_DEF("SDL_QUIT", SDL_QUIT, JS_PROP_ENUMERABLE),
    JS_PROP_INT32_DEF("SDL_INIT_VIDEO", SDL_INIT_VIDEO, JS_PROP_ENUMERABLE),
    JS_PROP_INT32_DEF("SDL_WINDOWPOS_UNDEFINED", SDL_WINDOWPOS_UNDEFINED, JS_PROP_ENUMERABLE),
    JS_PROP_INT32_DEF("SDL_WINDOW_OPENGL", SDL_WINDOW_OPENGL, JS_PROP_ENUMERABLE),
    JS_PROP_INT32_DEF("SDL_RENDERER_ACCELERATED", SDL_RENDERER_ACCELERATED, JS_PROP_ENUMERABLE),
    JS_PROP_INT32_DEF("SDL_NUM_SCANCODES", SDL_NUM_SCANCODES, JS_PROP_ENUMERABLE),
    JS_PROP_INT32_DEF("SDL_SCANCODE_UP", SDL_SCANCODE_UP, JS_PROP_ENUMERABLE),
    JS_PROP_INT32_DEF("SDL_SCANCODE_DOWN", SDL_SCANCODE_DOWN, JS_PROP_ENUMERABLE),
    JS_PROP_INT32_DEF("SDL_SCANCODE_LEFT", SDL_SCANCODE_LEFT, JS_PROP_ENUMERABLE),
    JS_PROP_INT32_DEF("SDL_SCANCODE_RIGHT", SDL_SCANCODE_RIGHT, JS_PROP_ENUMERABLE),
};

static int js_sdl_init(JSContext *ctx, JSModuleDef *m) {
    { // event
        JS_NewClassID(&js_sdl_event_class_id);
        JS_NewClass(JS_GetRuntime(ctx), js_sdl_event_class_id, &js_sdl_event_class);
        JSValue proto = JS_NewObject(ctx);
        JS_SetPropertyFunctionList(ctx, proto, js_sdl_event_proto_funcs, countof(js_sdl_event_proto_funcs));
        JS_SetClassProto(ctx, js_sdl_event_class_id, proto);
    }
    { // renderer
        JS_NewClassID(&js_sdl_renderer_class_id);
        JS_NewClass(JS_GetRuntime(ctx), js_sdl_renderer_class_id, &js_sdl_renderer_class);
    }
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
