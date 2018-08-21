(function() {
    'use strict';
    
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    
    var color = "#FFFFFF";
    var circleArr = [];
    var circles;
    canvas.width = window.innerWidth - (isMobileDevice() ? 17.5 : 35);
    canvas.height = window.innerHeight - (isMobileDevice() ? 100 : 70);
    canvas.style.border = "1.5px solid black";
    
    //Paragraph element for this string is hardcoded
    var googStr = "What you see above you is a HEX code representing the current color of the canvas' background. \
    Click <a href='https://www.google.com/search?q=%23" + color.substring(1) + "&oq=%23" + color.substring(1) + 
    "&aqs=chrome..69i57&sourceid=chrome&ie=UTF-8' target='_blank'>here</a> to see this color in a HEX color picker.";
    
    /*
        TODO: find a much better way of organizing these paragraphs...
        For now, don't add p elements in between the existing p elements.
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
        for (var i = p.length - 1; i >= 1; i--) {
            p[i].className = "bottomofcanvas";
        }
        
        for (var i = 0; i < p.length; i++) {
            p[i].style.fontSize = "15px";
            if (i === 0) {
                p[i].style.fontStyle = "italic";
                document.body.insertBefore(p[i], canvas);
                continue;
            }    
            //p[i].style.fontSize = "14px";
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
    
    /*
      Returns a new string with the specified string at the specified index.
    */
    String.prototype.insertAt = function(index, string) {
        return this.substring(0, index) + string + this.substring(index);
    };
    
    Array.prototype.removeAt = function(index) {
        this.splice(index, 1);
    };
    
    Array.prototype.addAt = function(index, element) {
        this.splice(index, 0, element);
    };
    
    function Circle(x, y, radius, color, xVelocity, yVelocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.xVelocity = xVelocity;
        this.yVelocity = yVelocity;
        Circle.numCircles++;
        this.circleNum = Circle.numCircles;
    }
    
    Circle.numCircles = 0;
    
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
        if (!isMobileDevice()) {
            context.strokeStyle = "#000000";
            context.stroke();
        }
    };
    
    function isMobileDevice() {
        /* global navigator */
        function check(a) {if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))){return true;} return false;} 
        return check(navigator.userAgent || navigator.vendor || window.opera);
    }
    
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
        
        while (numCircles < circleArr.length) circleArr.pop();
        while (numCircles > circleArr.length) makeCircles();
        circles = numCircles;
        p[1].innerHTML = "Number of circles: " + circles;
    }
    
    document.getElementById("colorchangebutton").addEventListener("click", function(e) {
        var validColors = ["red", "orange", "yellow", "green", "blue", "violet", "purple", "brown", "black", "white", "cyan", 
        "magenta", "azure"];
        
        var colorsAsStr = validColors.join(", ") + ".";
        colorsAsStr = colorsAsStr.insertAt(colorsAsStr.indexOf(validColors[validColors.length - 1]), "and ");
        
        var userInput = prompt("Enter a color name or a HEX code. Valid color names include: " + colorsAsStr, "");
        if (userInput === null) return;
        
        userInput = userInput.toLowerCase();
        while (validColors.indexOf(userInput) === -1 && (userInput.length !== 6 || !(/[0-9A-Fa-f]{6}/g.test(userInput)))) {
            userInput = prompt("That was not a valid color name or HEX code. Please try again. Valid color names include: " + colorsAsStr, "");
            if (userInput === null) return;
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
        document.getElementById("rgbdiv").appendChild(rgbPicker);
    });
    
    document.getElementById("circlechangebutton").addEventListener("click", function(e) {
        var userInput = prompt("Currently, there " + (circles === 1 ? "is " : "are ") + (circles === 0 ? "no" : circles) + (circles === 1 ? " circle" : " circles") + " in the canvas. Enter the new amount of circles.", "");
        if (userInput === null) return;
        while (userInput < 0 || Number(userInput) % 1 !== 0 || Number.isNaN(Number(userInput))) {
            userInput = prompt("That was not a valid number. Please try again.", "");
            if (userInput === null) return;
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
    
    render((isMobileDevice() || window.innerWidth <= 400) ? 60 : (window.innerWidth > 400 && window.innerWidth <= 600) ? 200 : 500, true);
    
    
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