import { io } from "socket.io-client";
let player;
let cursors;

let other_players = {};
let userListContainer;

export class MainScene extends Phaser.Scene {
    constructor() {
        super("MainScene");
    }

    preload() {
        this.username = localStorage.getItem("username");
        
        this.lobby = this.createLobby()

        this.socket = io("ws://localhost:3000", {
            reconnectionDelayMax: 10000,
            query: {
                username: this.username,
                avatar : localStorage.getItem('avatar')
            },
        });

        if (this.socket) {
            this.socket.on("someone_joined", (data) => {
                console.log("someone joined", data, this);
                
                this.load.image(data.username, data.avatar)
                this.showToast(`${data.username} joined.`, data.avatar);
                this.addPlayer(data.username, data.avatar);

                if (player) {
                    this.socket.emit("player-moving", {
                        username: this.username,
                        coordinates: {
                            x: player.body.x,
                            y: player.body.y,
                        },
                    });
                }

            });

            this.socket.on("someone_left", (data) => {
                this.showToast(`${data.username} left the game.`);
                let other_player = other_players[data?.username];
                if (other_player) {
                    this.removeUserFromLobby(data?.username)
                    other_player.nameTag.destroy()
                    other_player.destroy();
                }
            });

            this.socket.on("player-moving", (data) => {
                this.onOtherPlayerPositionChange(data);
            });
        }
    }

    showToast(message, duration = 8000, avatarKey = "avatar") {
        const padding = 20;
        const avatarSize = 16;
        const toastWidth = 300;
        const toastHeight = 50;

        // Create a container for the toast
        const toastContainer = this.add
            .container(
                this.cameras.main.width - 60,
                this.cameras.main.height - 100
            )
            .setAlpha(1)
            .setScrollFactor(0)
            .setDepth(30);

        // Add a background for the toast
        // const toastBg = this.add.rectangle(
        //     0, 0, toastWidth, toastHeight,
        //     0x333333
        // ).setOrigin(0.5).setDepth(1).setScrollFactor(0);

        // toastContainer.add(toastBg);

        // Add the avatar image if provided
        if (avatarKey) {
            const avatar = this.add
                .image(-toastWidth / 2 + padding + 64 / 2, 0, avatarKey)
                .setDisplaySize(32, 32)
                .setScrollFactor(1)
                .setDepth(1);
            toastContainer.add(avatar);
        }

        // Add the text message
        const textX = avatarKey
            ? -toastWidth / 2 + padding * 2 + 29
            : -toastWidth / 2 + padding;
        const toastText = this.add
            .text(textX, 0, message, {
                font: "18px Arial",
                fill: "#000000",
                backgroundColor: "#ffffff",
                wordWrap: {
                    width:
                        toastWidth - padding * 3 - (avatarKey ? avatarSize : 0),
                },
                // align: 'left'
            })
            .setScrollFactor(0)
            .setOrigin(0, 0.5)
            .setDepth(30);
        toastContainer.add(toastText);

        // Animate the toast appearance and disappearance
        this.tweens.add({
            targets: toastContainer,
            alpha: 1,
            duration: 500,
            yoyo: true,
            hold: duration,
            onComplete: () => toastContainer.destroy(),
        });
    }

    create() {
        this.map = this.make.tilemap({ key: "map"});

        const tileset = this.map.addTilesetImage(
            "tuxmon-sample-32px-extruded",
            "tiles"
        );

        const belowLayer = this.map.createLayer("Below Player", tileset, 0, 0);
        const worldLayer = this.map.createLayer("World", tileset, 0, 0);
        const aboveLayer = this.map.createLayer("Above Player", tileset, 0, 0);

        this.load.image(this.username, 'avatars/favicon.png');

        worldLayer.setCollisionByProperty({ collides: true });

        aboveLayer.setDepth(10);

        const spawnPoint = this.map.findObject(
            "Objects",
            (obj) => obj.name === "Spawn Point"
        );

        player = this.physics.add
            .sprite(spawnPoint.x, spawnPoint.y, "atlas", "misa-front")
            .setSize(30, 40)
            .setOffset(0, 24);

        this.physics.add.collider(player, worldLayer);
        this.nameTag = this.add.text(
            player.x,
            player.y - 30,
            `@${this.username}`,
            {
                font: "16px Arial",
                fill: "#13a113",
                backgroundColor: '#101310',
                padding: { x: 5, y: 2 },
            }
        );
        this.nameTag.setOrigin(0.5);

        const anims = this.anims;
        anims.create({
            key: "misa-left-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "misa-left-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        anims.create({
            key: "misa-right-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "misa-right-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        anims.create({
            key: "misa-front-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "misa-front-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        anims.create({
            key: "misa-back-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "misa-back-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });

        const camera = this.cameras.main;
        camera.startFollow(player);
        camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        cursors = this.input.keyboard.createCursorKeys();


        //lobby
        const lobbyBox = this.add.graphics();
        lobbyBox.fillStyle(0x333333, 0.8);
        lobbyBox.fillRoundedRect(50, 50, 300, 400, 10);
        
        const title = this.add.text(1450, 60, 'User Lobby', {
            font: '20px Arial',
            color: '#ffffff'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(30);

        userListContainer = this.add.container(0, 0);

        // Add some initial users with avatars
        this.addUserToLobby(this, this.username, 'assets/avatars/favicon.png');

        // addUserToLobby(this, 'Player2', 'avatar2');
        // addUserToLobby(this, 'Player3', 'avatar3');
    
    }

    addPlayer(player_name, avatar) {
        const spawnPoint = this.map.findObject(
            "Objects",
            (obj) => obj.name === "Spawn Point"
        );
        let other = this.physics.add
            .sprite(spawnPoint.x, spawnPoint.y, "atlas", "misa-front")
            .setSize(30, 40)
            .setOffset(0, 24);

        let worldLayer = this.map.getLayer("WorldLayer");

        this.physics.add.collider(other, worldLayer);
        
        let nameTag;

        nameTag = this.add.text(
            player.x,
            player.y - 30,
            `@${player_name}`,
            {
                font: "16px Arial",
                fill: "#a11313",
                backgroundColor: '#d2e9d2',
                padding: { x: 5, y: 2 },
            }
        );
        nameTag.setOrigin(0.5);

        other.nameTag = nameTag

        const anims = this.anims;
        anims.create({
            key: "misa-left-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "misa-left-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        anims.create({
            key: "misa-right-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "misa-right-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        anims.create({
            key: "misa-front-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "misa-front-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        anims.create({
            key: "misa-back-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "misa-back-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });

        other_players[player_name] = other;
        this.addUserToLobby(this, player_name, avatar);

    }

    updateOtherPlayerPosition(player_obj, coordinates) {
        let prev_coordinates = {
            x: player_obj.body.position.x,
            y: player_obj.body.position.y,
        };

        player_obj.setPosition(coordinates.x, coordinates.y);

        if (coordinates.x - prev_coordinates.x < 0) {
            player_obj.anims.play("misa-left-walk", true);
            player_obj.setTexture("atlas", "misa-left");
        } else if (coordinates.x - prev_coordinates.x > 0) {
            player_obj.anims.play("misa-right-walk", true);
            player_obj.setTexture("atlas", "misa-right");
        } else if (coordinates.y - prev_coordinates.y < 0) {
            player_obj.anims.play("misa-back-walk", true);
            player_obj.setTexture("atlas", "misa-back");
        } else if (coordinates.y - prev_coordinates.y > 0) {
            player_obj.anims.play("misa-front-walk", true);
            player_obj.setTexture("atlas", "misa-front");
        } else {
            player_obj.anims.stop();
        }

        player_obj?.nameTag.setPosition(player_obj.x, player_obj.y - 30);

    }

    onOtherPlayerPositionChange(player_data) {
        console.log(player_data);
        console.log(other_players);

        if (player_data?.username && player_data?.username !== this.username) {
            let other_player = other_players[player_data?.username];

            if (!other_player) {
                this.addPlayer(player_data?.username);
                other_player = other_players[player_data?.username];
            }

            this.updateOtherPlayerPosition(
                other_player,
                player_data.coordinates
            );
        }
    }

    addUserToLobby(scene, username, avatar) {

        let userNode = document.createElement('div')
        userNode.setAttribute('class', 'lobby-item')
        userNode.setAttribute('userid', username)
        userNode.innerHTML = `
        <image src = ${avatar} /> <span> ${username} </span>
        `
        this.lobby.prepend(userNode)


        // const userCount = userListContainer.list.length;
    
        // // Create avatar image
        // const avatar = scene.add.image(1380, 100 + userCount * 20, 'avatar')
        // .setOrigin(0.5)
        // .setScrollFactor(0)
        // .setDepth(30);

        // avatar.name = username
        
        // // Create user text
        // const userText = scene.add.text(1420, 100 + userCount * 20, username, {
        //     font: '18px Arial',
        //     color: '#ffffff',
        //     backgroundColor: '#444',
        //     padding: { x: 10, y: 5 }
        // })
        // .setInteractive()
        // .setOrigin(0.5)
        // .setScrollFactor(0)
        // .setDepth(30);

        // userText.name = username

        // // Add avatar and text to the container
        // userListContainer.add([avatar, userText]);
    }
    
    // Function to remove a user from the lobby
    removeUserFromLobby(username) {

        console.table(this.lobby.childNodes)
        this.lobby.childNodes.forEach((item) => {
            console.log(item)
            console.log(item.attributes)
            if(item.attributes &&  item.attributes['userid']?.value  === username){
                this.lobby.removeChild(item)
            }
            console.log(item)
        })
        // userListContainer.list.forEach((item, index) => {

        //     console.log(item)

        //     if(item?.name === username){
        //         userListContainer.remove(item, true)
        //     }
            
       
        // })

        // // userListContainer.remove(avatar, true); // Remove avatar
        // // userListContainer.remove(userText, true); // Remove text
    
        // // Reorganize the remaining users
        // userListContainer.list.forEach((item, index) => {
        //     const offset = Math.floor(index / 2); // Adjust for both avatar and text in container
        //     item.setY(100 + offset * 20);
        // });
    }

    
    createLobby(){

        const lobbyContainer = document.createElement('div')
        lobbyContainer.setAttribute('class', 'lobby-container')
        
        lobbyContainer.innerHTML = `
            <p>Lobby </p>
        `
        
        const lobbyDiv = document.createElement('div')
        lobbyDiv.setAttribute('class', 'lobby')

        lobbyContainer.appendChild(lobbyDiv)

        document.body.appendChild(lobbyContainer)

        this.events.once(Phaser.Scenes.SHUTDOWN, () => {
            lobbyContainer.remove()
            lobbyDiv.remove()
        })

        return lobbyDiv

    }

    update(time, data) {
        let player_obj = player;
        const speed = 175;
        const prevVelocity = player_obj.body.velocity.clone();

        // Stop any previous movement from the last frame
        player_obj.body.setVelocity(0);

        // Horizontal movement
        if (cursors.left.isDown) {
            player_obj.body.setVelocityX(-speed);
        } else if (cursors.right.isDown) {
            player_obj.body.setVelocityX(speed);
        }

        // Vertical movement
        if (cursors.up.isDown) {
            player_obj.body.setVelocityY(-speed);
        } else if (cursors.down.isDown) {
            player_obj.body.setVelocityY(speed);
        }

        // Normalize and scale the velocity so that player_obj can't move faster along a diagonal
        player_obj.body.velocity.normalize().scale(speed);

        // Update the animation last and give left/right animations precedence over up/down animations
        if (cursors.left.isDown) {
            player_obj.anims.play("misa-left-walk", true);
        } else if (cursors.right.isDown) {
            player_obj.anims.play("misa-right-walk", true);
        } else if (cursors.up.isDown) {
            player_obj.anims.play("misa-back-walk", true);
        } else if (cursors.down.isDown) {
            player_obj.anims.play("misa-front-walk", true);
        } else {
            player_obj.anims.stop();

            // If we were moving, pick and idle frame to use
            if (prevVelocity.x < 0) player_obj.setTexture("atlas", "misa-left");
            else if (prevVelocity.x > 0)
                player_obj.setTexture("atlas", "misa-right");
            else if (prevVelocity.y < 0)
                player_obj.setTexture("atlas", "misa-back");
            else if (prevVelocity.y > 0)
                player_obj.setTexture("atlas", "misa-front");
        }

        this.nameTag.setPosition(player_obj.x, player_obj.y - 30);

        if (this.socket && (prevVelocity.x || prevVelocity.y))
            this.socket.emit("player-moving", {
                username: this.username,
                coordinates: {
                    x: player_obj.body.x,
                    y: player_obj.body.y,
                },
            });
    }
}
