var canvas;
            
document.addEventListener("DOMContentLoaded", function(e) {
    if (isMobileDevice()) return;
    
    canvas = document.getElementsByTagName("canvas")[0];
    var p = [
        "Made with <a href='https://phaser.io/' target='_blank'>Phaser.JS</a>.",
        "Music: <a href='https://www.youtube.com/watch?v=JV41UkBQDhE' target='_blank'>Vexento - Arcade</a>"
    ];
    
    for (var i = 0; i < p.length; i++) {
        var para = document.createElement("p");
        para.innerHTML = p[i];
        para.className = "bottom";
        document.body.appendChild(para);
    }
});