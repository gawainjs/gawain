#include <stdio.h>
#include "SDL.h"

int main(int argc, char* argv[]) {
    SDL_Window* window;
    SDL_Init(SDL_INIT_VIDEO);
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
