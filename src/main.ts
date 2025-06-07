import * as THREE from 'three';
import { GameEngine } from './engine/GameEngine';
import { InputManager } from './engine/InputManager';
import { Player } from './entities/Player';
import { OpponentViewManager } from './engine/OpponentViewManager';
import { Minimap } from './ui/Minimap';
import { WebRTCManager, GameMessage } from './network/WebRTCManager';
import { RoomManager } from './ui/RoomManager';

class Game {
    private engine: GameEngine;
    private inputManager: InputManager;
    private player: Player;
    private opponent: Player;
    private opponentViewManager: OpponentViewManager;
    private minimap: Minimap;
    private canvas: HTMLCanvasElement;
    private isRunning: boolean = false;

    constructor() {
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
        this.setupCanvas();
        this.initializeGame();
    }

    private setupCanvas(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.engine?.onResize(window.innerWidth, window.innerHeight);
            this.minimap?.resize();
        });
    }

    private initializeGame(): void {
        this.engine = new GameEngine(this.canvas);
        this.inputManager = new InputManager(this.canvas);
        
        // プレイヤーと対戦相手を作成
        this.player = new Player(new THREE.Vector3(0, 0, 5), 'player');
        this.opponent = new Player(new THREE.Vector3(0, 0, -5), 'opponent');
        
        // 対戦相手視点管理クラス
        this.opponentViewManager = new OpponentViewManager(this.engine, this.player, this.opponent);
        
        // ミニマップ初期化
        this.minimap = new Minimap();
        
        this.setupEventHandlers();
        this.start();
    }

    private setupEventHandlers(): void {
        // 入力イベントの設定
        this.inputManager.onMove = (movement) => {
            this.player.handleMovement(movement);
        };
        
        this.inputManager.onLook = (rotation) => {
            this.player.handleRotation(rotation);
        };
        
        this.inputManager.onShoot = () => {
            this.player.shoot();
        };
        
        // ポーズ機能
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.isRunning ? this.pause() : this.resume();
            }
        });
    }

    private start(): void {
        this.isRunning = true;
        this.gameLoop();
        console.log('ゲーム開始: 対戦相手の視点でプレイ開始');
    }

    private pause(): void {
        this.isRunning = false;
        console.log('ゲーム一時停止');
    }

    private resume(): void {
        this.isRunning = true;
        this.gameLoop();
        console.log('ゲーム再開');
    }

    private gameLoop(): void {
        if (!this.isRunning) return;

        // ゲーム状態の更新
        this.player.update();
        this.opponent.update();
        
        // 対戦相手の視点からレンダリング
        this.opponentViewManager.render();
        
        // ミニマップ更新
        this.minimap.render(this.player, this.opponent);
        
        // UI更新
        this.updateUI();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    private updateUI(): void {
        const scoreElement = document.getElementById('score');
        const healthElement = document.getElementById('health');
        
        if (scoreElement) {
            scoreElement.textContent = `スコア: ${this.player.getScore()}`;
        }
        
        if (healthElement) {
            healthElement.textContent = `体力: ${this.player.getHealth()}`;
        }
    }
}

// ゲーム開始
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});

// ポインターロック API の設定
document.addEventListener('click', () => {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    canvas.requestPointerLock();
}); 