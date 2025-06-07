import * as THREE from 'three';

export interface MovementInput {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    jump: boolean;
    crouch: boolean;
}

export interface RotationInput {
    deltaX: number;
    deltaY: number;
}

export interface PlayerStats {
    health: number;
    maxHealth: number;
    score: number;
    ammo: number;
    maxAmmo: number;
}

export interface Bullet {
    id: string;
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    damage: number;
    lifetime: number;
    ownerId: string;
}

export type PlayerType = 'player' | 'opponent';

export interface GameConfig {
    playerSpeed: number;
    mouseSensitivity: number;
    bulletSpeed: number;
    bulletDamage: number;
    maxBulletLifetime: number;
} 