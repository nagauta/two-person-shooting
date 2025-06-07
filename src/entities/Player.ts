import * as THREE from 'three';
import { MovementInput, RotationInput, PlayerStats, PlayerType, Bullet } from '../types';

export class Player {
    private position: THREE.Vector3;
    private rotation: THREE.Euler;
    private velocity: THREE.Vector3;
    private stats: PlayerStats;
    private mesh: THREE.Object3D;
    private playerType: PlayerType;
    private bullets: Bullet[] = [];
    
    // 移動設定
    private readonly SPEED = 5;
    private readonly JUMP_FORCE = 8;
    private readonly GRAVITY = -20;
    private readonly MOUSE_SENSITIVITY = 0.002;
    
    // 射撃設定
    private readonly BULLET_SPEED = 50;
    private readonly BULLET_DAMAGE = 25;
    private readonly FIRE_RATE = 200; // ミリ秒
    private lastShotTime = 0;

    constructor(initialPosition: THREE.Vector3, playerType: PlayerType) {
        this.playerType = playerType;
        this.position = initialPosition.clone();
        this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
        this.velocity = new THREE.Vector3();
        
        this.stats = {
            health: 100,
            maxHealth: 100,
            score: 0,
            ammo: 30,
            maxAmmo: 30
        };
        
        this.createPlayerMesh();
    }

    private createPlayerMesh(): void {
        const group = new THREE.Group();
        
        // プレイヤーの体
        const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: this.playerType === 'player' ? 0x0066ff : 0xff6600 
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        body.castShadow = true;
        group.add(body);
        
        // 武器（簡単な箱で表現）
        const weaponGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.8);
        const weaponMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        weapon.position.set(0.3, 1.2, -0.4);
        weapon.castShadow = true;
        group.add(weapon);
        
        // 頭（視線方向の参考）
        const headGeometry = new THREE.SphereGeometry(0.3, 8, 6);
        const headMaterial = new THREE.MeshLambertMaterial({ 
            color: this.playerType === 'player' ? 0x0044aa : 0xaa4400 
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.8;
        head.castShadow = true;
        group.add(head);
        
        this.mesh = group;
        this.updateMeshPosition();
    }

    public handleMovement(movement: MovementInput): void {
        const moveVector = new THREE.Vector3();
        
        if (movement.forward) moveVector.z -= 1;
        if (movement.backward) moveVector.z += 1;
        if (movement.left) moveVector.x -= 1;
        if (movement.right) moveVector.x += 1;
        
        // 移動方向を正規化
        if (moveVector.length() > 0) {
            moveVector.normalize();
            
            // プレイヤーの向きに合わせて移動方向を回転
            moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
            
            this.velocity.x = moveVector.x * this.SPEED;
            this.velocity.z = moveVector.z * this.SPEED;
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
        }
        
        // ジャンプ処理（簡単な実装）
        if (movement.jump && this.position.y <= 0.1) {
            this.velocity.y = this.JUMP_FORCE;
        }
    }

    public handleRotation(rotation: RotationInput): void {
        this.rotation.y -= rotation.deltaX * this.MOUSE_SENSITIVITY;
        this.rotation.x -= rotation.deltaY * this.MOUSE_SENSITIVITY;
        
        // 上下の視点制限
        this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
    }

    public shoot(): void {
        const currentTime = Date.now();
        if (currentTime - this.lastShotTime < this.FIRE_RATE) return;
        if (this.stats.ammo <= 0) return;
        
        // 弾丸の生成
        const bulletDirection = new THREE.Vector3(0, 0, -1);
        bulletDirection.applyEuler(this.rotation);
        
        const bullet: Bullet = {
            id: `${this.playerType}_${currentTime}_${Math.random()}`,
            position: this.position.clone().add(bulletDirection.clone().multiplyScalar(1)),
            velocity: bulletDirection.multiplyScalar(this.BULLET_SPEED),
            damage: this.BULLET_DAMAGE,
            lifetime: 0,
            ownerId: this.playerType
        };
        
        this.bullets.push(bullet);
        this.stats.ammo--;
        this.lastShotTime = currentTime;
        
        console.log(`${this.playerType} が射撃! 残弾: ${this.stats.ammo}`);
    }

    public update(): void {
        const deltaTime = 1 / 60; // 仮の値、実際はGameEngineから取得
        
        // 重力の適用
        this.velocity.y += this.GRAVITY * deltaTime;
        
        // 位置の更新
        this.position.addScaledVector(this.velocity, deltaTime);
        
        // 床との衝突判定（簡単な実装）
        if (this.position.y < 0) {
            this.position.y = 0;
            this.velocity.y = 0;
        }
        
        // 弾丸の更新
        this.updateBullets(deltaTime);
        
        // メッシュの位置更新
        this.updateMeshPosition();
    }

    private updateBullets(deltaTime: number): void {
        this.bullets = this.bullets.filter(bullet => {
            // 弾丸の位置更新
            bullet.position.addScaledVector(bullet.velocity, deltaTime);
            bullet.lifetime += deltaTime;
            
            // 弾丸の生存時間チェック（3秒で消失）
            return bullet.lifetime < 3;
        });
    }

    private updateMeshPosition(): void {
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.copy(this.rotation);
        }
    }

    // ゲッター・セッター
    public getPosition(): THREE.Vector3 {
        return this.position.clone();
    }

    public getRotation(): THREE.Euler {
        return this.rotation.clone();
    }

    public getMesh(): THREE.Object3D {
        return this.mesh;
    }

    public getStats(): PlayerStats {
        return { ...this.stats };
    }

    public getHealth(): number {
        return this.stats.health;
    }

    public getScore(): number {
        return this.stats.score;
    }

    public getBullets(): Bullet[] {
        return this.bullets;
    }

    public takeDamage(damage: number): void {
        this.stats.health = Math.max(0, this.stats.health - damage);
        console.log(`${this.playerType} がダメージを受けた! 残りHP: ${this.stats.health}`);
    }

    public addScore(points: number): void {
        this.stats.score += points;
    }

    public reload(): void {
        this.stats.ammo = this.stats.maxAmmo;
        console.log(`${this.playerType} がリロード完了!`);
    }

    public getPlayerType(): PlayerType {
        return this.playerType;
    }
} 