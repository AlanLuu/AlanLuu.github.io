/* global navigator */

var isMobile = {
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

function assert(bool) {
    if (!bool) {
        throw new Error("AssertionError");
    }
}

String.prototype.insertAt = function(index, string) {
    return this.substring(0, index) + string + this.substring(index);
};

(function() {
    /* global navigator */
    
    'use strict';
    
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    
    var color = "#FFFFFF";
    var circleArr = [];
    var circles;
    canvas.width = window.innerWidth - (isMobile.any() ? 17.5 : 35);
    canvas.height = window.innerHeight - (isMobile.any() ? 100 : 70);
    canvas.style.border = "1.5px solid black";
    
    //Paragraph element for this string is hardcoded
    var googStr = "What you see above you is a HEX code representing the current color of the canvas' background. \
    Click <a href='https://www.google.com/search?q=%23" + color.substring(1) + "&oq=%23" + color.substring(1) + 
    "&aqs=chrome..69i57&sourceid=chrome&ie=UTF-8' target='_blank'>here</a> to see this color in a HEX color picker.";
    
    /*
        TODO: find a much better way of organizing these paragraphs...
        For now, don't add any p elements in between the existing p elements.
    */
    var p = [
        document.createElement("p"), //This page doesn't have any information you might want to know about me...
        document.createElement("p"), //Number of circles:
        document.createElement("p"), //Background color
    ];
    
    var rgbDiv = document.getElementById("rgbdiv");
    var rgbPicker = document.getElementById("rgbpicker");
    
    p[0].innerHTML = "This page doesn't have any information you might want to know about me; \
    it's just something I've worked on in my spare free time.";
    p[1].innerHTML = "Number of circles: " + circles;
    p[2].innerHTML = "Background color: " + color;
    rgbPicker.innerHTML = googStr;
    
    //To prevent i from leaking out into the global IIFE's scope
    (function() {
        var i;
        
        for (i = p.length - 1; i >= 1; i--) {
            p[i].className = "bottomofcanvas";
        }
        
        for (i = 0; i < p.length; i++) {
            p[i].style.fontSize = "15px";
            if (i === 0) {
                p[i].style.fontStyle = "italic";
                document.body.insertBefore(p[i], canvas);
                continue;
            }
            document.body.insertBefore(p[i], rgbDiv);
        }
    })();
    
    //To prevent buttonMap from leaking out into the global IIFE's scope
    (function() {
        var buttonMap = {
            "Change canvas color": "colorchangebutton",
            "Random color": "randomcolorbutton",
            "Set the amount of circles": "circlechangebutton"
        };
        
        for (var key in buttonMap) {
            if (buttonMap.hasOwnProperty(key)) {
                var button = document.createElement("button");
                button.id = buttonMap[key];
                button.innerHTML = key;
                document.body.insertBefore(button, document.getElementById("socialmedia"));
            }
        }
    })();
    
    //The only reason why I'm not using ES6 class syntax is because IE doesn't support it.
    function Circle(x, y, radius, color, xVelocity, yVelocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.xVelocity = xVelocity;
        this.yVelocity = yVelocity;
    }
    
    Circle.getRandomColor = function() {
        var letters = "0123456789ABCDEF";
        var color = "#";
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * letters.length)];
        }
        return color;
    };
    
    Circle.prototype.updatePos = function() {
        this.x += this.xVelocity;
        this.y += this.yVelocity;
    };
    
    Circle.prototype.updateVelocity = function() {
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
            this.xVelocity = -this.xVelocity;
        }
        
        if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
            this.yVelocity = -this.yVelocity;
        }  
    };
    
    Circle.prototype.drawCircle = function() {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.fillStyle = this.color;
        context.fill();
        
        //Outlines looks nice on computers, not so much on mobile devices.
        if (!isMobile.any()) {
            context.strokeStyle = "#000000";
            context.stroke();
        }
    };
    
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    
    function eraseCanvas(color) {
        context.fillStyle = color;
        context.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function reloadGoogStr() {
        googStr = "What you see above you is a HEX code representing the current color of the canvas' background. \
        Click <a href='https://www.google.com/search?q=%23" + color.substring(1) + "&oq=%23" + color.substring(1) + 
        "&aqs=chrome..69i57&sourceid=chrome&ie=UTF-8' target='_blank'>here</a> to see this color in a HEX color picker.";
        rgbPicker.innerHTML = googStr;
    }
    
    function render(numCircles, firstRender) {
        function makeCircles() {
            var randomSize = getRandomInt(1, 15);
            var randomX = Math.floor(Math.random() * (canvas.width - randomSize - (firstRender ? 60 : 0)) + randomSize);
            var randomY = Math.floor(Math.random() * (canvas.height - randomSize - (firstRender ? 60 : 0)) + randomSize);
            var randomColor = Circle.getRandomColor();
            
            do {
                var randomXVel = getRandomInt(-4, 4);
            } while (randomXVel > -2 && randomXVel < 2);
            
            do {
                var randomYVel = getRandomInt(-4, 4);
            } while (randomYVel > -2 && randomYVel < 2);
            
            circleArr.push(new Circle(randomX, randomY, randomSize, randomColor, randomXVel, randomYVel));
        }
        
        while (numCircles < circleArr.length) {
            circleArr.pop();
        }
        while (numCircles > circleArr.length) {
            makeCircles();
        }
        circles = numCircles;
        p[1].innerHTML = "Number of circles: " + circles;
    }
    
    document.getElementById("colorchangebutton").addEventListener("click", function(e) {
        var validColors = ["red", "orange", "yellow", "green", "blue", "violet", "purple", "brown", "black", "white", "cyan", 
        "magenta", "azure"];
        
        var colorsAsStr = validColors.join(", ") + ".";
        colorsAsStr = colorsAsStr.insertAt(colorsAsStr.indexOf(validColors[validColors.length - 1]), "and ");
        
        var userInput = prompt("Enter a color name or a HEX code. Valid color names include: " + colorsAsStr, "");
        if (userInput !== null) {
            userInput = userInput.trim();
        } else {
            return;
        }
        
        userInput = userInput.toLowerCase();
        while (validColors.indexOf(userInput) === -1 && (userInput.length !== 6 || !(/[0-9A-Fa-f]{6}/g.test(userInput)))) {
            userInput = prompt("That was not a valid color name or HEX code. Please try again. Valid color names include: " + colorsAsStr, "");
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
            reloadGoogStr();
            rgbDiv.appendChild(rgbPicker);
        }
        p[2].innerHTML = "Background color: " + (validColors.indexOf(userInput) !== -1 ? color.charAt(0).toUpperCase() + color.substring(1).toLowerCase() : color.toUpperCase());
        
    });
    
    document.getElementById("randomcolorbutton").addEventListener("click", function(e) {
        color = Circle.getRandomColor();
        p[2].innerHTML = "Background color: " + color;
        reloadGoogStr();
        rgbDiv.appendChild(rgbPicker);
    });
    
    document.getElementById("circlechangebutton").addEventListener("click", function(e) {
        var userInput = prompt("Currently, there " + (circles === 1 ? "is " : "are ") + (circles === 0 ? "no" : circles) + (circles === 1 ? " circle" : " circles") + " in the canvas. Enter the new amount of circles.", "");
        if (userInput !== null) {
            userInput = userInput.trim();
        } else {
            return;
        }
        
        //Type coercion FTW
        while (userInput < 0 || userInput.length === 0 || userInput % 1 !== 0) {
            userInput = prompt("That was not a valid number. Please try again.", "");
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
    
    
    (function() {
        var isIpad = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        render((isMobile.any() || window.innerWidth <= 400) ? 60 : ((window.innerWidth > 400 && window.innerWidth <= 600) || isIpad) ? 200 : 500, true);
    })();
    
    
   /*////////////////////
        UPDATE LOOP
    ////////////////////*/
    (function update() {
        eraseCanvas(color);
        for (var i = 0; i < circleArr.length; i++) {
            circleArr[i].drawCircle();
            circleArr[i].updatePos();
            circleArr[i].updateVelocity();
        }
        requestAnimationFrame(update);
    })();
})();