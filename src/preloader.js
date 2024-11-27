

export class Preloader extends Phaser.Scene {

    constructor() {
        super({ key: "Preloader" });
    }

    preload() {

        this.load.setPath("assets");
        this.load.image("tiles", "tilesets/tuxmon-sample-32px-extruded.png");
        this.load.tilemapTiledJSON("map", "tilemaps/tuxemon-town.json");
        this.load.atlas("atlas", "atlas/atlas.png", "atlas/atlas.json");
        
        // avatar image load
        this.load.image('avatar', 'avatars/favicon.png');

        // Event to update the loading bar
        this.load.on("progress", (progress) => {
            console.log("Loading: " + Math.round(progress * 100) + "%");
        });

    }
    create(){
        
        this.scene.start('MainScene')
    }
}
