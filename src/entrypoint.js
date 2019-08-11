import * as sdl from 'sdl.so';

console.log('hello, world!');

sdl.SDL_Init(sdl.SDL_INIT_VIDEO);
sdl.SDL_SetHint(sdl.SDL_HINT_RENDER_VSYNC, '1');
const windowId = sdl.SDL_CreateWindow(
    'Hello',
    sdl.SDL_WINDOWPOS_UNDEFINED,
    sdl.SDL_WINDOWPOS_UNDEFINED,
    640,
    480,
    sdl.SDL_WINDOW_OPENGL
);
console.log('windowId:', windowId);

const numkeys = { current: 0 };
const keyboardState = new Uint8Array(sdl.SDL_GetKeyboardState(numkeys));
console.log('numkeys:', numkeys.current);

const appState = {
    x: 0,
    y: 0,
};

function update() {
    if (keyboardState[sdl.SDL_SCANCODE_UP]) --appState.y;
    if (keyboardState[sdl.SDL_SCANCODE_DOWN]) ++appState.y;
    if (keyboardState[sdl.SDL_SCANCODE_LEFT]) --appState.x;
    if (keyboardState[sdl.SDL_SCANCODE_RIGHT]) ++appState.x;
}

const renderer = sdl.SDL_CreateRenderer(windowId, -1, sdl.SDL_RENDERER_ACCELERATED);
function render() {
    sdl.SDL_SetRenderDrawColor(renderer, 0xAB, 0xCD, 0xEF, 0xff);
    sdl.SDL_RenderClear(renderer);
    
    sdl.SDL_SetRenderDrawColor(renderer, 0xff, 0, 0, 0xff);
    
    sdl.SDL_RenderDrawPoint(renderer, 10, 10);
    sdl.SDL_RenderDrawPoint(renderer, 10, 20);
    sdl.SDL_RenderDrawPoint(renderer, 10, 30);
    sdl.SDL_RenderDrawPoint(renderer, 10, 40);
    sdl.SDL_RenderDrawPoint(renderer, 10, 50);
    
    sdl.SDL_SetRenderDrawColor(renderer, 0, 0xff, 0, 0xff);
    sdl.SDL_RenderDrawLine(renderer, 100, 100, 200, 200);
    sdl.SDL_SetRenderDrawColor(renderer, 0, 0, 0xff, 0xff);
    sdl.SDL_RenderDrawLine(renderer, 123, 123, 234, 456);
    
    sdl.SDL_SetRenderDrawColor(renderer, 0, 0xff, 0xff, 0xff);
    sdl.SDL_RenderDrawRect(renderer, { x: 300, y: 100, w: 50, h: 50 });
    sdl.SDL_SetRenderDrawColor(renderer, 0, 0, 0, 0xff);
    sdl.SDL_RenderFillRect(renderer, { x: appState.x, y: appState.y, w: 50, h: 50 });
    
    sdl.SDL_RenderPresent(renderer);
}

eventloop: while (1) {
    /** @type {sdl.Ref<sdl.SDL_Event>} */
    let event = { current: undefined };
    while (sdl.SDL_PollEvent(event)) {
        switch (event.current.type) {
            case sdl.SDL_QUIT:
                break eventloop;
        }
    }
    update();
    render();
}

sdl.SDL_DestroyRenderer(renderer);
sdl.SDL_DestroyWindow(windowId);
sdl.SDL_Quit();
