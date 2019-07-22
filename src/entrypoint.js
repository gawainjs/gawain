import { SDL_Init } from 'sdl.so';

const SDL_INIT_VIDEO = 0x00000020;
SDL_Init(SDL_INIT_VIDEO);

console.log('hello, world!');
