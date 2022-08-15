(() => {
    'use strict';
    console.log("canvas.js");
    
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    
    var color = "#FFFFFF";
    var circles = [];

    var desktopWidth = 35, desktopHeight = 70, mobileWidth = 19, mobileHeight = 400;
    canvas.width = window.innerWidth - (isMobile.any() ? mobileWidth : desktopWidth);
    canvas.width = !isMobile.any() ? canvas.width + 15 : canvas.width;
    canvas.height = window.innerHeight - (isMobile.any() ? mobileHeight : desktopHeight);
    canvas.height = !isMobile.any() ? canvas.height / 2 + 90 : canvas.height;
    canvas.style.border = "1.5px solid black";
    
    var googStr = () => `What you see above you is a HEX code representing the current color of the canvas' background. 
    Click <a href='https://www.google.com/search?q=color+%23${color.substring(1)}' target='_blank'>here</a> to see this color in a HEX color picker.`;
    
    var p = [
        document.createElement("p"), //Number of circles
        document.createElement("p"), //Background color
    ];
    
    var rgbDiv = document.getElementById("rgbdiv");
    var rgbPicker = document.getElementById("rgbpicker");

    p[1].innerHTML = `Background color: ${color}`;
    rgbPicker.innerHTML = googStr();
    
    for (let e of p) {
        e.className = "bottomofcanvas";
        e.style.fontSize = "15px";
        document.body.insertBefore(e, rgbDiv);
    }

    class Circle {
        constructor(x, y, radius, color, xVelocity, yVelocity, withStroke = true) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.color = color;
            this.xVelocity = xVelocity;
            this.yVelocity = yVelocity;
            this.withStroke = withStroke;
        }

        updatePos() {
            this.x += this.xVelocity;
            this.y += this.yVelocity;
        }

        updateVelocity() {
            if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
                this.xVelocity = -this.xVelocity;
            }
            
            if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
                this.yVelocity = -this.yVelocity;
            }
        }

        draw() {
            context.beginPath();
            context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
            context.fillStyle = this.color;
            context.fill();
            if (this.withStroke) {
                context.strokeStyle = "#000000";
                context.stroke();
            }
        }
    }
    
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    function getRandomColor() {
        var letters = "0123456789ABCDEF";
        var color = "#";
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * letters.length)];
        }
        return color;
    }

    function createButton(name, onClick) {
        var button = document.createElement("button");
        button.innerHTML = name;
        button.addEventListener("click", onClick);
        document.body.insertBefore(button, document.getElementById("socialmedia"));
        return button;
    }
    
    function render(numCircles, isFirstRender) {
        function makeCircles() {
            var randomRadius = getRandomInt(5, 15);
            var randomX = getRandomInt(randomRadius, canvas.width - randomRadius - (isFirstRender ? 60 : 0));
            var randomY = getRandomInt(randomRadius, canvas.height - randomRadius - (isFirstRender ? 60 : 0));
            var randomColor = getRandomColor();
            
            var randomXVel;
            do {
                randomXVel = getRandomInt(-4, 4);
            } while (randomXVel > -2 && randomXVel < 2);
            
            var randomYVel;
            do {
                randomYVel = getRandomInt(-4, 4);
            } while (randomYVel > -2 && randomYVel < 2);
            
            circles.push(new Circle(randomX, randomY, randomRadius, randomColor, randomXVel, randomYVel));
        }
        
        while (numCircles < circles.length) {
            circles.pop();
        }
        while (numCircles > circles.length) {
            makeCircles();
        }
        p[0].innerHTML = `Number of circles: ${circles.length}`;
    }
    
    createButton("Change canvas color", _ => {
        var validColors = ["red", "orange", "yellow", "green", "blue", "violet", "purple", "brown", "black", "white", "cyan", 
        "magenta", "azure"];
        
        var colorsAsStr = validColors.join(", ") + ".";
        colorsAsStr = colorsAsStr.insertAt(colorsAsStr.indexOf(validColors[validColors.length - 1]), "and ");
        
        var userInput = window.prompt("Enter a color name or a hex color code. Valid color names include: " + colorsAsStr);
        if (userInput !== null) {
            userInput = userInput.trim();
        } else {
            return;
        }
        
        if (userInput[0] === '#') userInput = userInput.substring(1);
        userInput = userInput.toLowerCase();
        while (validColors.indexOf(userInput) === -1 && (userInput.length !== 6 || !(/[0-9A-Fa-f]{6}/g.test(userInput)))) {
            userInput = window.prompt("That was not a valid color name or hex color code. Please try again. Valid color names include: " + colorsAsStr);
            if (userInput !== null) {
                userInput = userInput.trim();
            } else {
                return;
            }
            userInput = userInput.toLowerCase();
        }
        
        if (validColors.indexOf(userInput) !== -1) {
            color = userInput.toLowerCase();
            if (Boolean(document.getElementById("rgbpicker"))) {
                rgbDiv.removeChild(rgbPicker);
            } 
        } else {
            color = "#" + userInput;
            rgbPicker.innerHTML = googStr();
            rgbDiv.appendChild(rgbPicker);
        }
        p[1].innerHTML = `Background color: ${validColors.indexOf(userInput) !== -1 ? color.charAt(0).toUpperCase() + color.substring(1).toLowerCase() : color.toUpperCase()}`;
    });
    
    createButton("Random color", _ => {
        color = getRandomColor();
        p[1].innerHTML = `Background color: ${color}`;
        rgbPicker.innerHTML = googStr();
        rgbDiv.appendChild(rgbPicker);
    });
    
    createButton("Set the amount of circles", _ => {
        var userInput = window.prompt(`Currently, there ${circles.length === 1 ? "is" : "are"} ${circles.length === 0 ? "no" : circles.length} ${circles.length === 1 ? "circle" : "circles"} in the canvas. Enter the new amount of circles as a number.`);
        if (userInput !== null) {
            userInput = userInput.trim();
        } else {
            return;
        }
        
        //Type coercion FTW
        while (userInput < 0 || userInput.length === 0 || userInput % 1 !== 0) {
            userInput = window.prompt("That was not a valid number. Please try again. Enter the new amount of circles as a number.");
            if (userInput !== null) {
                userInput = userInput.trim();
            } else {
                return;
            }
        }
        
        //RegExp for certain types of numbers
        var numMap = {
            "binary": /^0b[0-1]*$/,
            "hexadecimal": /^0x[0-f]*$/,
            "octal": /^0[1-7][0-7]*$/,
        };

        if (numMap["binary"].test(userInput)) {
            render(parseInt(userInput.substring(2), 2), false);
        } else if (numMap["hexadecimal"].test(userInput)) {
            render(parseInt(userInput.substring(2), 16), false);
        } else if (numMap["octal"].test(userInput)) {
            render(parseInt(userInput, 8), false);
        } else {
            render(parseInt(userInput, 10), false);
        }
    });

    // canvas.addEventListener("click", e => {
    //     var rect = canvas.getBoundingClientRect();

    //     var randomXVel;
    //     do {
    //         randomXVel = getRandomInt(-4, 4);
    //     } while (randomXVel > -2 && randomXVel < 2);
        
    //     var randomYVel;
    //     do {
    //         randomYVel = getRandomInt(-4, 4);
    //     } while (randomYVel > -2 && randomYVel < 2);

    //     circles.push(new Circle(e.clientX - rect.left, e.clientY - rect.top, getRandomInt(5, 15), getRandomColor(), randomXVel, randomYVel));
    //     p[0].innerHTML = `Number of circles: ${circles.length}`;
    // });

    render((isMobile.any() || window.innerWidth <= 400) ? 60 : 200, true);
    
    /*////////////////////
        UPDATE LOOP
    ////////////////////*/
    (function update() {
        context.fillStyle = color;
        context.fillRect(0, 0, canvas.width, canvas.height);
        for (let circle of circles) {
            circle.draw();
            circle.updatePos();
            circle.updateVelocity();
        }
        requestAnimationFrame(update);
    })();
})();