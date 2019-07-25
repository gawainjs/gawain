import {
    SDL_INIT_VIDEO,
    SDL_WINDOWPOS_UNDEFINED,
    SDL_WINDOW_OPENGL,
    SDL_Init,
    SDL_Quit,
    SDL_CreateWindow,
    SDL_DestroyWindow,
} from 'sdl.so';

console.log('hello, world!');
SDL_Init(SDL_INIT_VIDEO);
const windowId = SDL_CreateWindow(
    "Hello",
    SDL_WINDOWPOS_UNDEFINED,
    SDL_WINDOWPOS_UNDEFINED,
    640,
    480,
    SDL_WINDOW_OPENGL
);

console.log('windowId:', windowId);
SDL_DestroyWindow(windowId);
try {
    SDL_DestroyWindow(123);
} catch (e) {
    console.log(e);
}
SDL_Quit();
