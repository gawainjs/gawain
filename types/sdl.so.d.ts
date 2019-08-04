declare module 'sdl.so' {
    export type Brand<T> = { __brand: T };
    export type SDL_Window = number;
    export type SDL_EventType = number;
    export interface SDL_Event {
        readonly type: SDL_EventType;
    }
    export type SDL_Renderer = Brand<'SDL_Renderer'>;
    export interface Ref<T> { current?: T }
    export const SDL_QUIT: number;
    export const SDL_INIT_VIDEO: number;
    export const SDL_WINDOWPOS_UNDEFINED: number;
    export const SDL_WINDOW_OPENGL: number;
    export const SDL_RENDERER_ACCELERATED: number;
    export function SDL_Init(flags: number): void;
    export function SDL_Quit(): void;
    export function SDL_CreateWindow(title: string, x: number, y: number, w: number, h: number, flags: number): SDL_Window;
    export function SDL_DestroyWindow(windowId: SDL_Window): void;
    export function SDL_PollEvent(eventRef: Ref<SDL_Event>): number;
    export function SDL_CreateRenderer(windowId: SDL_Window, index: number, flags: number): SDL_Renderer;
    export function SDL_DestroyRenderer(renderer: SDL_Renderer): number;
    export function SDL_SetRenderDrawColor(renderer: SDL_Renderer, r: number, g: number, b: number, a: number): number;
    export function SDL_RenderClear(renderer: SDL_Renderer): number;
    export function SDL_RenderPresent(renderer: SDL_Renderer): void;
}
