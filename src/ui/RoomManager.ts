import { WebRTCManager } from '../network/WebRTCManager';

export class RoomManager {
    private webRTCManager: WebRTCManager;
    private roomContainer: HTMLElement;
    private gameContainer: HTMLElement;
    private isConnected: boolean = false;
    
    // コールバック
    public onGameStart: (() => void) | null = null;

    constructor(webRTCManager: WebRTCManager) {
        this.webRTCManager = webRTCManager;
        this.roomContainer = this.createRoomUI();
        this.gameContainer = document.getElementById('gameContainer')!;
        
        this.setupWebRTCHandlers();
        this.showRoomUI();
    }

    private createRoomUI(): HTMLElement {
        const container = document.createElement('div');
        container.id = 'roomUI';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: Arial, sans-serif;
            color: white;
        `;

        container.innerHTML = `
            <div style="text-align: center; max-width: 500px; padding: 40px;">
                <h1 style="font-size: 2.5em; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                    Two Person Shooting
                </h1>
                <p style="font-size: 1.2em; margin-bottom: 40px; opacity: 0.9;">
                    対戦相手の視点で戦うFPS
                </p>
                
                <div id="roomButtons" style="display: flex; gap: 20px; justify-content: center; margin-bottom: 30px;">
                    <button id="createRoomBtn" style="
                        padding: 15px 30px;
                        font-size: 1.1em;
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                    ">
                        ルーム作成
                    </button>
                    <button id="joinRoomBtn" style="
                        padding: 15px 30px;
                        font-size: 1.1em;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        transition: all 0.3s;
                        box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
                    ">
                        ルーム参加
                    </button>
                </div>

                <div id="roomInfo" style="display: none;">
                    <div id="hostSection" style="display: none;">
                        <h3>ルーム作成完了</h3>
                        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <p>ルームID: <strong id="roomIdDisplay" style="font-size: 1.3em; color: #ffd700;"></strong></p>
                            <p style="font-size: 0.9em; opacity: 0.8;">このIDを相手に伝えて、参加してもらってください</p>
                        </div>
                        <textarea id="offerText" style="
                            width: 100%;
                            height: 120px;
                            margin: 10px 0;
                            padding: 10px;
                            border-radius: 5px;
                            border: none;
                            font-family: monospace;
                            font-size: 0.8em;
                            background: rgba(0,0,0,0.3);
                            color: white;
                            resize: vertical;
                        " placeholder="接続情報が生成されるまでお待ちください..." readonly></textarea>
                        <p style="font-size: 0.9em; opacity: 0.8;">この接続情報を相手にコピーして渡してください</p>
                        
                        <div style="margin-top: 20px;">
                            <textarea id="answerInput" style="
                                width: 100%;
                                height: 120px;
                                margin: 10px 0;
                                padding: 10px;
                                border-radius: 5px;
                                border: none;
                                font-family: monospace;
                                font-size: 0.8em;
                                background: rgba(255,255,255,0.9);
                                color: black;
                            " placeholder="相手から受け取った応答情報をここに貼り付けてください"></textarea>
                            <button id="connectBtn" style="
                                padding: 10px 20px;
                                background: #ffc107;
                                color: black;
                                border: none;
                                border-radius: 5px;
                                cursor: pointer;
                                font-weight: bold;
                            ">接続</button>
                        </div>
                    </div>

                    <div id="guestSection" style="display: none;">
                        <h3>ルーム参加</h3>
                        <input id="roomIdInput" type="text" placeholder="ルームID" style="
                            padding: 15px;
                            margin: 10px 0;
                            width: 200px;
                            text-align: center;
                            font-size: 1.2em;
                            border: none;
                            border-radius: 5px;
                            text-transform: uppercase;
                        ">
                        <br>
                        <textarea id="offerInput" style="
                            width: 100%;
                            height: 120px;
                            margin: 10px 0;
                            padding: 10px;
                            border-radius: 5px;
                            border: none;
                            font-family: monospace;
                            font-size: 0.8em;
                            background: rgba(255,255,255,0.9);
                            color: black;
                        " placeholder="ホストから受け取った接続情報をここに貼り付けてください"></textarea>
                        <button id="joinBtn" style="
                            padding: 10px 20px;
                            background: #17a2b8;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-weight: bold;
                        ">参加</button>
                        
                        <div id="answerSection" style="display: none; margin-top: 20px;">
                            <p>応答情報が生成されました。これをホストに送ってください：</p>
                            <textarea id="answerText" style="
                                width: 100%;
                                height: 120px;
                                margin: 10px 0;
                                padding: 10px;
                                border-radius: 5px;
                                border: none;
                                font-family: monospace;
                                font-size: 0.8em;
                                background: rgba(0,0,0,0.3);
                                color: white;
                            " readonly></textarea>
                        </div>
                    </div>
                </div>

                <div id="connectionStatus" style="
                    margin-top: 20px;
                    padding: 15px;
                    border-radius: 10px;
                    background: rgba(255,255,255,0.1);
                    display: none;
                ">
                    <p id="statusText">接続中...</p>
                </div>

                <div style="margin-top: 40px; font-size: 0.9em; opacity: 0.7;">
                    <p>操作方法: WASD移動, マウス視点移動, 左クリック射撃</p>
                </div>
            </div>
        `;

        this.setupEventHandlers(container);
        return container;
    }

    private setupEventHandlers(container: HTMLElement): void {
        const createBtn = container.querySelector('#createRoomBtn') as HTMLButtonElement;
        const joinBtn = container.querySelector('#joinRoomBtn') as HTMLButtonElement;
        const roomButtons = container.querySelector('#roomButtons') as HTMLElement;
        const roomInfo = container.querySelector('#roomInfo') as HTMLElement;
        const connectBtn = container.querySelector('#connectBtn') as HTMLButtonElement;
        const joinRoomBtn = container.querySelector('#joinBtn') as HTMLButtonElement;

        createBtn.addEventListener('click', async () => {
            roomButtons.style.display = 'none';
            roomInfo.style.display = 'block';
            container.querySelector('#hostSection')!.style.display = 'block';
            
            const roomId = await this.webRTCManager.createRoom();
            (container.querySelector('#roomIdDisplay') as HTMLElement).textContent = roomId;
        });

        joinBtn.addEventListener('click', () => {
            roomButtons.style.display = 'none';
            roomInfo.style.display = 'block';
            container.querySelector('#guestSection')!.style.display = 'block';
        });

        connectBtn.addEventListener('click', async () => {
            const answerText = (container.querySelector('#answerInput') as HTMLTextAreaElement).value.trim();
            if (answerText) {
                await this.webRTCManager.receiveAnswer(answerText);
                this.showConnectionStatus('接続中... 相手の参加をお待ちください');
            }
        });

        joinRoomBtn.addEventListener('click', async () => {
            const roomId = (container.querySelector('#roomIdInput') as HTMLInputElement).value.trim();
            const offerText = (container.querySelector('#offerInput') as HTMLTextAreaElement).value.trim();
            
            if (roomId && offerText) {
                await this.webRTCManager.joinRoom(roomId);
                const answer = await this.webRTCManager.receiveOffer(offerText);
                
                (container.querySelector('#answerText') as HTMLTextAreaElement).value = answer;
                container.querySelector('#answerSection')!.style.display = 'block';
                this.showConnectionStatus('応答情報をホストに送信してください');
            }
        });
    }

    private setupWebRTCHandlers(): void {
        this.webRTCManager.onOfferCreated = (offer) => {
            const offerTextarea = this.roomContainer.querySelector('#offerText') as HTMLTextAreaElement;
            offerTextarea.value = offer;
        };

        this.webRTCManager.onConnectionOpen = () => {
            this.isConnected = true;
            this.showConnectionStatus('接続成功！ゲーム開始');
            setTimeout(() => {
                this.hideRoomUI();
                this.onGameStart?.();
            }, 2000);
        };

        this.webRTCManager.onConnectionClose = () => {
            this.isConnected = false;
            this.showConnectionStatus('接続が切断されました');
        };
    }

    private showConnectionStatus(message: string): void {
        const statusDiv = this.roomContainer.querySelector('#connectionStatus') as HTMLElement;
        const statusText = this.roomContainer.querySelector('#statusText') as HTMLElement;
        
        statusText.textContent = message;
        statusDiv.style.display = 'block';
    }

    private showRoomUI(): void {
        document.body.appendChild(this.roomContainer);
        this.gameContainer.style.display = 'none';
    }

    private hideRoomUI(): void {
        this.roomContainer.style.display = 'none';
        this.gameContainer.style.display = 'block';
    }

    public getConnectionStatus(): boolean {
        return this.isConnected;
    }
} 