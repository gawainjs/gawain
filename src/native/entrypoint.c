#include <stdlib.h>
#include <stdio.h>
#if defined __APPLE__ && defined __MACH__
    #define PATH_MAX 4096
    #include <mach-o/dyld.h>
    // #include <SDL2/SDL.h>
#else
    #include "SDL.h"
#endif
#include "miniz.h"
// #include "quickjs-libc.h"

// #include "../generated/js-entrypoint.c"

int main(int argc, char* argv[]) {
    char *tmp = malloc(PATH_MAX);
    uint32_t size = PATH_MAX;
    _NSGetExecutablePath(tmp, &size);
    printf("%s\n", tmp);
    printf("%i\n", size);
    free(tmp);
    { // zip test
        mz_zip_archive zip_archive;
        mz_zip_archive_file_stat file_stat;
        size_t uncomp_size;
        char *file;
        memset(&zip_archive, 0, sizeof(zip_archive));
        mz_zip_reader_init_file(&zip_archive, "tmp/test.zip", 0);
        mz_zip_reader_file_stat(&zip_archive, 0, &file_stat);
        file = mz_zip_reader_extract_file_to_heap(&zip_archive, file_stat.m_filename, &uncomp_size, 0);
        printf("%s\n", file_stat.m_filename);
        printf("%s\n", file);
        mz_free(file);
        mz_zip_reader_end(&zip_archive);
    }
    // JSRuntime *rt;
    // JSContext *ctx;
    // rt = JS_NewRuntime();
    // ctx = JS_NewContextRaw(rt);
    // JS_AddIntrinsicBaseObjects(ctx);
    // JS_AddIntrinsicTypedArrays(ctx);
    // js_std_add_helpers(ctx, argc, argv);
    // {
    //     extern JSModuleDef *js_init_module_sdl(JSContext *ctx, const char *name);
    //     js_init_module_sdl(ctx, "sdl.so");
    // }
    // js_std_eval_binary(ctx, entrypoint, entrypoint_size, 0);
    // JS_FreeContext(ctx);
    // JS_FreeRuntime(rt);
    return 0;
}
