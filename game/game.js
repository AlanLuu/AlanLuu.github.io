(function() {
    'use strict';
    
    //Not going to add mobile device support for this game
    if (isMobile.any()) {
        try {
            swal({
                text: "Sorry, but this game can only be played on a computer or a tablet with an external keyboard.",
                icon: "error",
                closeOnClickOutside: false
            }).then(function() {
                window.history.back();
            });
        } finally {
            return;
        }
    }
    
    const loading = document.getElementById("loading");
    
    /*
        ERROR HANDLER
    */
    window.addEventListener("error", function(e) {
        var file = e.filename;
        loading.innerHTML = "An error has been detected and the game has been stopped to prevent a crash. <br> " + e.message + " (at " + file.substring(file.lastIndexOf("/") + 1) + " [Line " + e.lineno + "])";
    });
    
    /*
        Saves the player's high score in document.cookie when they exit or reload the page
    */
    window.addEventListener("beforeunload", function(e) {
        if (!debug && score > highScore) {
            document.cookie = score;
        }
    });
    
    /*
        Toggle this to enable debugging mode
    */
    var debug = false;
    
    /*
        GAME OBJECT VARIABLES
    */
    var background;
    var platforms;
    var player;
    var cursors;
    var stars;
    var bombs;
    var pause;
    var resume;
    var scoreText;
    var infoText;
    var livesText;
    var levelText;
    var highScoreText;
    var fpsDebugText;
    
    const BOUNCE_AMOUNT = 0;
    const COLOR_RED = 0xff0000;
    const COLOR_INVINCIBLE = 0xffff00;
    const COLOR_MERCY = 0xffab00;
    const COLOR_WHITE = 0xffffff;
    const GROUND_POUND_SPEED = 500;
    const JUMP_STRENGTH = 330;
    const MERCY_INVINCIBILITY_TIME = 3000;
    const MUSIC_VOLUME = 1.0;
    const POWER_UP_VOLUME = 0.3;
    const RUNNING_SPEED = 250;
    const STARTING_LIVES = 5;
    const WALKING_SPEED = 160;

    /*
        Rewards the player with an extra life after passing a certain number of levels
        Set this value to 0 to disable this feature
    */
    const BONUS_LIFE_LEVELS = 0;
    
    var score = 0;
    var level = 1;
    var lives = debug ? Infinity : STARTING_LIVES;
    var highScore = !isNaN(Number(document.cookie)) ? Number(document.cookie) : 0;
    
    /*
        Prevents the player from repeatedly jumping if the up arrow key is constantly held down
    */
    var upKeyDown = false;
    
    /*
        Represents whether the player has finished their jump
    */
    var jumpEnabled = false;
    
    /*
        When this is true, the player is unaffected by bombs
        This however, by itself, doesn't allow the player to destroy any bomb on contact
    */
    var invincible = false;

    /*
        When this is true, the player will be able to destroy any bomb on contact
        This boolean should NEVER be true if the player is not invincible
        
        canDestroy -> invincible, but it's not always the case that invincible -> canDestroy
    */
    var canDestroy = false;
    
    /*
        This is true when a power-up that causes invincibility is collected
        It stays true for the duration of the power-up
    */
    var invinciblePowerup = false;

    /*
        Can the player ground pound bombs without any negative consequences?
    */
    var invincibleGroundPound = false;
    
    /*
        Provides a time limit on holding down the shift key to speed up
    */
    var isTired = false;
    
    /*
        Daredevil mode: how far can you get with only one life and no power-ups?
    */
    var daredevil = false;

    /*
        Toggle these to enable or disable the background music or the sfx
    */
    var musicEnabled = false;
    var sfxEnabled = true;

    var bombGroundPounded = false;
    
    /*
        UP UP DOWN DOWN LEFT RIGHT LEFT RIGHT B A
    */
    const konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];

    /*
        DOWN DOWN UP UP RIGHT LEFT RIGHT LEFT A B
    */
    const reverseKonami = [40, 40, 38, 38, 39, 37, 39, 37, 65, 66];
    
    /*
        SweetAlert's CDN includes a polyfill for ES6 promises, which allows this game to run in IE
    */
    const wait = function(milliseconds) {
        return new Promise(function(resolve) {
            setTimeout(resolve, milliseconds);
        });
    };
    
    function resetInfoText() {
        infoText.setText(level < infoTextList.length + 1 ? infoTextList[level - 1] : "");
    }
    
    function despawnEverything() {
        bombs.children.iterate(function(child) { 
            child.disableBody(true, true);
        });
        
        stars.children.iterate(function(child) {
            child.disableBody(true, true);
        });
        
        despawnPowerUps();
    }
    
    function despawnPowerUps() {
        for (let key in powerups) {
            if (powerups.hasOwnProperty(key)) {
                powerups[key]["ref"].disableBody(true, true);
            }
        }
    }

    function createBomb() {
        let x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
        let bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;
    }
    
    /*
        Called when lives < 1
        You can also call this explicitly if you want to manually trigger a game over
    */
    function gameOver(_this) {
        invincible = false; //Ignore any invincibility the player has
        lives = 0;
        despawnEverything();
        infoText.setText("You died! Refresh the page to try again.");
        if (sfxEnabled) _this.sound.play("explosion");
        _this.physics.shutdown(); //Stops the game
        _this.input.keyboard.removeAllListeners();
        _this.cameras.main.shake(500);
        if (musicEnabled) _this.sound.removeByKey("music"); //Stops the music
        player.disableBody(true, true); 
        pause.visible = false;
        resume.visible = false;
        if (!debug && score > highScore) {
            document.cookie = score;
        }
    }
    
    function levelCheck() {
        var isLevel = false;
        for (let i = 0; i < arguments.length; i++) {
            isLevel = isLevel || level === arguments[i];
        }
        return isLevel;
    }
    
    /*
        CONFIGURATION
    */
    const canvas = {
        type: Phaser.AUTO, //Defaults to WebGL if supported, otherwise canvas
        width: 800,
        height: 600,
        
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { 
                    y: 300 
                },
                debug: debug
            }
        },
        
        scene: {
            preload: preload,
            create: create,
            update: update
        },
    };
    
    /*
        GAME ASSETS
    */
    const assets = {
        sky: 'assets/sky.png',
        ground: 'assets/platform.png',
        star: 'assets/star.png',
        bomb: 'assets/bomb.png',
        player: 'assets/player.png',
        pause: 'assets/pause.png',
        resume: 'assets/resume.png',
        
        powerups: {
            ultimate: {
                sprite: 'assets/ultimatepotion.png',
                key: 'ultimate',
                spawnRate: 0.0,
                duration: 10000
            },
            
            stop: {
                sprite: 'assets/stoppotion.png',
                key: 'stop',
                spawnRate: 0.0,
                duration: 10000
            },
            
            oneUp: {
                sprite: 'assets/lifepotion.png',
                key: '1up',
                spawnRate: 0.6,
                duration: MERCY_INVINCIBILITY_TIME / 2
            },
            
            invincibility: {
                sprite: 'assets/invinciblepotion.png',
                key: 'invincibility',
                spawnRate: 0.0,
                duration: 10000
            },
        },

        sounds: {
            music: {
                music: 'assets/audio/music.mp3'
            },

            sfx: {
                explosion: 'assets/audio/explosion.mp3',
                starcollect: 'assets/audio/starcollect.mp3',
                powerupcollect: 'assets/audio/powerup.mp3'
            }
        }
    };
    
    const powerups = assets["powerups"];
    
    const infoTextList = [
        "Welcome to Star Collector!\nUse the arrow keys to move, jump, and \nground pound. Hold shift to move faster.\nCollect every star to progress through the game!",
        "Don't touch the bomb!",
        "Yikes! Another bomb!",
        "Hey look, a life potion! \nGrab it for an extra life!",
        "Other powerups may or may not spawn \nas well. Be sure to take advantage of them \nif they spawn!",
        "Hey look, the stars move now!",
        "Does that make this game harder?",
        "Hey, this game wasn't meant to be easy.",
        "It would quickly get boring if \nthat was the case.",
        "Are these messages distracting?",
        "Ok, I'll stop.",
        "So, how was your day so far?",
        "Good? That's good.",
        "Ok ok, I'm stopping for real this time!",
        "Sheesh..."
    ];
    
    const specialInfoTextList = {
        "4": "Be sure to take advantage of extra lives!",
        set: function() {
            if (this.hasOwnProperty(level)) {
                infoText.setText(this[level]);
            } else {
                throw new Error("Invalid level value");
            }
        }
    };
    
    const game = new Phaser.Game(canvas); //Actually load the canvas
    
    document.addEventListener("DOMContentLoaded", function(e) {
        var p = [
            "Made with <a href='https://phaser.io/' target='_blank'>Phaser.JS</a>."
        ];
        if (musicEnabled) p.push("Music: <a href='https://youtu.be/UNTBGiMqcGc' target='_blank'>https://youtu.be/UNTBGiMqcGc</a>");
        
        for (let i = 0; i < p.length; i++) {
            let paragraph = document.createElement("p");
            paragraph.innerHTML = p[i];
            paragraph.className = "bottom";
            document.body.appendChild(paragraph);
        }
    });
    
    /*
        PRELOAD ASSETS HERE
    */
    function preload() {
        loading.innerHTML = (debug ? "Debug mode loading" : "Loading") + "... Please wait.";
        if (console.time) {
            console.time("Game loading time");
        }
        
        for (let key in assets) {
            let subObject = assets[key];
            
            out: {
                for (let key2 in subObject) {
                    switch (key) {
                        case 'powerups':
                            this.load.image(subObject[key2]["key"], subObject[key2]["sprite"]);
                            break;
                        case 'sounds':
                            if (!musicEnabled && !sfxEnabled) {
                                break out;
                            }
                            if (musicEnabled) {
                                for (let musicKey in subObject["music"]) {
                                    this.load.audio(musicKey, subObject["music"][musicKey]);
                                }
                            }
                            if (sfxEnabled) {
                                for (let sfxKey in subObject["sfx"]) {
                                    this.load.audio(sfxKey, subObject["sfx"][sfxKey]);
                                }
                            }
                            break;
                        default:
                            this.load.image(key, subObject);
                            break out;
                    }
                }
            }
        }
        
        if (debug) console.log("Debug mode enabled");
        console.log("Documentation: https://photonstorm.github.io/phaser3-docs/index.html");
        console.log("Uncompressed engine code: https://cdn.jsdelivr.net/npm/phaser@3.11.0/dist/phaser.js");
    }
    
    function create() {
        const _this = this;
        
        loading.innerHTML = "&nbsp;";
        background = this.add.image(canvas.width / 2, canvas.height / 2, 'sky');
        
        /*
            Init platforms
        */
        platforms = this.physics.add.staticGroup(); //Platforms do not move
        platforms.create(canvas.width / 2, canvas.height - 32, 'ground').setScale(2).refreshBody(); //GROUND
        platforms.create(canvas.width - 50, canvas.height - 380, 'ground'); //TOPMOST PLATFORM
        platforms.create(canvas.width - 750, canvas.height - 350, 'ground'); //MIDMOST PLATFORM
        platforms.create(canvas.width - 300, canvas.height - 200, 'ground'); //BOTTOMMOST PLATFORM
        
        /*
            Init pause and resume buttons
        */
        pause = this.add.image(canvas.width - 30, 35, 'pause');
        pause.setInteractive();
        resume = this.add.image(canvas.width - 30, 35, 'resume');
        resume.visible = false;
        resume.setInteractive();
        
        /*
            Init game info text
        */
        scoreText = this.add.text(16, 16, "Score: 0", { fontSize: '25px', fill: '#000'});
        infoText = this.add.text(200, 16, infoTextList[0], {fontSize: '20px', fill: '#000'});
        livesText = this.add.text(16, 84, "Lives: " + lives, {fontSize: '25px', fill: '#000'});
        levelText = this.add.text(16, 50, "Level: " + level, {fontSize: '25px', fill: '#000'});
        highScoreText = this.add.text(16, 120, "High Score: " + highScore, {fontSize: '25px', fill: '#000'});
        if (debug) {
            let fps = (Math.round(game.loop.actualFps * 100.0) / 100.0) + "";
            fpsDebugText = this.add.text(16, 500, "FPS: " + (fps.length === 4 ? fps + "0" : fps), {fontSize: '25px', fill: '#000'});
            this.add.text(510, 500, "Debug mode enabled", {fontSize: '25px', fill: '#000'});
        }
        if (daredevil) {
            lives = 1;
            for (let i = 3; i <= 4; i++) infoTextList[i] = "";
            this.add.text(620, 510, "Daredevil mode", {fontSize: '20px', fill: '#ff0000'});
        }
        
        /*
            Init player
        */
        player = this.physics.add.image(10, canvas.height - 220, 'player');
        player.setBounce(BOUNCE_AMOUNT);
        player.setCollideWorldBounds(true); //Prevent the player from going out of bounds
        
        cursors = this.input.keyboard.createCursorKeys();
        bombs = this.physics.add.group();
        
        this.physics.add.collider(player, platforms);
        this.physics.add.collider(bombs, platforms);
        this.physics.add.collider(bombs, bombs);
        
        /*
            INITIALIZE STARS HERE
        */
        stars = this.physics.add.group({
            key: 'star',
            
            /*
                Change this number to control how many stars spawn
                The numbers of stars spawned is the number here plus one
                If you increase this number, make sure to decrease stepX as well
            */
            repeat: 11,
            setXY: {
                x: 12,
                y: 0,
                stepX: 70
            },
            collider: true
        });
        stars.children.iterate(function(child) {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });
        this.physics.add.collider(stars, platforms);
        
        {
            let references = [];
            for (let key in powerups) {
                if (powerups.hasOwnProperty(key)) {
                    let x = Phaser.Math.Between(10, canvas.width - 30), y = 10, theKey = powerups[key]["key"];
                    powerups[key]["ref"] = this.physics.add.image(x, y, theKey);
                    let powerUp = powerups[key]["ref"];
                    references.push(powerUp);
                    powerUp.disableBody(true, true);
                    this.physics.add.collider(powerUp, platforms);
                    this.physics.add.collider(powerUp, bombs);
                }
            }
            
            for (let i = 0; i < references.length; i++) {
                for (let j = i + 1; j < references.length; j++) {
                    this.physics.add.collider(references[i], references[j]);
                }
            }
        }
        
        if (musicEnabled) {
            this.sound.play("music", {loop: true, volume: MUSIC_VOLUME});
        }
        
        /*
            ON DEATH
        */
        this.physics.add.collider(player, bombs, function(player, bomb) {
            if (canDestroy && !invincible) canDestroy = false;
            
            let groundPounding = !daredevil && cursors.down.isDown && !jumpEnabled && !invinciblePowerup;
            if (invincibleGroundPound && groundPounding) {
                invincible = true;
                canDestroy = true;
            }
            
            if (!invincible) {
                lives--;
                if (lives >= 1) {
                    if (groundPounding && !bombGroundPounded) {
                        infoText.setText("Ouch!");
                    } else {
                        infoText.setText(lives + (lives > 1 ? " lives left!" : " life left! Better be careful!"));
                    }
                    player.setPosition(10, canvas.height - 80);
                    invincible = true;
                    canDestroy = false;
                    wait(groundPounding ? MERCY_INVINCIBILITY_TIME / 2 : MERCY_INVINCIBILITY_TIME).then(function() {
                        invincible = false;
                        if (groundPounding && !bombGroundPounded) {
                            infoText.setText("You can't ground pound bombs!");
                            invincible = true;
                            bombGroundPounded = true;
                            wait(MERCY_INVINCIBILITY_TIME / 2).then(function() {
                                resetInfoText();
                                invincible = false;
                            });
                        } else {
                            resetInfoText();
                        }
                    });
                } else {
                    gameOver(_this);
                }
            } else if (canDestroy) {
                bomb.disableBody(true, true);
                score += 20;
                
                if (sfxEnabled) {
                    this.sound.play('starcollect', {
                        volume: 0.25
                    });
                }
            }

            if (invincibleGroundPound && groundPounding) {
                invincible = false;
                canDestroy = false;
            }
        }, null, this);
        
        /*
            ON STAR COLLECT
        */
        this.physics.add.overlap(player, stars, function(player, star) {
            star.disableBody(true, true);
            score += 10;
            if (!debug && score > highScore) {
                highScoreText.setText("High Score: " + score);
            }
            
            if (sfxEnabled) {
                this.sound.play('starcollect', {
                    volume: 0.25
                });
            }
            
            /*
                Once the user collects all the stars, spawn 12 new stars and add 1 bomb into the game
            */
            if (stars.countActive(true) === 0) {
                if (level >= 1) level++;
                
                if (BONUS_LIFE_LEVELS > 0 && !daredevil && !debug && level % BONUS_LIFE_LEVELS === 0) {
                    lives++;
                    if (sfxEnabled) this.sound.play('powerupcollect', {volume: POWER_UP_VOLUME});
                    wait(5).then(function() {
                        infoText.setText("You got an extra life for passing " + BONUS_LIFE_LEVELS + (BONUS_LIFE_LEVELS === 1 ? " level!" : " levels!"));
                        invincible = true;
                    });
                    wait(2000).then(function() {
                        resetInfoText();
                        invincible = false;
                    });
                }
                
                stars.children.iterate(function(child) {
                    child.enableBody(true, child.x, 0, true, true);
                    
                    //Stars move at level 6 and above, which makes the game harder :)
                    if (level >= 6) {
                        child.setBounce(1);
                        child.setCollideWorldBounds(true);
                        child.setVelocity(Phaser.Math.Between(-200, 200), 20);
                        child.allowGravity = false;
                    }
                });
                
                resetInfoText();
                createBomb();
                
                /*
                    Spawn random power-ups occasionally starting from level 4, if not in daredevil mode
                */
                if (daredevil) return;
                
                if (level > 4) {
                    for (let key in powerups) {
                        if (powerups.hasOwnProperty(key)) {
                            let powerUp = powerups[key]["ref"];
                            let spawnRate = powerups[key]["spawnRate"];
                            let randomNumber = Math.floor(Math.random() * 100) / 100;
                            let willSpawn = !powerUp.visible && randomNumber < spawnRate;
                            if (debug) console.log(key, spawnRate, randomNumber, willSpawn);
                            
                            if (willSpawn) {
                                let x = Phaser.Math.Between(10, canvas.width - 30), y = 10;
                                powerUp.enableBody(true, x, y, true, true);
                                powerUp.setBounce(1);
                                powerUp.setVelocity(Phaser.Math.Between(-200, 200), 20);
                                powerUp.allowGravity = false;
                                powerUp.setCollideWorldBounds(true);
                                break; //If one does get spawned, do not attempt to spawn anymore.
                            }
                        } 
                    }
                    
                /*
                    Spawns an extra life potion at level 4
                    This introduces the player to the concept of power-ups
                */
                } else if (levelCheck(4)) {
                    let oneUp = powerups["oneUp"]["ref"];
                    let x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
                    let y = 10;
                    oneUp.enableBody(true, x, y, true, true);
                    oneUp.setBounce(1);
                    oneUp.setVelocity(Phaser.Math.Between(-200, 200), 20);
                    oneUp.allowGravity = false;
                    oneUp.setCollideWorldBounds(true);
                }
            } 
        }, null, this);
        
        /*
            POWER-UPS 
        */
        this.physics.add.overlap(player, powerups["oneUp"]["ref"], function(player, oneUp) {
            lives++;
            if (sfxEnabled) this.sound.play('powerupcollect', {volume: POWER_UP_VOLUME});
            oneUp.disableBody(true, true);
            infoText.setText(levelCheck(4) ? "Nice!" : "You got an extra life!");
            wait(assets["powerups"]["oneUp"]["duration"]).then(function() {
                levelCheck(4) ? specialInfoTextList.set() : resetInfoText();
            });
        }, null, this);
        this.physics.add.overlap(player, powerups["invincibility"]["ref"], function(player, invincibility) {
            if (!invincible && !canDestroy) {
                invincible = true;
                canDestroy = true;
                invinciblePowerup = true;
                if (sfxEnabled) this.sound.play('powerupcollect', {volume: POWER_UP_VOLUME});
                infoText.setText("You obtained an invincibility potion! \nYou're invincible!");
                invincibility.disableBody(true, true);
                wait(assets["powerups"]["invincibility"]["duration"]).then(function() {
                    invincible = false;
                    canDestroy = false;
                    invinciblePowerup = false;
                    resetInfoText();
                });
            }
        }, null, this);
        this.physics.add.overlap(player, powerups["stop"]["ref"], function(player, stop) {
            stop.disableBody(true, true);
            
            bombs.children.iterate(function(child) {
                child.setVelocity(0, 5);
                child.setBounce(0.1);
                child.allowGravity = false;
            });
            
            stars.children.iterate(function(child) {
                if (child.body.velocity.x !== 0) {
                    child.setVelocity(0, 5);
                    child.setBounce(0.1);
                    child.allowGravity = false;
                }
            });
            
            for (let key in powerups) {
                let powerUp = powerups[key]["ref"];
                if (powerups.hasOwnProperty(key) && powerUp.visible) {
                    powerUp.setVelocity(0, 5);
                    powerUp.setBounce(0.1);
                    powerUp.allowGravity = false;
                }
            }
            
            if (sfxEnabled) this.sound.play('powerupcollect', {volume: POWER_UP_VOLUME});
            
            infoText.setText("Game objects stopped!");
            wait(assets["powerups"]["stop"]["duration"]).then(function() {
                bombs.children.iterate(function(child) {
                    child.setBounce(1);
                    child.setVelocity(Phaser.Math.Between(-200, 200), 20);
                    child.setY(child.y - 60);
                    child.allowGravity = false;
                });
                
                stars.children.iterate(function(child) {
                    if (child.body.velocity.x === 0 && level >= 6) {
                        child.setBounce(1);
                        child.setVelocity(Phaser.Math.Between(-200, 200), 20);
                        child.allowGravity = false;
                    }
                });
                
                for (let key in powerups) {
                    let powerUp = powerups[key]["ref"];
                    if (powerups.hasOwnProperty(key) && powerUp.visible) {
                        powerUp.setBounce(1);
                        powerUp.setVelocity(Phaser.Math.Between(-200, 200), 20);
                        powerUp.setY(powerUp.y - 60);
                        powerUp.allowGravity = false;
                    }
                }
                
                resetInfoText();
            });
        }, null, this);
        this.physics.add.overlap(player, powerups["ultimate"]["ref"], function(player, ultimate) {
            ultimate.disableBody(true, true);
            invincible = true;
            canDestroy = true;
            invinciblePowerup = true;
            lives++;
            
            bombs.children.iterate(function(child) {
                child.setVelocity(0, 5);
                child.setBounce(0.1);
                child.allowGravity = false;
            });
            stars.children.iterate(function(child) {
                if (child.body.velocity.x !== 0) {
                    child.setVelocity(0, 5);
                    child.setBounce(0.1);
                    child.allowGravity = false;
                }
            });
            for (let key in powerups) {
                let powerUp = powerups[key]["ref"];
                if (powerups.hasOwnProperty(key) && powerUp.visible) {
                    powerUp.setVelocity(0, 5);
                    powerUp.setBounce(0.1);
                    powerUp.allowGravity = false;
                }
            }
            
            if (sfxEnabled) this.sound.play('powerupcollect', {volume: POWER_UP_VOLUME});
            
            infoText.setText("Lives increased by one, \nyou are now invincible, \nand all game objects have been stopped!");
            
            wait(assets["powerups"]["ultimate"]["duration"]).then(function() {
                invincible = false;
                canDestroy = false;
                invinciblePowerup = false;
                bombs.children.iterate(function(child) {
                    child.setBounce(1);
                    child.setVelocity(Phaser.Math.Between(-200, 200), 20);
                    child.setY(child.y - 60);
                    child.allowGravity = false;
                });
                stars.children.iterate(function(child) {
                    if (child.body.velocity.x === 0 && level >= 6) {
                        child.setBounce(1);
                        child.setVelocity(Phaser.Math.Between(-200, 200), 20);
                        child.allowGravity = false;
                    }
                });
                for (let key in powerups) {
                    let powerUp = powerups[key]["ref"];
                    if (powerups.hasOwnProperty(key) && powerUp.visible) {
                        powerUp.setBounce(1);
                        powerUp.setVelocity(Phaser.Math.Between(-200, 200), 20);
                        powerUp.setY(powerUp.y - 60);
                        powerUp.allowGravity = false;
                    }
                }
                resetInfoText();
            });
            
        }, null, this);
        
        /*
            CALL THIS WHEN PAUSE BUTTON IS CLICKED
        */
        pause.on('pointerdown', function() {
            this.physics.pause();
            this.sound.pauseAll();
            infoText.setText("Game paused.");
            pause.visible = false;
            resume.visible = true;
        }, this);
        
        /*
            CALL THIS WHEN RESUME BUTTON IS CLICKED
        */
        resume.on('pointerdown', function() {
            this.physics.resume();
            this.sound.resumeAll();
            resetInfoText();
            pause.visible = true;
            resume.visible = false;
        }, this);
        
        /*
            CHEAT CODES
        */
        {
            const ENTER = ",13";

            function keyCodes(str) {
                var result = "";
                var len = str.length;
                for (let i = 0; i < len; i++) {
                    result += str.toUpperCase().charCodeAt(i) + (i !== len - 1 ? "," : "");
                }
                return result;
            }

            let codesMap = new Map();
            let repeatingCodesMap = new Map();

            codesMap.set(konami + "", function() {
                (function loop(messages, counter) {
                    infoText.setText(messages[counter]);
                    wait(2000).then(counter < messages.length - 1 ? function() {
                        loop(messages, ++counter);
                    } : function() {
                        gameOver(_this);
                    });
                })([
                    "Konami code?",
                    "Ah, you're so clever.",
                    "Why did you enter this code?",
                    "Did you think it would help you out?",
                    "Nope, it actually kills you.",
                    "LOL"
                ], 0);
                
                invincible = false;
                pause.visible = false;
                despawnEverything();
                background.setTint(COLOR_RED);
                player.setTintFill(COLOR_RED);
                scoreText.setTintFill(COLOR_WHITE);
                infoText.setTintFill(COLOR_WHITE);
                livesText.setTintFill(COLOR_WHITE);
                levelText.setTintFill(COLOR_WHITE);
                highScoreText.setTintFill(COLOR_WHITE);
            });

            repeatingCodesMap.set(reverseKonami + "", function() {
                lives += STARTING_LIVES;
                infoText.setText("Lives increased by " + STARTING_LIVES + ".");
                wait(2000).then(resetInfoText);
            });

            repeatingCodesMap.set(keyCodes("powerups"), function() {
                if (debug) {
                    for (let key in powerups) {
                        if (powerups.hasOwnProperty(key)) {
                            let powerUp = powerups[key]["ref"];
                            let x = Phaser.Math.Between(10, canvas.width - 30), y = 10;
                            powerUp.enableBody(true, x, y, true, true);
                            powerUp.setBounce(1);
                            powerUp.setVelocity(Phaser.Math.Between(-200, 200), 20);
                            powerUp.allowGravity = false;
                            powerUp.setCollideWorldBounds(true);
                        }
                    }
                }
            });

            repeatingCodesMap.set(keyCodes("bomb"), function() {
                if (debug) createBomb();
            });

            codesMap.set(keyCodes("daredevil"), function() {
                daredevil = true;
                lives = 1;
                despawnPowerUps();
                infoTextList[3] = infoTextList[4] = "";
                infoText.setText("Daredevil mode activated!");
                _this.add.text(620, 510, "Daredevil mode", {fontSize: '20px', fill: '#ff0000'});
                wait(2000).then(resetInfoText);
            });

            codesMap.set(keyCodes("kill") + ENTER, function() {
                gameOver(_this);
            });
            codesMap.set(keyCodes("die") + ENTER, codesMap.get(keyCodes("kill") + ENTER));

            codesMap.forEach(function(value, key) {
                var codeArr = key.split(",").map(function(element) {
                    return window.parseInt(element, 10);
                });
                _this.input.keyboard.createCombo(codeArr);
            });

            repeatingCodesMap.forEach(function(value, key) {
                var codeArr = key.split(",").map(function(element) {
                    return window.parseInt(element, 10);
                });
                _this.input.keyboard.createCombo(codeArr, {resetOnMatch: true});
            });

            this.input.keyboard.on('keycombomatch', function(e) {
                if (daredevil) return; //Cheat codes do not work in daredevil mode

                var code = e.keyCodes + "";
                if (codesMap.has(code)) {
                    codesMap.get(code)();
                } else {
                    repeatingCodesMap.get(code)();
                }
            });
        }
        
        if (lives === 0) gameOver(this);
        if (console.timeEnd) {
            console.timeEnd("Game loading time");
        }
    }
    
    /*
        UPDATE LOOP
    */
    function update() {
        livesText.setText("Lives: " + (!window.isFinite(lives) ? "∞" : lives));
        levelText.setText("Level: " + level);
        scoreText.setText('Score: ' + score);
        
        /*
            Allows the player to move
            Speed increases when the shift key is held down
        */
        if (!cursors.down.isDown) {
            if (cursors.shift.isDown && !isTired) {
                player.setVelocityX(cursors.left.isDown ? -RUNNING_SPEED : cursors.right.isDown ? RUNNING_SPEED : 0);
                wait(5000).then(function() {
                    if (cursors.shift.isDown) isTired = true;
                });
            } else {
                player.setVelocityX(cursors.left.isDown ? -WALKING_SPEED : cursors.right.isDown ? WALKING_SPEED : 0);
                wait(5000).then(function() {
                    isTired = false;
                });
            }
        } else { //Allows the player to ground pound
            player.setVelocityX(0);
            player.setVelocityY(!jumpEnabled || !player.body.touching.down ? GROUND_POUND_SPEED : 0);
        }
        
        /*
            Allows the player to jump
        */
        if (cursors.up.isDown) {
            if (!upKeyDown && jumpEnabled) {
                player.setVelocityY(-JUMP_STRENGTH);
                jumpEnabled = false;
            }
            upKeyDown = true;
        } else {
            upKeyDown = false;
        }

        /*
            Only allow the player to jump when they're standing on a platform
            and not in the air
        */
        jumpEnabled = player.body.touching.down;
        
        /*
            If invincible, change the player's color to yellow
        */
        if (invincible && canDestroy) {
            player.setTintFill(COLOR_INVINCIBLE);
        } else if (invincible) {
            player.setTintFill(COLOR_MERCY);
        } else {
            player.clearTint();
        }
        
        /*
            Prevents the player from getting stuck if they somehow accidentally clip through the bottom platform
        */
        if (player.y >= 530) player.y = 510;
        
        assert(level >= 1, "Invalid level number");
        assert(score >= 0, "Score cannot be negative");
        assert(lives >= 0, "Lives cannot be negative");

        //(!canDestroy || invincible) is equivalent to (canDestroy -> invincible)
        assert(!canDestroy || invincible, "canDestroy is true, but invincible is false");
        
        if (debug) {
            let fps = (Math.round(game.loop.actualFps * 100.0) / 100.0) + "";
            fpsDebugText.setText("FPS: " + (fps.length === 4 ? fps + "0" : fps));
        }
    }
})();