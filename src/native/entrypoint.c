#include <stdlib.h>
#include <stdio.h>
#if defined __APPLE__ && defined __MACH__
    #define PATH_MAX 4096
    #include <mach-o/dyld.h>
#endif
#include "miniz.h"
#include "quickjs-libc.h"

char* get_gawain_archive_path() {
    char *tmp = malloc(PATH_MAX);
    #if defined GAWAIN_DEV
        strcpy(tmp, "tmp/test.zip");
    #elif defined __APPLE__ && defined __MACH__
        uint32_t size = PATH_MAX;
        _NSGetExecutablePath(tmp, &size);
        strcat(tmp, "/../../Resources/archive.zip");
        char *tmp2 = realpath(tmp, NULL);
        free(tmp);
        tmp = tmp2;
    #endif
    return tmp;
}

int main(int argc, char* argv[]) {
    char *gawain_archive_path = get_gawain_archive_path();

    mz_zip_archive gawain_archive;
    size_t entrypoint_size;
    uint8_t *entrypoint;
    memset(&gawain_archive, 0, sizeof(gawain_archive));
    mz_zip_reader_init_file(&gawain_archive, gawain_archive_path, 0);
    entrypoint = mz_zip_reader_extract_file_to_heap(&gawain_archive, "entrypoint", &entrypoint_size, 0);
    mz_zip_reader_end(&gawain_archive);

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

    free(gawain_archive_path);
    mz_free(entrypoint);
    return 0;
}
