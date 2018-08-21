/*
    Sound documentation: https://photonstorm.github.io/phaser3-docs/Phaser.Sound.BaseSoundManager.html
*/

(function() {
    /* global Phaser, swal, isMobileDevice */
    
    'use strict';
    
    document.addEventListener("DOMContentLoaded", function(e) {
        
        if (isMobileDevice()) {
            try {
                swal({
                    text: "Sorry, but this game can't be played on a mobile device.",
                    icon: "error",
                    closeOnClickOutside: false,
                }).then(function() {
                    window.history.back();
                });
            } catch (err) {
                if (err instanceof ReferenceError) {
                    alert("Sorry, but this game can't be played on a mobile device.");
                    window.history.back();
                } 
            } finally {
                return;
            }
        } 
        
        /*
            VARIABLES
        */
        var platforms;
        var player;
        var cursors;
        var stars;
        var bombs;
        var scoreText;
        var infotext;
        var levelText;
        var score = 0;
        var level = 1;
        var numBombs = 0;
        var upKeyDown = false;
        var infoTextList = [
            "Use the arrow keys to move and jump. \nCollect all the stars!",
            "Don't touch the bomb!",
            "Yikes! 2 bombs!",
            "Now there are 3 bombs!",
            "Do you see where this is going now?",
            "Hey look, the stars move now!",
            "Does that make this game harder?",
            "Hey, this game wasn't meant to be easy.",
            "It would quickly get boring if \nthat was the case.",
            "Are these messages distracting?",
            "Ok, I'll stop.",
            "So, how was your day so far?",
            "Good? That's good.",
            "Ok, I'm stopping for real this time!",
            "xD"
        ];
        var loading = document.getElementById("loading");
        
        loading.innerHTML = "&nbsp;";
        
        /*
            CONFIGURATION
        */
        var canvas = {
            type: Phaser.AUTO, //Defaults to WebGL if supported, otherwise canvas.
            width: 800,
            height: 600,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { 
                        y: 300 
                    },
                    debug: false
                }
            },
            scene: {
                preload: preload,
                create: create,
                update: update
            }
        };
        
        var game = new Phaser.Game(canvas); //Actually load the canvas
        
        function despawnEverything() {
            bombs.children.iterate(function(child) { 
                child.disableBody(true, true);
            });
            stars.children.iterate(function(child) {
                child.disableBody(true, true);
            });
        }
        
        /*
            PRELOAD ASSETS HERE
        */
        function preload() {
            loading.innerHTML = "Loading... Please wait.";
            this.load.image('sky', 'assets/sky.png');
            this.load.image('ground', 'assets/platform.png');
            this.load.image('star', 'assets/star.png');
            this.load.image('bomb', 'assets/bomb.png');
            this.load.image('player', 'assets/player.png');
            this.load.audio('explosion', [
                'assets/explosion.mp3'
            ]);
            this.load.audio('music', [
                'assets/vexento-arcade.mp3',
            ]);
        }
        
        function create() {
            loading.innerHTML = "&nbsp;";
            this.add.image(canvas.width / 2, canvas.height / 2, 'sky');
            
            platforms = this.physics.add.staticGroup(); //Platforms do not move
            platforms.create(canvas.width / 2, canvas.height - 32, 'ground').setScale(2).refreshBody(); //GROUND
            platforms.create(canvas.width - 50, canvas.height - 380, 'ground'); //TOPMOST PLATFORM
            platforms.create(canvas.width - 750, canvas.height - 350, 'ground'); //MIDMOST PLATFORM
            platforms.create(canvas.width - 300, canvas.height - 200, 'ground'); //BOTTOMMOST PLATFORM
            
            player = this.physics.add.image(10, (canvas.height - 250) + 30, 'player');
            player.setBounce(0.2); //A small bounce upon landing
            player.setCollideWorldBounds(true); //Prevent the player from going out of bounds
            
            scoreText = this.add.text(16, 16, "Score: 0", { fontSize: '25px', fill: '#000' });
            infotext = this.add.text(200, 16, infoTextList[0], {fontSize: '20px', fill: '#000'});
            levelText = this.add.text(16, 50, "Level: " + level, {fontSize: '25px', fill: '#000'});
            
            this.physics.add.collider(player, platforms);
            cursors = this.input.keyboard.createCursorKeys();
            
            bombs = this.physics.add.group();

            this.physics.add.collider(bombs, platforms);
            this.sound.play("music");
            
            /*
                ON DEATH
            */
            this.physics.add.collider(player, bombs, function(thePlayer, theBombs) {
                despawnEverything();
                infotext.setText("You died! Refresh the page to try again.");
                this.sound.play("explosion");
                this.physics.pause(); //Stops the game
                this.sound.removeByKey("music"); //Stops the music
                thePlayer.setTint(0xff0000); 
            }, null, this);
            
            stars = this.physics.add.group({
                key: 'star',
                
                /*
                    Change this number to control how many stars spawn. 
                    The numbers of stars spawned is the number here plus one.
                    If you increase this number, make sure to decrease stepX as well.
                */
                repeat: 11, 
                
                setXY: { x: 12, y: 0, stepX: 70},
                collider: true
            });
            
            /*
                INITIALIZE STARS HERE
            */
            stars.children.iterate(function(child) {
                child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
            });
            this.physics.add.collider(stars, platforms);
            
            /*
                ON STAR COLLECT
            */
            this.physics.add.overlap(player, stars, function(thePlayer, theStars) {
                theStars.disableBody(true, true);
                score += 10; 
                scoreText.setText('Score: ' + score);
                
                /*
                    Once the user collects all the stars, spawn 12 new stars and 1 bomb.
                */
                if (stars.countActive(true) === 0) {
                    numBombs++;
                    level++;
                    levelText.setText("Level: " + level);
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
                    
                    infotext.setText(level < infoTextList.length + 1 ? infoTextList[level - 1] : "");
                    
                    var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
                    
                    var bomb = bombs.create(x, 16, 'bomb');
                    bomb.setBounce(1);
                    bomb.setCollideWorldBounds(true);
                    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
                    bomb.allowGravity = false;
                }
            }, null, this); 
        }
        
        /*
            RUN ON EVERY FRAME OF THE GAME
            
            Used to detect keyboard input in this case.
        */
        function update() {
            if (cursors.left.isDown) {
                player.setVelocityX(-160);
            } else if (cursors.right.isDown) {
                player.setVelocityX(160);
            } else {
                player.setVelocityX(0);
            }
            
            if (cursors.up.isDown && player.body.touching.down && !upKeyDown) {
                player.setVelocityY(-330);
                upKeyDown = true;
            } else if (!cursors.up.isDown) {
                upKeyDown = false;
            }
        }
    });
})();