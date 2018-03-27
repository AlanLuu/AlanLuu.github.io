/* global $ */

"use strict";

var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var buttonClicks = 0;

$(document).ready(function() {
    $("#buttonClicks").html(`Button clicks: ${buttonClicks}`);
    
    $("#redrawCircles").click(function() {
        drawRandomCircle();
        buttonClicks++;
        $("#buttonClicks").html(`Button clicks: ${buttonClicks}`);
    });
    
    $("#canvasDim").html(`The width of this canvas is ${canvas.width} px, and the height is ${canvas.height} px.`);
});

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
}

function getRandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function drawRandomCircle() {
    var radius = 10;
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < 6; i++) {
        var randX = getRandomInteger(radius, canvas.width - radius);
        var randY = getRandomInteger(radius, canvas.height - radius);
        context.beginPath();
        context.arc(randX, randY, radius, 0, 2 * Math.PI, false);
        context.fillStyle = getRandomColor();
        context.fill();
    }
}

drawRandomCircle();