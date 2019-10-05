import * as sdl from 'sdl.so';

const stageWidth = 400;
const stageHeight = 600;
const playerWidth = 100;
const playerHeight = 20;
const ballSize = 20;

sdl.SDL_Init(sdl.SDL_INIT_VIDEO);
sdl.SDL_SetHint(sdl.SDL_HINT_RENDER_VSYNC, '1');
const windowId = sdl.SDL_CreateWindow(
    'Hello',
    sdl.SDL_WINDOWPOS_UNDEFINED,
    sdl.SDL_WINDOWPOS_UNDEFINED,
    stageWidth,
    stageHeight,
    sdl.SDL_WINDOW_OPENGL
);
console.log('windowId:', windowId);

const numkeys = { current: 0 };
const keyboardState = new Uint8Array(sdl.SDL_GetKeyboardState(numkeys));
console.log('numkeys:', numkeys.current);

const appState = {
    player: {
        x: (stageWidth - playerWidth) / 2,
        y: stageHeight - 50,
    },
    ball: {
        x: stageWidth / 2,
        y: stageHeight / 2,
        speed: 150, // pps
        angle: Math.PI / 2, // radian
    },
};

/**
 * @param pps {number} pixels per second
 * @param delta {number} time delta in milliseconds
 * @returns {number}
*/
function d(pps, delta) {
    return pps * delta / 1000;
}

let lastTick = sdl.SDL_GetTicks();
function update() {
    const nowTick = sdl.SDL_GetTicks();
    const timeDelta = nowTick - lastTick;
    const playerSpeed = d(500, timeDelta);
    const ballSpeed = d(appState.ball.speed, timeDelta);
    if (keyboardState[sdl.SDL_SCANCODE_LEFT]) appState.player.x -= playerSpeed;
    if (keyboardState[sdl.SDL_SCANCODE_RIGHT]) appState.player.x += playerSpeed;
    appState.ball.x += Math.cos(appState.ball.angle) * ballSpeed;
    appState.ball.y += Math.sin(appState.ball.angle) * ballSpeed;
    physics();
    lastTick = nowTick;
}
function physics() {
    const playerBox = getPlayerBox();
    const ballBox = getBallBox();
    appState.player.x = Math.max(Math.min(stageWidth - playerWidth, appState.player.x), 0);
    const dx = Math.cos(appState.ball.angle);
    const dy = Math.sin(appState.ball.angle);
    // ball & player
    if (aabb(playerBox, ballBox) && (dy > 0)) {
        appState.ball.angle = (Math.random() * (Math.PI / 2)) + (Math.PI * 5 / 4);
        appState.ball.speed += 15;
    }
    { // ball
        const { x, y, w } = ballBox;
        // left wall
        if ((x < 0) && (dx < 0)) appState.ball.angle = Math.PI - appState.ball.angle;
        // right wall
        if (((x + w) > stageWidth) && (dx > 0)) appState.ball.angle = Math.PI - appState.ball.angle;
        // top wall
        if ((y < 0) && (dy < 0)) appState.ball.angle = -appState.ball.angle;
    }
}
function getPlayerBox() {
    return {
        x: appState.player.x,
        y: appState.player.y,
        w: playerWidth,
        h: playerHeight,
    };
}
function getBallBox() {
    return {
        x: appState.ball.x,
        y: appState.ball.y,
        w: ballSize,
        h: ballSize,
    };
}

/**
 * @param {{x: number, y: number, w: number, h: number}} box1 
 * @param {{x: number, y: number, w: number, h: number}} box2 
 * @returns {boolean}
 * @example
 *          |-------|
 *      |---|---|   |
 *      |   |---|---|
 *      |-------|
 *      => true
 *          |-------|
 *          |       |
 *          |-------|
 *      |-------|
 *      |       |
 *      |-------|
 *      => false
 */
function aabb(box1, box2) {
    if (box1.x > (box2.x + box2.w)) return false;
    if ((box1.x + box1.w) < box2.x) return false;
    if (box1.y > (box2.y + box2.h)) return false;
    if ((box1.y + box1.h) < box2.y) return false;
    return true;
}

const renderer = sdl.SDL_CreateRenderer(windowId, -1, sdl.SDL_RENDERER_ACCELERATED);
function render() {
    sdl.SDL_SetRenderDrawColor(renderer, 0, 0, 0, 0xff);
    sdl.SDL_RenderClear(renderer);
    renderPlayer(appState.player.x, appState.player.y);
    renderBall(appState.ball.x, appState.ball.y);
    sdl.SDL_RenderPresent(renderer);
}

function renderPlayer(x, y) {
    sdl.SDL_SetRenderDrawColor(renderer, 0xff, 0xff, 0xff, 0xff);
    sdl.SDL_RenderFillRect(renderer, { x, y, w: playerWidth, h: playerHeight });
}

function renderBall(x, y) {
    sdl.SDL_SetRenderDrawColor(renderer, 0xab, 0xcd, 0xef, 0xff);
    sdl.SDL_RenderFillRect(renderer, { x, y, w: ballSize, h: ballSize });
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
