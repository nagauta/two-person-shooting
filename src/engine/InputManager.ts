import { MovementInput, RotationInput } from '../types';

export class InputManager {
    private keys: { [key: string]: boolean } = {};
    private canvas: HTMLCanvasElement;
    private isPointerLocked: boolean = false;
    
    public onMove: ((movement: MovementInput) => void) | null = null;
    public onLook: ((rotation: RotationInput) => void) | null = null;
    public onShoot: (() => void) | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        // キーボードイベント
        document.addEventListener('keydown', (event) => {
            this.keys[event.key.toLowerCase()] = true;
            this.updateMovement();
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.key.toLowerCase()] = false;
            this.updateMovement();
        });

        // マウスイベント
        document.addEventListener('mousemove', (event) => {
            if (this.isPointerLocked && this.onLook) {
                this.onLook({
                    deltaX: event.movementX,
                    deltaY: event.movementY
                });
            }
        });

        document.addEventListener('mousedown', (event) => {
            if (event.button === 0 && this.onShoot) { // 左クリック
                this.onShoot();
            }
        });

        // ポインターロック関連
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
        });

        // コンテキストメニューを無効化
        this.canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        // フォーカス時にポインターロック
        this.canvas.addEventListener('click', () => {
            this.canvas.requestPointerLock();
        });
    }

    private updateMovement(): void {
        if (!this.onMove) return;

        const movement: MovementInput = {
            forward: this.keys['w'] || false,
            backward: this.keys['s'] || false,
            left: this.keys['a'] || false,
            right: this.keys['d'] || false,
            jump: this.keys[' '] || false, // スペースキー
            crouch: this.keys['shift'] || false
        };

        this.onMove(movement);
    }

    public isKeyPressed(key: string): boolean {
        return this.keys[key.toLowerCase()] || false;
    }

    public getPointerLockStatus(): boolean {
        return this.isPointerLocked;
    }

    public destroy(): void {
        // イベントリスナーの削除（必要に応じて）
        // 実際のプロジェクトではメモリリークを防ぐために実装する
    }
} 