import * as sdl from 'sdl.so';

console.log('hello, world!');

sdl.SDL_Init(sdl.SDL_INIT_VIDEO);
const windowId = sdl.SDL_CreateWindow(
    "Hello",
    sdl.SDL_WINDOWPOS_UNDEFINED,
    sdl.SDL_WINDOWPOS_UNDEFINED,
    640,
    480,
    sdl.SDL_WINDOW_OPENGL
);
const renderer = sdl.SDL_CreateRenderer(windowId, -1, sdl.SDL_RENDERER_ACCELERATED);
console.log('windowId:', windowId);

eventloop: while (1) {
    /** @type {sdl.Ref<sdl.SDL_Event>} */
    let event = { current: undefined };
    while (sdl.SDL_PollEvent(event)) {
        switch (event.current.type) {
            case sdl.SDL_QUIT:
                break eventloop;
        }
    }
}

sdl.SDL_DestroyRenderer(renderer);
sdl.SDL_DestroyWindow(windowId);
sdl.SDL_Quit();
