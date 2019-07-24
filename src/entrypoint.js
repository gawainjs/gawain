import {
    SDL_INIT_VIDEO,
    SDL_WINDOWPOS_UNDEFINED,
    SDL_WINDOW_OPENGL,
    SDL_Init,
    SDL_CreateWindow,
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
