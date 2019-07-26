declare module 'sdl.so' {
    export type SDL_Window = number;
    export type SDL_EventType = number;
    export interface SDL_Event {
        readonly type: SDL_EventType;
    }
    export interface Ref<T> { current?: T }
    export const SDL_QUIT: number;
    export const SDL_INIT_VIDEO: number;
    export const SDL_WINDOWPOS_UNDEFINED: number;
    export const SDL_WINDOW_OPENGL: number;
    export function SDL_Init(flags: number): void;
    export function SDL_Quit(): void;
    export function SDL_CreateWindow(title: string, x: number, y: number, w: number, h: number, flags: number): SDL_Window;
    export function SDL_DestroyWindow(windowId: SDL_Window): void;
    export function SDL_PollEvent(eventRef: Ref<SDL_Event>): number;
}
