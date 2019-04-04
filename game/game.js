var isMobile = {
    /* global navigator */
    
    android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    blackberry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    ios: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    windows: function() {
        return navigator.userAgent.match(/IEMobile/i) || navigator.userAgent.match(/WPDesktop/i);
    },
    any: function() {
        return isMobile.android() || isMobile.blackberry() || isMobile.ios() || isMobile.opera() || isMobile.windows();
    }
};

function assert(bool, message) {
    if (!bool) {
        /*
        class AssertionError extends Error {
            constructor(s) {
                super(s || "");
                this.name = this.constructor.name;
            }
        }
        */
        throw new Error(message || "");
    }
}

function playTheme() {
    var audio = new Audio("assets/audio/jackpot.mp3");
    return audio.play(), audio;
}

String.prototype.insertAt = function(index, string) {
    return this.substring(0, index) + string + this.substring(index);
};

Array.prototype.removeAt = function(index) {
    return this.splice(index, 1)[0];
};

Array.prototype.addAt = function(index, element) {
    this.splice(index, 0, element);
};

Array.equals = function(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    
    var i = arr1.length;
    while (i--) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
};

Array.prototype.equals = function(other) {
    if (this.length !== other.length) return false;
    
    var i = this.length;
    while (i--) {
        if (this[i] !== other[i]) return false;
    }
    return true;
};

String.prototype.equals = Array.prototype.equals;

/*
    ACTUAL GAME CODE
*/
(function() {
    /* global Phaser, swal */
    
    'use strict';
    
    //Not going to add mobile or tablet device support for this game.
    if (isMobile.any()) {
        try {
            swal({
                text: "Sorry, but this game can only be played on a computer.",
                icon: "error",
                closeOnClickOutside: false
            }).then(function() {
                window.history.back();
            });
        } finally {
            return;
        }
    }
    
    /*
        Toggle this to enable debugging mode.
    */
    var debug = false;
    assert(debug === true || debug === false, "Debug variable is not a boolean");
    
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
    
    /*
        NUMERICAL VARIABLES
    */
    var score = 0;
    var level = 1;
    var lives = debug ? Infinity : 5;
    var highScore = !isNaN(Number(document.cookie)) ? Number(document.cookie) : 0;
    
    /*
        CONSTANT NUMERICAL VALUES
    */
    const WALKING_SPEED = 160;
    const RUNNING_SPEED = 250;
    
    assert(lives >= 1, "Lives must be greater than or equal to 1");
    
    //Prevents the player from repeatedly jumping if the up arrow key is constantly held down.
    var upKeyDown = false;
    
    /*
        When this is true, the player is unaffected by bombs.
        
        This however, by itself, doesn't allow the player to destroy any bomb on contact.
    */
    var invincible = false;
    
    /*
        When this is true, the player will be able to destroy any bomb on contact.
        
        This boolean should NEVER be true if the player is not invincible.
    */
    var canDestroy = false;
    
    /*
        Daredevil mode: how far can you get with only one life and no power-ups?
    */
    var daredevil = false;
    
    const konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    const reverseKonami = [40, 40, 38, 38, 39, 37, 39, 37, 65, 66];
    const loading = document.getElementById("loading");
    
    /*
        SweetAlert's CDN includes a polyfill for ES6 promises, which allows this game to run in IE.
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
    
    /*
        Called when lives < 1.
        You can also call this explicitly if you want to manually trigger a game over.
    */
    function gameOver(_this) {
        invincible = false; //Ignore any invincibility the player has
        lives = 0;
        despawnEverything();
        infoText.setText("You died! Refresh the page to try again.");
        _this.sound.play("explosion");
        _this.physics.shutdown(); //Stops the game
        _this.input.keyboard.removeAllListeners();
        _this.cameras.main.shake(500);
        _this.sound.removeByKey("music"); //Stops the music
        player.disableBody(true, true); 
        pause.visible = false;
        resume.visible = false;
        if (!debug && score > highScore) {
            document.cookie = score;
        }
    }
    
    /*
        CONFIGURATION
    */
    const canvas = {
        type: Phaser.AUTO, //Defaults to WebGL if supported, otherwise canvas.
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
                spawnRate: 0.05,
                duration: 10000
            },
            
            invincibility: {
                sprite: 'assets/invinciblepotion.png',
                key: 'invincibility',
                spawnRate: 0.2,
                duration: 10000
            },
            
            stop: {
                sprite: 'assets/stoppotion.png',
                key: 'stop',
                spawnRate: 0.6,
                duration: 10000
            },
            
            oneUp: {
                sprite: 'assets/lifepotion.png',
                key: '1up',
                spawnRate: 0.6,
                duration: 1500
            }
        },
        
        sounds: {
            explosion: 'assets/audio/explosion.mp3',
            starcollect: 'assets/audio/starcollect.mp3',
            powerupcollect: 'assets/audio/powerup.mp3',
            music: 'assets/audio/jackpot.mp3'
        }
    };
    const powerups = assets["powerups"];
    
    const infoTextList = [
        "Welcome to Star Collector!\nUse the arrow keys to move and jump. \nHold the shift key to move faster.\nCollect every star to progress through the game!",
        "Don't touch the bomb!",
        "Yikes! Two bombs!",
        "Hey look, a life potion! \nGrab it for an extra life!",
        "Other powerups may occasionally spawn as \nwell. There are " + Object.keys(powerups).length + " of them. Be sure to take \nadvantage of those too!",
        "Hey look, the stars move now!",
        "Does that make this game harder?",
        "Hey, this game wasn't meant to be easy.",
        "It would quickly get boring if \nthat was the case.",
        "Are these messages distracting?",
        "Ok, I'll stop.",
        "So, how was your day so far?",
        "Good? That's good.",
        "Ok, I'm stopping for real this time!"
    ];
    
    const game = new Phaser.Game(canvas); //Actually load the canvas
    
    document.addEventListener("DOMContentLoaded", function(e) {
        window.canvas = document.getElementsByTagName("canvas")[0];
        window.context = window.canvas.getContext("webgl");
        
        var p = [
            "Made with <a href='https://phaser.io/' target='_blank'>Phaser.JS</a>.",
            "Music: <a href='https://www.youtube.com/watch?v=kL8CyVqzmkc0' target='_blank'>TheFatRat - Jackpot</a>"
        ];
        
        for (let i = 0; i < p.length; i++) {
            let paragraph = document.createElement("p");
            paragraph.innerHTML = p[i];
            paragraph.className = "bottom";
            document.body.appendChild(paragraph);
        }
    });
    
    /*
        ERROR HANDLER
    */
    window.addEventListener("error", function(e) {
        loading.innerHTML = "An error has been detected and the game has been stopped to prevent a crash. <br> Check the browser console for more information.";
    });
    
    /*
        Saves the player's high score in document.cookie when they exit or reload the page.
    */
    window.addEventListener("beforeunload", function(e) {
        if (!debug && score > highScore) {
            document.cookie = score;
        }
    });
    
    /*
        PRELOAD ASSETS HERE
    */
    function preload() {
        loading.innerHTML = (debug ? "Debug mode loading" : "Loading") + "... Please wait.";
        
        for (let key in assets) {
            let subObject = assets[key];
            
            out: {
                for (let key2 in subObject) {
                    switch (key) {
                        case 'powerups':
                            this.load.image(subObject[key2]["key"], subObject[key2]["sprite"]);
                            break;
                        case 'sounds':
                            this.load.audio(key2, subObject[key2]);
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
        
        platforms = this.physics.add.staticGroup(); //Platforms do not move
        platforms.create(canvas.width / 2, canvas.height - 32, 'ground').setScale(2).refreshBody(); //GROUND
        platforms.create(canvas.width - 50, canvas.height - 380, 'ground'); //TOPMOST PLATFORM
        platforms.create(canvas.width - 750, canvas.height - 350, 'ground'); //MIDMOST PLATFORM
        platforms.create(canvas.width - 300, canvas.height - 200, 'ground'); //BOTTOMMOST PLATFORM
        
        player = this.physics.add.image(10, canvas.height - 220, 'player');
        player.setBounce(0.2); //A small bounce upon landing
        player.setCollideWorldBounds(true); //Prevent the player from going out of bounds
        
        pause = this.add.image(canvas.width - 30, 35, 'pause');
        pause.setInteractive();
        
        resume = this.add.image(canvas.width - 30, 35, 'resume');
        resume.visible = false;
        resume.setInteractive();
        
        for (let key in powerups) {
            if (powerups.hasOwnProperty(key)) {
                let x = Phaser.Math.Between(10, canvas.width - 30), y = 10, theKey = powerups[key]["key"];
                powerups[key]["ref"] = this.physics.add.image(x, y, theKey);
                let powerUp = powerups[key]["ref"];
                powerUp.disableBody(true, true);
                this.physics.add.collider(powerUp, platforms);
            }
        }
        
        scoreText = this.add.text(16, 16, "Score: 0", { fontSize: '25px', fill: '#000'});
        infoText = this.add.text(200, 16, "", {fontSize: '20px', fill: '#000'});
        resetInfoText();
        livesText = this.add.text(16, 84, "Lives: " + lives, {fontSize: '25px', fill: '#000'});
        levelText = this.add.text(16, 50, "Level: " + level, {fontSize: '25px', fill: '#000'});
        highScoreText = this.add.text(16, 120, "High Score: " + highScore, {fontSize: '25px', fill: '#000'});
        if (debug) this.add.text(510, 500, "Debug mode enabled", {fontSize: '25px', fill: '#000'});
        
        if (daredevil) {
            lives = 1;
            for (let i = 3; i <= 4; i++) infoTextList[i] = "";
            this.add.text(620, 510, "Daredevil mode", {fontSize: '20px', fill: '#ff0000'});
        }
        
        cursors = this.input.keyboard.createCursorKeys();
        
        bombs = this.physics.add.group();
        
        this.physics.add.collider(player, platforms);
        this.physics.add.collider(bombs, platforms);
        this.sound.play("music", {loop: true});
        
        /*
            ON DEATH
        */
        this.physics.add.collider(player, bombs, function(player, bomb) {
            if (canDestroy && !invincible) canDestroy = false;
            
            if (!invincible) {
                lives--;
                if (lives >= 1) {
                    infoText.setText(lives + (lives > 1 ? " lives left!" : " life left! Better be careful!"));
                    player.setPosition(10, canvas.height - 80);
                    invincible = true;
                    canDestroy = false;
                    wait(3000).then(function() {
                        resetInfoText();
                        invincible = false;
                    });
                } else {
                    gameOver(_this);
                }
            } else if (canDestroy) {
                bomb.disableBody(true, true);
                score += 20;
                this.sound.play('starcollect', {
                    volume: 0.25
                });
            }
        }, null, this);
        
        /*
            INITIALIZE STARS HERE
        */
        stars = this.physics.add.group({
            key: 'star',
            
            /*
                Change this number to control how many stars spawn. 
                The numbers of stars spawned is the number here plus one.
                If you increase this number, make sure to decrease stepX as well.
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
        
        /*
            ON STAR COLLECT
        */
        this.physics.add.overlap(player, stars, function(player, star) {
            star.disableBody(true, true);
            score += 10;
            if (!debug && score > highScore) {
                highScoreText.setText("High Score: " + score);
            }
            
            this.sound.play('starcollect', {
                volume: 0.25
            });
            
            /*
                Once the user collects all the stars, spawn 12 new stars and add 1 bomb into the game.
            */
            if (stars.countActive(true) === 0) {
                if (level >= 1) level++;
                
                /*
                    Gives the player an extra life after a certain amount of levels; comment out this block
                    if this feature is not desired.
                */
                {
                    let levels = 10;
                    if (!daredevil && !debug && level % levels === 0) {
                        lives++;
                        this.sound.play('powerupcollect', {volume: 0.5});
                        wait(5).then(function() {
                            infoText.setText("You got an extra life for passing " + levels + " levels!");
                            invincible = true;
                        });
                        wait(2000).then(function() {
                            resetInfoText();
                            invincible = false;
                        });
                    }
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
                
                let x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
                let bomb = bombs.create(x, 16, 'bomb');
                bomb.setBounce(1);
                bomb.setCollideWorldBounds(true);
                bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
                bomb.allowGravity = false;
                
                /*
                    Spawn random power-ups occasionally starting from level 4, if not in daredevil mode.
                    If one does get spawned, do not attempt to spawn anymore.
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
                                break;
                            }
                        } 
                    }
                    
                /*
                    Spawns an extra life potion at level 4.
                    This introduces the player to the concept of power-ups.
                */
                } else if (level === 4) {
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
            let isLevel4 = level === 4;
            lives++;
            this.sound.play('powerupcollect', {volume: 0.5});
            oneUp.disableBody(true, true);
            infoText.setText(isLevel4 ? "Nice!" : "You got an extra life!");
            wait(assets["powerups"]["oneUp"]["duration"]).then(function() {
                if (isLevel4) {
                    infoText.setText("Be sure to take advantage of extra lives!");
                } else {
                    resetInfoText();
                }
            });
        }, null, this);
        this.physics.add.overlap(player, powerups["invincibility"]["ref"], function(player, invincibility) {
            if (!invincible && !canDestroy) {
                invincible = true;
                canDestroy = true;
                this.sound.play('powerupcollect', {volume: 0.5});
                infoText.setText("You obtained an invincibility potion! \nYou're invincible!");
                invincibility.disableBody(true, true);
                wait(assets["powerups"]["invincibility"]["duration"]).then(function() {
                    invincible = false;
                    canDestroy = false;
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
            this.sound.play('powerupcollect', {volume: 0.5});
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
            
            this.sound.play('powerupcollect', {volume: 0.5});
            
            infoText.setText("Lives increased by one, \nyou are now invincible, \nand all game objects have been stopped!");
            
            wait(assets["powerups"]["ultimate"]["duration"]).then(function() {
                invincible = false;
                canDestroy = false;
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
        this.input.keyboard.createCombo(konami);
        this.input.keyboard.createCombo(reverseKonami, {
            resetOnMatch: true
        });
        this.input.keyboard.createCombo("powerups", {
            resetOnMatch: true
        });
        this.input.keyboard.createCombo("daredevil");
        this.input.keyboard.on('keycombomatch', function(e) {
            if (daredevil) return; //Cheat codes do not work in daredevil mode.
            
            if (e.keyCodes.equals(konami)) {
                lives += 30;
                
                (function loop(messages, milliseconds, counter) {
                    infoText.setText(messages[counter]);
                    wait(milliseconds).then(counter < messages.length - 1 ? function() {
                        loop(messages, milliseconds, ++counter);
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
                ], 2000, 0);
                
                invincible = false;
                pause.visible = false;
                despawnEverything();
                background.setTint(0xff0000);
                player.setTintFill(0xff0000);
                scoreText.setTintFill(0xffffff);
                infoText.setTintFill(0xffffff);
                livesText.setTintFill(0xffffff);
                levelText.setTintFill(0xffffff);
            } else if (e.keyCodes.equals(reverseKonami)) {
                lives += 30;
                invincible = true;
                infoText.setText("Lives increased by 30.");
                wait(2000).then(function() {
                    invincible = !invincible;
                    resetInfoText();
                });
            } else if (e.keyCodes.equals([80, 79, 87, 69, 82, 85, 80, 83]) && debug) {
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
            } else if (e.keyCodes.equals([68, 65, 82, 69, 68, 69, 86, 73, 76])) {
                daredevil = true;
                lives = 1;
                despawnPowerUps();
                for (let i = 3; i <= 4; i++) infoTextList[i] = "";
                infoText.setText("Daredevil mode activated!");
                _this.add.text(620, 510, "Daredevil mode", {fontSize: '20px', fill: '#ff0000'});
                wait(2000).then(resetInfoText);
            }
        });
        
        if (lives <= 0) gameOver(this);
    }
    
    /*
        UPDATE LOOP
    */
    function update() {
        livesText.setText("Lives: " + (!isFinite(lives) ? "∞" : lives));
        levelText.setText("Level: " + level);
        scoreText.setText('Score: ' + score);
        
        /*
            Allows the player to move.
        */
        if (cursors.shift.isDown) {
            player.setVelocityX(cursors.left.isDown ? -RUNNING_SPEED : cursors.right.isDown ? RUNNING_SPEED : 0);
        } else {
            player.setVelocityX(cursors.left.isDown ? -WALKING_SPEED : cursors.right.isDown ? WALKING_SPEED : 0);
        }
        
        /*
            Allows the player to jump.
        */
        if (cursors.up.isDown && player.body.touching.down && !upKeyDown) {
            player.setVelocityY(-330);
            upKeyDown = true;
        } else if (!cursors.up.isDown) {
            upKeyDown = false;
        }
        
        /*
            If invincible, change the player's color to yellow.
        */
        if (invincible && canDestroy) {
            player.setTintFill(0xffff00);
        } else if (invincible) {
            player.setTintFill(0xffab00);
        } else {
            player.clearTint();
        }
        
        /*
            Prevents the player from getting stuck if they somehow accidentally clip through the bottom platform.
        */
        if (player.y >= 530) player.y = 510;
        
        assert(level >= 1, "Invalid level number");
        assert(score >= 0, "Invalid score");
    }
})();