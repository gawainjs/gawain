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
        tmp = malloc(MAX_PATH * sizeof(WCHAR));
        GetModuleFileNameW(NULL, (WCHAR*) tmp, MAX_PATH);
    #endif
    return tmp;
}

#ifdef __MINGW64__
int gawain_parse_exe_overlay(FILE *fp, DWORD *overlay_offset) {
    fseek(fp, 0L, SEEK_SET);
    char exe_header[4096];
    fread(&exe_header, sizeof(exe_header), 1, fp);
    IMAGE_DOS_HEADER *dos_header = (IMAGE_DOS_HEADER*) exe_header;
    IMAGE_NT_HEADERS *pe_header = (IMAGE_NT_HEADERS*) ((BYTE*) dos_header + dos_header->e_lfanew);
    IMAGE_SECTION_HEADER *section_table = (IMAGE_SECTION_HEADER*) ((BYTE*) pe_header + sizeof(IMAGE_NT_HEADERS));
    DWORD max_pointer = 0, real_exe_size = 0;
    for (int i = 0; i < pe_header->FileHeader.NumberOfSections; ++i, ++section_table) {
        if (section_table->PointerToRawData <= max_pointer) continue;
        max_pointer = section_table->PointerToRawData;
        real_exe_size = section_table->PointerToRawData + section_table->SizeOfRawData;
    }
    *overlay_offset = real_exe_size;
    return 0;
}
int gawain_read_exe_overlay(FILE *fp, DWORD overlay_offset, char **overlay, DWORD *overlay_size) {
    fseek(fp, 0L, SEEK_END);
    *overlay_size = ftell(fp) - overlay_offset;
    fseek(fp, overlay_offset, SEEK_SET);
    *overlay = malloc((size_t) *overlay_size);
    fread(*overlay, *overlay_size, 1, fp);
    return 0;
}
#endif

int gawain_init_archive(mz_zip_archive *gawain_archive) {
    int result = 1; // 1: success, 0: fail
    char *archive_path = gawain_get_archive_path();
    #if defined __MINGW64__
        FILE *fp;
        DWORD overlay_offset;
        _wfopen_s(&fp, (WCHAR*) archive_path, L"rb");
        gawain_parse_exe_overlay(fp, &overlay_offset);
        /*
        fseek(fp, overlay_offset, SEEK_SET);
        mz_zip_reader_init_cfile(gawain_archive, fp, 0, 0);
        /*/
        char *overlay;
        DWORD overlay_size;
        gawain_read_exe_overlay(fp, overlay_offset, &overlay, &overlay_size);
        fclose(fp);
        result = (int) mz_zip_reader_init_mem(gawain_archive, overlay, (size_t) overlay_size, 0);
        //*/
    #else
        result = (int) mz_zip_reader_init_file(gawain_archive, archive_path, 0);
    #endif
    free(archive_path);
    return result;
}

int main(int argc, char *argv[]) {
    mz_zip_archive gawain_archive;
    size_t entrypoint_size;
    uint8_t *entrypoint;
    memset(&gawain_archive, 0, sizeof(gawain_archive));
    mz_bool is_init_archive_success = gawain_init_archive(&gawain_archive);
    if (!is_init_archive_success) {
        printf("gawain_init_archive failed: %s\n", mz_zip_get_error_string(gawain_archive.m_last_error));
        return 1;
    }
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

    mz_free(entrypoint);
    return 0;
}
