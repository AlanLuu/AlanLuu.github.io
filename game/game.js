function isMobileDevice() {
    function check(a) {if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))){return true;} return false;} 
    return check(navigator.userAgent || navigator.vendor || window.opera);
}

/*
    Sound documentation: https://photonstorm.github.io/phaser3-docs/Phaser.Sound.BaseSoundManager.html
*/

(function() {
    /* global Phaser, navigator, swal */
    
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
            } catch (e) {
                alert("Sorry, but this game can't be played on a mobile device.");
                window.history.back();
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