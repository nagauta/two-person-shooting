import * as THREE from 'three';
import { GameEngine } from './GameEngine';
import { Player } from '../entities/Player';

export class OpponentViewManager {
    private engine: GameEngine;
    private player: Player;
    private opponent: Player;
    private bulletMeshes: THREE.Mesh[] = [];
    private muzzleFlashes: THREE.PointLight[] = [];

    constructor(engine: GameEngine, player: Player, opponent: Player) {
        this.engine = engine;
        this.player = player;
        this.opponent = opponent;
        
        this.setupScene();
    }

    private setupScene(): void {
        // プレイヤーと対戦相手のメッシュをシーンに追加
        this.engine.addToScene(this.player.getMesh());
        this.engine.addToScene(this.opponent.getMesh());
    }

    public render(): void {
        // 対戦相手の視点からレンダリング
        this.updateOpponentCamera();
        this.updateBulletVisuals();
        this.updateMuzzleFlashes();
        this.engine.render();
    }

    private updateOpponentCamera(): void {
        const camera = this.engine.getCamera();
        const opponentPosition = this.opponent.getPosition();
        const opponentRotation = this.opponent.getRotation();
        
        // カメラを対戦相手の位置に設定（頭の高さ）
        camera.position.copy(opponentPosition);
        camera.position.y += 1.8; // 頭の高さ
        
        // カメラの向きを対戦相手の向きに設定
        camera.rotation.copy(opponentRotation);
        
        // プレイヤーメッシュが確実に見えるようにする
        const playerMesh = this.player.getMesh();
        if (playerMesh) {
            playerMesh.visible = true;
            // プレイヤーの位置を確認してデバッグログ出力
            const playerPos = this.player.getPosition();
            console.log(`プレイヤー位置: (${playerPos.x.toFixed(2)}, ${playerPos.y.toFixed(2)}, ${playerPos.z.toFixed(2)})`);
            console.log(`対戦相手位置: (${opponentPosition.x.toFixed(2)}, ${opponentPosition.y.toFixed(2)}, ${opponentPosition.z.toFixed(2)})`);
        }
        
        // 対戦相手のメッシュは隠す（自分の体は見えないようにする）
        const opponentMesh = this.opponent.getMesh();
        if (opponentMesh) {
            opponentMesh.visible = false;
        }
    }

    private updateBulletVisuals(): void {
        // 既存の弾丸メッシュをクリア
        this.bulletMeshes.forEach(mesh => {
            this.engine.removeFromScene(mesh);
        });
        this.bulletMeshes = [];

        // プレイヤーの弾丸を可視化
        const playerBullets = this.player.getBullets();
        const opponentBullets = this.opponent.getBullets();
        
        [...playerBullets, ...opponentBullets].forEach(bullet => {
            const bulletGeometry = new THREE.SphereGeometry(0.05, 8, 6);
            const bulletMaterial = new THREE.MeshBasicMaterial({ 
                color: bullet.ownerId === 'player' ? 0xffff00 : 0xff0000,
                emissive: bullet.ownerId === 'player' ? 0x444400 : 0x440000
            });
            
            const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
            bulletMesh.position.copy(bullet.position);
            
            this.engine.addToScene(bulletMesh);
            this.bulletMeshes.push(bulletMesh);
        });
    }

    private updateMuzzleFlashes(): void {
        // 古いマズルフラッシュを削除
        this.muzzleFlashes.forEach(flash => {
            this.engine.removeFromScene(flash);
        });
        this.muzzleFlashes = [];

        // 射撃時のマズルフラッシュエフェクト（簡単な実装）
        // 実際のゲームではより複雑なエフェクトシステムが必要
    }

    public getViewFromOpponentPerspective(): {
        canSeePlayer: boolean;
        playerDistance: number;
        playerDirection: THREE.Vector3;
    } {
        const opponentPosition = this.opponent.getPosition();
        const playerPosition = this.player.getPosition();
        const opponentRotation = this.opponent.getRotation();
        
        // プレイヤーまでの方向と距離
        const playerDirection = playerPosition.clone().sub(opponentPosition);
        const playerDistance = playerDirection.length();
        playerDirection.normalize();
        
        // 対戦相手の視線方向
        const opponentForward = new THREE.Vector3(0, 0, -1);
        opponentForward.applyEuler(opponentRotation);
        
        // プレイヤーが視野角内にいるかチェック
        const angle = opponentForward.angleTo(playerDirection);
        const fieldOfView = Math.PI / 3; // 60度
        const canSeePlayer = angle < fieldOfView / 2 && playerDistance < 50;
        
        return {
            canSeePlayer,
            playerDistance,
            playerDirection: playerDirection.clone()
        };
    }

    public createUIOverlay(): string {
        const viewInfo = this.getViewFromOpponentPerspective();
        
        let overlayText = '対戦相手の視点\n';
        overlayText += `プレイヤーまでの距離: ${viewInfo.playerDistance.toFixed(1)}m\n`;
        overlayText += `視界内: ${viewInfo.canSeePlayer ? 'はい' : 'いいえ'}\n`;
        
        return overlayText;
    }

    // デバッグ用: プレイヤーの位置に赤いマーカーを表示
    public showPlayerMarker(show: boolean): void {
        const existingMarker = this.engine.getScene().getObjectByName('playerMarker');
        
        if (existingMarker) {
            this.engine.removeFromScene(existingMarker);
        }
        
        if (show) {
            const markerGeometry = new THREE.SphereGeometry(0.2, 8, 6);
            const markerMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff0000,
                wireframe: true
            });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            
            const playerPos = this.player.getPosition();
            marker.position.set(playerPos.x, playerPos.y + 2, playerPos.z);
            marker.name = 'playerMarker';
            
            this.engine.addToScene(marker);
        }
    }

    // 対戦相手の自動AI行動（簡単な実装）
    public updateOpponentAI(): void {
        const viewInfo = this.getViewFromOpponentPerspective();
        
        if (viewInfo.canSeePlayer) {
            // プレイヤーが見える場合、プレイヤーの方を向く
            const opponentPosition = this.opponent.getPosition();
            const playerPosition = this.player.getPosition();
            
            const direction = playerPosition.clone().sub(opponentPosition);
            const yaw = Math.atan2(direction.x, direction.z);
            
            // 対戦相手の回転を更新（簡単な実装）
            // 実際にはより滑らかな回転が必要
        }
    }
} 