import lottie from './lottie';

enum Status {
    STOP = 0,
    PLAY = 1,
    PAUSE = 2
}

class LottiePlayer {

    private animation: any;
    private container: HTMLElement;

    private playerStatus: Status = Status.STOP

    private dropZone: HTMLElement;
    private player: HTMLElement;
    private slider: HTMLInputElement;

    private firstFrameButton: HTMLButtonElement;
    private oneFrameBackwardButton: HTMLButtonElement;
    private playButton: HTMLButtonElement;
    private oneFrameFowardButton: HTMLButtonElement;
    private lastFrameButton: HTMLButtonElement;

    constructor(container?: HTMLElement) {
        this.container = container;
        this.container.classList.add("lottie-player");

        this.player = document.createElement("div");
        this.dropZone = document.createElement("div");
        this.slider = document.createElement("input");

        this.playButton = document.createElement("button");
        this.lastFrameButton = document.createElement("button");
        this.firstFrameButton = document.createElement("button");
        this.oneFrameFowardButton = document.createElement("button");
        this.oneFrameBackwardButton = document.createElement("button");

        this.render();
    }

    private render(){
        this.configureDropZone();
        this.renderDropZone();
        this.configureUI();
        this.renderUI();
    }

    private configureDropZone() {
        this.dropZone.classList.add("lottie-player__drop-zone")

        this.container.addEventListener("dragover", (ev) => {
            ev.preventDefault();
            this.player.classList.add("drop-over")
        });

        this.container.addEventListener("dragleave", (ev) => {
            ev.preventDefault();
            this.player.classList.remove("drop-over")
        });

        this.container.addEventListener("drop", (ev) => {
            ev.preventDefault();
            this.player.classList.remove("drop-over")

            if (ev.dataTransfer.items) {
                if (ev.dataTransfer.items[0].kind === 'file') {
                    this.player.classList.remove("iddle")
                    var file = ev.dataTransfer.items[0].getAsFile();
                    file.text().then(content => this.loadAnimation(JSON.parse(content)))
                }
            }
        })
    }


    private renderDropZone() {
        this.container.appendChild(this.dropZone);
    }

    private configureUI() {
        let buttons = [this.playButton, this.oneFrameBackwardButton, this.oneFrameFowardButton, this.firstFrameButton, this.lastFrameButton]

        for(let button of buttons) {
            button.disabled = true;
            button.classList.add("material-symbols-outlined")
        }

        this.slider.type = "range";
        this.slider.min = '0';
        this.slider.value = '0';
        this.slider.step = '1'
        this.slider.disabled = true;
        this.slider.classList.add("lottie-player__slider")
        this.slider.addEventListener("input", (e: any) => this.updateAnimation(e.target.value))

        this.playButton.innerText = "play_arrow";
        this.playButton.classList.add("button__play")
        this.playButton.addEventListener("click", () => this.play());

        this.oneFrameFowardButton.innerText = "eject"
        this.oneFrameFowardButton.classList.add("button__one-frame-foward")
        this.oneFrameFowardButton.addEventListener("click", () => this.oneFrame(true))

        this.oneFrameBackwardButton.innerText = "eject"
        this.oneFrameBackwardButton.classList.add("button__one-frame-backward")
        this.oneFrameBackwardButton.addEventListener("click", () => this.oneFrame(false))

        this.firstFrameButton.innerText = "skip_previous"
        this.firstFrameButton.classList.add("button__first-frame")
        this.firstFrameButton.addEventListener("click", () => this.lastOrFirstFrame(true))

        this.lastFrameButton.innerText = "skip_next"
        this.lastFrameButton.classList.add("button__last-frame")
        this.lastFrameButton.addEventListener("click", () => this.lastOrFirstFrame(false))

        this.player.classList.add("lottie-player__player")
    }

    private renderUI() {
        this.container.appendChild(this.player)

        let controls: HTMLElement = document.createElement("div");
        controls.classList.add("lottie-player__controls")
    
        controls.appendChild(this.slider);

        let buttons: HTMLElement = document.createElement("div")
        buttons.classList.add("lottie-player__buttons")
        
        buttons.appendChild(this.firstFrameButton);
        buttons.appendChild(this.oneFrameBackwardButton);
        buttons.appendChild(this.playButton);
        buttons.appendChild(this.oneFrameFowardButton);
        buttons.appendChild(this.lastFrameButton);

        controls.appendChild(buttons);

        this.container.appendChild(controls);
    }

    private loadAnimation(animationData: JSON){

        if(this.animation != undefined) this.animation.destroy();

        this.animation = lottie.loadAnimation({
            container: this.player, 
            renderer: 'svg',
            loop: false,
            autoplay: false,
            animationData: animationData
        })

        this.animation.addEventListener("complete", () => this.reset());
        this.animation.addEventListener("enterFrame", (e: any) => this.enterFrame(e.currentTime));
        this.animation.addEventListener("destroy", () => this.reset());

        this.enableUI();
    }

    private enableUI(){
        this.slider.max = String(this.animation.getDuration(true) - 1);
        this.slider.disabled = false;
        this.playButton.disabled = false;
        this.oneFrameFowardButton.disabled = false;
        this.lastFrameButton.disabled = false;
    }

    private play(){
        if(this.playerStatus == Status.PLAY){
            this.animation.pause();
            this.playerStatus = Status.PAUSE;
            this.playButton.innerText = "play_arrow";
            return;
        }

        this.animation.play();
        this.playerStatus = Status.PLAY;
        this.playButton.innerText = "pause";
    }

    private oneFrame(isFoward: boolean){
        if(isFoward){
            this.updateAnimation(Number(this.slider.value) + 1)
        } else {
            this.updateAnimation(Number(this.slider.value) - 1)
        }
    }

    private lastOrFirstFrame(isFirstFrame: boolean) {
        if(isFirstFrame) {
            this.updateAnimation(0)
        } else {
            this.updateAnimation(this.animation.getDuration(true) - 1)
        }
    }

    private reset(){
        this.animation.stop();
        this.playerStatus = Status.STOP;
        this.playButton.innerText = "play_arrow";
        this.slider.value = '0';
    }


    private enterFrame(frame: number){
        if(frame <= 0){
            this.oneFrameBackwardButton.disabled = true;
            this.firstFrameButton.disabled = true;
        } else {
            this.oneFrameBackwardButton.disabled = false;
            this.firstFrameButton.disabled = false;
        }

        if(frame >= this.animation.getDuration(true) - 1) {
            this.oneFrameFowardButton.disabled = true;
            this.lastFrameButton.disabled = true;
        } else {
            this.oneFrameFowardButton.disabled = false;
            this.lastFrameButton.disabled = false;
        }

        this.slider.value = String(frame)
    }

    private updateAnimation(frame: number) {
        if(this.playerStatus == Status.STOP || this.playerStatus == Status.PAUSE){
            this.animation.goToAndStop(Math.floor(frame), true);
        }

        if(this.playerStatus == Status.PLAY) {
            this.animation.goToAndPlay(Math.floor(frame), true);
        }
    }

}

export default LottiePlayer;