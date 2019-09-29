#include <stdlib.h>
#include <stdio.h>
#ifndef PATH_MAX
    #define PATH_MAX 4096
#endif
#if defined __APPLE__ && defined __MACH__
    #include <mach-o/dyld.h>
#elif defined __MINGW64__
    #include <windows.h>
    #include "libloaderapi.h"
#endif
#include "miniz.h"
#include "quickjs-libc.h"

char *gawain_get_archive_path() {
    char *tmp;
    #if defined GAWAIN_DEV
        tmp = malloc(PATH_MAX);
        strcpy(tmp, "tmp/test.zip");
    #elif defined __APPLE__ && defined __MACH__
        tmp = malloc(PATH_MAX);
        uint32_t size = PATH_MAX;
        _NSGetExecutablePath(tmp, &size);
        strcat(tmp, "/../../Resources/archive.zip");
        char *tmp2 = realpath(tmp, NULL);
        free(tmp);
        tmp = tmp2;
    #elif defined __MINGW64__
        WCHAR path[MAX_PATH];
        GetModuleFileNameW(NULL, path, MAX_PATH);
        tmp = (char*) path;
    #endif
    return tmp;
}

#ifdef __MINGW64__
int gawain_parse_exe_overlay(WCHAR *exe_path, size_t *overlay_offset, size_t *overlay_size) {
    FILE *fp;
    int err = _wfopen_s(&fp, exe_path, L"r");
    if (err) return err;
    fseek(fp, 0L, SEEK_END);
    long exe_size = ftell(fp);
    fseek(fp, 0L, SEEK_SET);
    char exe_header[4096];
    fread(&exe_header, sizeof(exe_header), 1, fp);
    fclose(fp);
    IMAGE_DOS_HEADER *dos_header = (IMAGE_DOS_HEADER*) exe_header;
    IMAGE_NT_HEADERS *pe_header = (IMAGE_NT_HEADERS*) ((BYTE*) dos_header - 1 + dos_header->e_lfanew);
    IMAGE_SECTION_HEADER *section_table = (IMAGE_SECTION_HEADER*) ((BYTE*) pe_header + sizeof(IMAGE_NT_HEADERS));
    DWORD max_pointer = 0, real_exe_size = 0;
    for (int i = 0; i < pe_header->FileHeader.NumberOfSections; ++i, ++section_table) {
        if (section_table->PointerToRawData <= max_pointer) continue;
        max_pointer = section_table->PointerToRawData;
        real_exe_size = section_table->PointerToRawData + section_table->SizeOfRawData;
    }
    *overlay_offset = (size_t) real_exe_size;
    *overlay_size = (size_t) (exe_size - real_exe_size);
    return 0;
}
#endif

int gawain_init_archive(mz_zip_archive *gawain_archive) {
    char *archive_path = gawain_get_archive_path();
    #if defined __MINGW64__
        size_t overlay_offset, overlay_size;
        gawain_parse_exe_overlay((WCHAR*) archive_path, &overlay_offset, &overlay_size);
        printf("overlay offset: %i\n", overlay_offset);
        printf("overlay size: %i\n", overlay_size);
        mz_zip_reader_init_file_v2(
            gawain_archive,
            archive_path,
            0,
            (mz_uint64) overlay_offset,
            (mz_uint64) overlay_size
        );
    #else
        mz_zip_reader_init_file(gawain_archive, archive_path, 0);
    #endif
    free(archive_path);
    return 0;
}

int main(int argc, char *argv[]) {
    mz_zip_archive gawain_archive;
    size_t entrypoint_size;
    uint8_t *entrypoint;
    memset(&gawain_archive, 0, sizeof(gawain_archive));
    gawain_init_archive(&gawain_archive);
    entrypoint = mz_zip_reader_extract_file_to_heap(&gawain_archive, "entrypoint", &entrypoint_size, 0);
    printf("entrypoint size: %i\n", (int) entrypoint_size);
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

    mz_free(entrypoint);
    return 0;
}
