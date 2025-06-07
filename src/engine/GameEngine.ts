import * as THREE from 'three';

export class GameEngine {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private clock: THREE.Clock;

    constructor(canvas: HTMLCanvasElement) {
        this.clock = new THREE.Clock();
        this.initializeRenderer(canvas);
        this.initializeScene();
        this.initializeCamera();
        this.setupLighting();
        this.createEnvironment();
    }

    private initializeRenderer(canvas: HTMLCanvasElement): void {
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setClearColor(0x87CEEB, 1);
    }

    private initializeScene(): void {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    }

    private initializeCamera(): void {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.8, 0);
    }

    private setupLighting(): void {
        // 環境光
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // 太陽光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(-50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);

        // ポイントライト
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 50);
        pointLight.position.set(0, 10, 0);
        pointLight.castShadow = true;
        this.scene.add(pointLight);
    }

    private createEnvironment(): void {
        // 床
        const floorGeometry = new THREE.PlaneGeometry(100, 100);
        const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // 壁と障害物
        this.createWalls();
        this.createObstacles();
    }

    private createWalls(): void {
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const wallHeight = 10;
        const wallThickness = 1;
        const arenaSize = 50;

        // 4つの壁を作成
        const walls = [
            { pos: [0, wallHeight/2, arenaSize/2], size: [arenaSize, wallHeight, wallThickness] },
            { pos: [0, wallHeight/2, -arenaSize/2], size: [arenaSize, wallHeight, wallThickness] },
            { pos: [arenaSize/2, wallHeight/2, 0], size: [wallThickness, wallHeight, arenaSize] },
            { pos: [-arenaSize/2, wallHeight/2, 0], size: [wallThickness, wallHeight, arenaSize] }
        ];

        walls.forEach(wall => {
            const geometry = new THREE.BoxGeometry(wall.size[0], wall.size[1], wall.size[2]);
            const mesh = new THREE.Mesh(geometry, wallMaterial);
            mesh.position.set(wall.pos[0], wall.pos[1], wall.pos[2]);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.scene.add(mesh);
        });
    }

    private createObstacles(): void {
        const obstacleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        // ランダムな障害物を配置
        for (let i = 0; i < 10; i++) {
            const width = Math.random() * 3 + 1;
            const height = Math.random() * 4 + 2;
            const depth = Math.random() * 3 + 1;
            
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const obstacle = new THREE.Mesh(geometry, obstacleMaterial);
            
            obstacle.position.set(
                (Math.random() - 0.5) * 40,
                height / 2,
                (Math.random() - 0.5) * 40
            );
            
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            this.scene.add(obstacle);
        }
    }

    public getScene(): THREE.Scene {
        return this.scene;
    }

    public getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }

    public getRenderer(): THREE.WebGLRenderer {
        return this.renderer;
    }

    public render(): void {
        this.renderer.render(this.scene, this.camera);
    }

    public onResize(width: number, height: number): void {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    public getDeltaTime(): number {
        return this.clock.getDelta();
    }

    public addToScene(object: THREE.Object3D): void {
        this.scene.add(object);
    }

    public removeFromScene(object: THREE.Object3D): void {
        this.scene.remove(object);
    }
} 