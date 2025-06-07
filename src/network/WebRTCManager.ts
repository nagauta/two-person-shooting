export interface GameMessage {
    type: 'player_update' | 'player_shoot' | 'game_sync' | 'room_join' | 'room_ready';
    data: any;
    timestamp: number;
}

export interface PlayerUpdateData {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    health: number;
    score: number;
    ammo: number;
}

export interface ShootData {
    position: { x: number; y: number; z: number };
    direction: { x: number; y: number; z: number };
    bulletId: string;
}

export class WebRTCManager {
    private peerConnection: RTCPeerConnection;
    private dataChannel: RTCDataChannel | null = null;
    private isHost: boolean = false;
    private roomId: string = '';
    private isConnected: boolean = false;
    
    // コールバック関数
    public onConnectionOpen: (() => void) | null = null;
    public onConnectionClose: (() => void) | null = null;
    public onGameMessage: ((message: GameMessage) => void) | null = null;
    public onOfferCreated: ((offer: string) => void) | null = null;
    public onAnswerCreated: ((answer: string) => void) | null = null;

    constructor() {
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });

        this.setupPeerConnection();
    }

    private setupPeerConnection(): void {
        // ICE候補の処理
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate === null) {
                // ICE収集完了
                this.handleICEGatheringComplete();
            }
        };

        // データチャンネルの受信
        this.peerConnection.ondatachannel = (event) => {
            const channel = event.channel;
            this.setupDataChannel(channel);
        };

        // 接続状態の監視
        this.peerConnection.onconnectionstatechange = () => {
            console.log('接続状態:', this.peerConnection.connectionState);
            
            if (this.peerConnection.connectionState === 'connected') {
                this.isConnected = true;
                this.onConnectionOpen?.();
            } else if (this.peerConnection.connectionState === 'disconnected' || 
                       this.peerConnection.connectionState === 'failed') {
                this.isConnected = false;
                this.onConnectionClose?.();
            }
        };
    }

    private setupDataChannel(channel: RTCDataChannel): void {
        this.dataChannel = channel;
        
        channel.onopen = () => {
            console.log('データチャンネル開設');
            this.onConnectionOpen?.();
        };

        channel.onclose = () => {
            console.log('データチャンネル切断');
            this.onConnectionClose?.();
        };

        channel.onmessage = (event) => {
            try {
                const message: GameMessage = JSON.parse(event.data);
                this.onGameMessage?.(message);
            } catch (error) {
                console.error('メッセージ解析エラー:', error);
            }
        };
    }

    // ルーム作成（ホストとして）
    public async createRoom(): Promise<string> {
        this.isHost = true;
        this.roomId = this.generateRoomId();
        
        // データチャンネル作成
        this.dataChannel = this.peerConnection.createDataChannel('gameData', {
            ordered: true
        });
        
        this.setupDataChannel(this.dataChannel);
        
        // オファー作成
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        
        return this.roomId;
    }

    // ルーム参加（ゲストとして）
    public async joinRoom(roomId: string): Promise<void> {
        this.isHost = false;
        this.roomId = roomId;
    }

    // オファーの受信（ゲスト側）
    public async receiveOffer(offerSDP: string): Promise<string> {
        const offer = new RTCSessionDescription({ type: 'offer', sdp: offerSDP });
        await this.peerConnection.setRemoteDescription(offer);
        
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        return answer.sdp!;
    }

    // アンサーの受信（ホスト側）
    public async receiveAnswer(answerSDP: string): Promise<void> {
        const answer = new RTCSessionDescription({ type: 'answer', sdp: answerSDP });
        await this.peerConnection.setRemoteDescription(answer);
    }

    private handleICEGatheringComplete(): void {
        if (this.isHost && this.peerConnection.localDescription) {
            this.onOfferCreated?.(this.peerConnection.localDescription.sdp!);
        } else if (!this.isHost && this.peerConnection.localDescription) {
            this.onAnswerCreated?.(this.peerConnection.localDescription.sdp!);
        }
    }

    // ゲームメッセージ送信
    public sendGameMessage(message: GameMessage): void {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(message));
        }
    }

    // プレイヤー位置更新の送信
    public sendPlayerUpdate(data: PlayerUpdateData): void {
        this.sendGameMessage({
            type: 'player_update',
            data,
            timestamp: Date.now()
        });
    }

    // 射撃データの送信
    public sendShoot(data: ShootData): void {
        this.sendGameMessage({
            type: 'player_shoot',
            data,
            timestamp: Date.now()
        });
    }

    private generateRoomId(): string {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    public getRoomId(): string {
        return this.roomId;
    }

    public isRoomHost(): boolean {
        return this.isHost;
    }

    public getConnectionStatus(): boolean {
        return this.isConnected;
    }

    public disconnect(): void {
        if (this.dataChannel) {
            this.dataChannel.close();
        }
        this.peerConnection.close();
        this.isConnected = false;
    }
} 