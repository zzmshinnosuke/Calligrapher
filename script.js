var canvas = document.getElementById('canvas'),
    width = canvas.width,
    height = canvas.height,
    context = canvas.getContext("2d");

var canvas_new = document.getElementById('canvas_new'),
    width_new = canvas_new.width,
    height_new = canvas_new.height,
    context_new = canvas_new.getContext("2d");

//FIXME REORGANIZE EBERYTING
//--- constants ---//
RESOLUTION = 4; 
WEIGHT = 15;
MIN_MOUSE_DIST = 5;
SPLIT_THRESHOLD = 8;
SQUARE_SIZE = 300;

DEBUG = {
    "CONTROL_POINTS" : false,
    "DRAW_POINTS" : false,
    "ERROR_LINES" : false,
    "STROKE_INTERNALS" : false,
    "TANGENT_LINES" : false,
    "CORNER_OUTLINES" : false,
    "TRANSPARENT_SEGMENTS" : false,
    "DRAW_PLAIN" : false
};
    
//--- variables ---//
strokes = [];
points = [];
lines = [];
currentPath = [];
errPoint = [];
mouseDown = false;

function wordSizeChange(){
    var wordSizeSelect = document.getElementById("wordSize");
    var index = wordSizeSelect.selectedIndex;
    var value = wordSizeSelect.options[index].value;
    WEIGHT = value;
    if(value==-1){
        WEIGHT = 15;
    }
}

function drawCircle(x,y,r,ctx) {
    ctx.beginPath();
    ctx.arc(x,y,r, 0, 2*Math.PI,false);
    //ctx.fill();
    ctx.stroke();
}

function drawLine(x0,y0,x1,y1,ctx) {
    ctx.beginPath();
    ctx.moveTo(x0,y0);
    ctx.lineTo(x1,y1);
    ctx.stroke();
}

function setDebug(name,t) {
    DEBUG[name] = t;
    update();
}
function toggleDebug(name) {
    DEBUG[name] = !DEBUG[name];
    update();
}
function drawUI() {
    context.strokeStyle = "rgb(55,55,55)";
    context.strokeRect(0,0,width,height);

    context_new.strokeStyle = "rgb(55,55,55)";
    context_new.strokeRect(0,0,width,height);
}

function update() {
    // context.clearRect(0,0,width,height);
    drawUI();
    for(var i = 0; i<strokes.length; i++)
        strokes[i].draw(WEIGHT,context_new);
    
    if(DEBUG.DRAW_POINTS) { 
        context.globalCompositeOperation = "xor";
        var corners = detectCorners(points),
            c = 0;
        for(var i = 0; i<points.length; i++){
            if(i == corners[c]) {
                context.lineWidth = 2;
                c++;
            }
            drawCircle(points[i][0],points[i][1],5,context);
            context.lineWidth = 1;
        }
        context.globalCompositeOperation = "source-over";
    }
    if(DEBUG.ERROR_LINES) {
        context.globalCompositeOperation = "xor";
        console.log("Drawing error lines");
        for(var i = 0; i<lines.length; i++)
            drawLine(lines[i][0],lines[i][1],lines[i][2],lines[i][3],context);
        context.globalCompositeOperation = "source-over";
    }
}

function drawCurrentPath() {
    context.beginPath();
    context.moveTo(currentPath[0][0],currentPath[0][1]);
    for(var i = 1; i<currentPath.length; i++) 
        context.lineTo(currentPath[i][0],currentPath[i][1]);
    context.stroke();
}

/*function getErrorLines() {
    var ts = parameterize(points),
        lines = [];
    for(var i = 0; i<points.length; i++) {
        var bPoint = strokes[0].segments[0].getPoint(ts[i]);
        lines.push(points[i].concat(bPoint));
    }
    return lines;
}*/

canvas.ontouchstart =  function(event) {
	// console.log("start");
    mouseDown = true;
    currentPath = [];
};
canvas.ontouchend = function(event) {
	// console.log("end");
    mouseDown = false;
    points = currentPath;
    
    var curves = fitStroke(points);
    //var curves = [leastSquaresFit(points)]; //reparameterize testing
    
    strokes.push(new Stroke(curves));
    //strokes[0]=new Stroke(curves); //reparameterize testing
    
    update();
};
canvas.ontouchmove = function(event) {
    var mousePos = [event.changedTouches[0].clientX,event.changedTouches[0].clientY];
    if(mouseDown) {      
        if(currentPath.length != 0) {
            if(getDist(mousePos,currentPath[currentPath.length-1])>=MIN_MOUSE_DIST)
                currentPath.push(mousePos);
            drawCurrentPath();
        } else
            currentPath.push(mousePos);
    } 
};

canvas.onmousedown = function(event) {
    mouseDown = true;
    currentPath = [];
};

canvas.onmouseup = function(event) {
    mouseDown = false;
    points = currentPath;
    
    var curves = fitStroke(points);
    
    strokes.push(new Stroke(curves));
    
    update();
};

canvas.onmousemove = function(event) {
    var mousePos = [event.clientX,event.clientY];
    if(mouseDown) {
        
        if(currentPath.length != 0) {
            if(getDist(mousePos,currentPath[currentPath.length-1])>=MIN_MOUSE_DIST)
                currentPath.push(mousePos);
            drawCurrentPath();
        } else
            currentPath.push(mousePos);
    } 
};

keydown = function(event) {
    var k = event.keyCode;
    console.log(k);
    if(k==68) {
        strokes.pop();
    }
    update();
};

window.addEventListener("keydown",keydown,true);

update();

//移动端手绘,阻止页面拖动
document.body.addEventListener('touchmove', function (e) {
    e.preventDefault();
}, { passive: false }); 

document.oncontextmenu = function(){
    return false;
}

document.onselectstart = function(){
    return false;
}
