import * as THREE from 'three';
import { Player } from '../entities/Player';

export class Minimap {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private mapSize: number = 200;
    private worldSize: number = 100; // ワールドの実際のサイズ
    private scale: number;

    constructor() {
        this.canvas = document.getElementById('minimapCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.scale = this.mapSize / this.worldSize;
        
        // キャンバスの解像度を設定
        this.canvas.width = this.mapSize;
        this.canvas.height = this.mapSize;
    }

    public render(player: Player, opponent: Player): void {
        // キャンバスをクリア
        this.ctx.clearRect(0, 0, this.mapSize, this.mapSize);
        
        // 背景を描画
        this.drawBackground();
        
        // 環境要素を描画
        this.drawEnvironment();
        
        // プレイヤーたちを描画
        this.drawPlayer(player, '#0066ff', true);  // プレイヤー（青色）
        this.drawPlayer(opponent, '#ff6600', false); // 対戦相手（オレンジ色）
        
        // プレイヤーが相手の視界内にいるかチェック
        this.highlightPlayerInView(player, opponent);
        
        // 視野角を描画
        this.drawFieldOfView(opponent);
        
        // 弾丸を描画
        this.drawBullets(player, opponent);
        
        // デバッグ情報を表示
        this.drawDebugInfo(player, opponent);
    }

    private drawBackground(): void {
        // 背景グリッド
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
        
        const gridSize = 10 * this.scale;
        for (let x = 0; x <= this.mapSize; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.mapSize);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.mapSize; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.mapSize, y);
            this.ctx.stroke();
        }
        
        // 外枠
        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, this.mapSize, this.mapSize);
    }

    private drawEnvironment(): void {
        // 壁を描画（簡略化）
        this.ctx.fillStyle = '#666666';
        
        // 外壁
        const wallThickness = 1 * this.scale;
        const wallOffset = 25 * this.scale; // アリーナの境界
        
        // 上の壁
        this.ctx.fillRect(wallOffset, wallOffset, this.mapSize - 2 * wallOffset, wallThickness);
        // 下の壁
        this.ctx.fillRect(wallOffset, this.mapSize - wallOffset - wallThickness, this.mapSize - 2 * wallOffset, wallThickness);
        // 左の壁
        this.ctx.fillRect(wallOffset, wallOffset, wallThickness, this.mapSize - 2 * wallOffset);
        // 右の壁
        this.ctx.fillRect(this.mapSize - wallOffset - wallThickness, wallOffset, wallThickness, this.mapSize - 2 * wallOffset);
        
        // 障害物を描画（ランダムに配置されたもののサンプル）
        this.ctx.fillStyle = '#8B4513';
        this.drawObstacle(30, 30, 6, 6);
        this.drawObstacle(60, 70, 4, 8);
        this.drawObstacle(120, 40, 8, 4);
        this.drawObstacle(150, 120, 5, 5);
        this.drawObstacle(40, 140, 7, 3);
    }

    private drawObstacle(worldX: number, worldZ: number, width: number, depth: number): void {
        const x = this.worldToMapX(worldX);
        const y = this.worldToMapY(worldZ);
        const w = width * this.scale;
        const h = depth * this.scale;
        
        this.ctx.fillRect(x - w/2, y - h/2, w, h);
    }

    private drawPlayer(player: Player, color: string, isMainPlayer: boolean): void {
        const position = player.getPosition();
        const rotation = player.getRotation();
        
        const x = this.worldToMapX(position.x);
        const y = this.worldToMapY(position.z);
        
        // プレイヤーの体を描画
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // プレイヤーの向きを示す線
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        
        const directionLength = 12;
        // Three.jsの回転をCanvas座標系に正しく変換
        const canvasAngle = -rotation.y + Math.PI / 2;
        const dirX = x + Math.cos(canvasAngle) * directionLength;
        const dirY = y + Math.sin(canvasAngle) * directionLength;
        
        this.ctx.lineTo(dirX, dirY);
        this.ctx.stroke();
        
        // プレイヤーラベル
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        
        if (isMainPlayer) {
            this.ctx.fillText('YOU', x, y - 15);
        } else {
            this.ctx.fillText('敵', x, y - 15);
        }
    }

    private drawFieldOfView(opponent: Player): void {
        const position = opponent.getPosition();
        const rotation = opponent.getRotation();
        
        const x = this.worldToMapX(position.x);
        const y = this.worldToMapY(position.z);
        
        // 視野角の扇形を描画
        this.ctx.fillStyle = 'rgba(255, 102, 0, 0.2)';
        this.ctx.strokeStyle = 'rgba(255, 102, 0, 0.5)';
        this.ctx.lineWidth = 1;
        
        const viewDistance = 50 * this.scale;
        const fov = Math.PI / 3; // 60度（OpponentViewManagerと同じ）
        
        // Three.jsの回転を2Dキャンバスの角度に変換
        // Three.js: Y軸回転（左右）、Z軸が前方（-1方向）
        // Canvas: 0度が右方向、反時計回りが正
        // 座標系の変換: Three.jsのY回転 → Canvas角度
        const canvasAngle = -rotation.y + Math.PI / 2; // 90度回転してZ軸前方向をCanvas上方向に合わせる
        
        const startAngle = canvasAngle - fov / 2;
        const endAngle = canvasAngle + fov / 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.arc(x, y, viewDistance, startAngle, endAngle);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // デバッグ: 視線方向に線を描画
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        const dirX = x + Math.cos(canvasAngle) * 20;
        const dirY = y + Math.sin(canvasAngle) * 20;
        this.ctx.lineTo(dirX, dirY);
        this.ctx.stroke();
    }

    private drawBullets(player: Player, opponent: Player): void {
        // プレイヤーの弾丸
        const playerBullets = player.getBullets();
        this.ctx.fillStyle = '#ffff00';
        
        playerBullets.forEach(bullet => {
            const x = this.worldToMapX(bullet.position.x);
            const y = this.worldToMapY(bullet.position.z);
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        
        // 対戦相手の弾丸
        const opponentBullets = opponent.getBullets();
        this.ctx.fillStyle = '#ff0000';
        
        opponentBullets.forEach(bullet => {
            const x = this.worldToMapX(bullet.position.x);
            const y = this.worldToMapY(bullet.position.z);
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }

    private worldToMapX(worldX: number): number {
        return (worldX + this.worldSize / 2) * this.scale;
    }

    private worldToMapY(worldZ: number): number {
        // Zを反転（3D空間ではZ軸が奥行きなので、マップでは上下を反転）
        return this.mapSize - (worldZ + this.worldSize / 2) * this.scale;
    }

    private highlightPlayerInView(player: Player, opponent: Player): void {
        // OpponentViewManagerと同じロジックで視界判定
        const opponentPosition = opponent.getPosition();
        const playerPosition = player.getPosition();
        const opponentRotation = opponent.getRotation();
        
        // プレイヤーまでの方向と距離
        const playerDirection = playerPosition.clone().sub(opponentPosition);
        const playerDistance = playerDirection.length();
        playerDirection.normalize();
        
        // 対戦相手の視線方向（Three.js座標系）
        const opponentForward = new THREE.Vector3(0, 0, -1);
        opponentForward.applyEuler(opponentRotation);
        
        // プレイヤーが視野角内にいるかチェック
        const angle = opponentForward.angleTo(playerDirection);
        const fieldOfView = Math.PI / 3; // 60度
        const canSeePlayer = angle < fieldOfView / 2 && playerDistance < 50;
        
        if (canSeePlayer) {
            // プレイヤーの周囲に赤い円を描画
            const x = this.worldToMapX(playerPosition.x);
            const y = this.worldToMapY(playerPosition.z);
            
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 8, 0, 2 * Math.PI);
            this.ctx.stroke();
            
            // 警告テキスト
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('発見！', x, y - 20);
        }
    }

    private drawDebugInfo(player: Player, opponent: Player): void {
        // デバッグ情報をキャンバスに表示
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        
        const playerPos = player.getPosition();
        const opponentPos = opponent.getPosition();
        const opponentRot = opponent.getRotation();
        
        // 位置と回転情報を表示
        const debugText = [
            `プレイヤー: (${playerPos.x.toFixed(1)}, ${playerPos.z.toFixed(1)})`,
            `対戦相手: (${opponentPos.x.toFixed(1)}, ${opponentPos.z.toFixed(1)})`,
            `対戦相手回転Y: ${(opponentRot.y * 180 / Math.PI).toFixed(1)}°`
        ];
        
        debugText.forEach((text, index) => {
            this.ctx.fillText(text, 5, 15 + index * 15);
        });
    }

    public resize(): void {
        // 必要に応じてリサイズ処理を実装
    }
} 