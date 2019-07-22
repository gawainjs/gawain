declare module 'sdl.so' {
    type Brand<K, T> = K & { __brand: T }
    export type SDL_Window = Brand<symbol, 'SDL_Window'>;
    export const SDL_INIT_VIDEO: number;
    export const SDL_WINDOWPOS_UNDEFINED: number;
    export const SDL_WINDOW_OPENGL: number;
    export function SDL_Init(flags: number): void;
    export function SDL_CreateWindow(title: string, x: number, y: number, w: number, h: number, flags: number): SDL_Window;
}
