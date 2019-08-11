declare module 'sdl.so' {
    export type Brand<T> = { __brand: T };
    export type SDL_Window = number;
    export type SDL_EventType = number;
    export interface SDL_Event {
        readonly type: SDL_EventType;
    }
    export interface SDL_Rect { x: number; y: number; w: number; h: number; }
    export type SDL_Renderer = Brand<'SDL_Renderer'>;
    export interface Ref<T> { current?: T }
    export const SDL_HINT_RENDER_VSYNC: string;
    export const SDL_QUIT: number;
    export const SDL_INIT_VIDEO: number;
    export const SDL_WINDOWPOS_UNDEFINED: number;
    export const SDL_WINDOW_OPENGL: number;
    export const SDL_RENDERER_ACCELERATED: number;
    export const SDL_NUM_SCANCODES: number;
    export const SDL_SCANCODE_UP: number;
    export const SDL_SCANCODE_DOWN: number;
    export const SDL_SCANCODE_LEFT: number;
    export const SDL_SCANCODE_RIGHT: number;
    export function SDL_SetHint(name: string, value: string): void;
    export function SDL_Init(flags: number): void;
    export function SDL_Quit(): void;
    export function SDL_CreateWindow(title: string, x: number, y: number, w: number, h: number, flags: number): SDL_Window;
    export function SDL_DestroyWindow(windowId: SDL_Window): void;
    export function SDL_GetTicks(): number;
    export function SDL_PollEvent(eventRef: Ref<SDL_Event>): number;
    export function SDL_GetKeyboardState(numkeysRef?: Ref<number>): ArrayBuffer;
    export function SDL_CreateRenderer(windowId: SDL_Window, index: number, flags: number): SDL_Renderer;
    export function SDL_DestroyRenderer(renderer: SDL_Renderer): number;
    export function SDL_SetRenderDrawColor(renderer: SDL_Renderer, r: number, g: number, b: number, a: number): number;
    export function SDL_RenderClear(renderer: SDL_Renderer): number;
    export function SDL_RenderPresent(renderer: SDL_Renderer): void;
    export function SDL_RenderDrawPoint(renderer: SDL_Renderer, x: number, y: number): number;
    export function SDL_RenderDrawLine(renderer: SDL_Renderer, x1: number, y1: number, x2: number, y2: number): number;
    export function SDL_RenderDrawRect(renderer: SDL_Renderer, rect: SDL_Rect): number;
    export function SDL_RenderFillRect(renderer: SDL_Renderer, rect: SDL_Rect): number;
}
