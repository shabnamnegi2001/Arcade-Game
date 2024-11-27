import { Game } from "phaser";
import { Preloader } from "./preloader";
import { GameOverScene } from "./scenes/GameOverScene";
import { HudScene } from "./scenes/HudScene";
import { MainScene } from "./scenes/MainScene";
import { MenuScene } from "./scenes/MenuScene";
import { SplashScene } from "./scenes/SplashScene";
import {Welcome} from './scenes/welcome';

const config = {
    type: Phaser.AUTO,
    width: 1250,
    height: 800,
    parent: "phaser-container",
    pixelArt: true,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 },
        },
    },
    // max: {
        // width: 1600,
        // height: 1500,
    // },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [
        Welcome,
        Preloader,
        // SplashScene,
        MainScene,
        // MenuScene,
        // HudScene,
        // GameOverScene
    ],
};

new Game(config);
