
window.addEventListener('DOMContentLoaded', (event) => {


    let treesheet = new Image()
    treesheet.src = 'treesheet.png'
    // let pomaoimg = new Image()
    // pomaoimg.src = 'rcpomao.png'

    const squaretable = {} // this section of code is an optimization for use of the hypotenuse function on Line and LineOP objects
    for (let t = 0; t < 10000000; t++) {
        squaretable[`${t}`] = Math.sqrt(t)
        if (t > 999) {
            t += 9
        }
    }
    const gamepadAPI = {
        controller: {},
        turbo: true,
        connect: function (evt) {
            if (navigator.getGamepads()[0] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[1] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[2] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[3] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            }
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] === null) {
                    continue;
                }
                if (!gamepads[i].connected) {
                    continue;
                }
            }
        },
        disconnect: function (evt) {
            gamepadAPI.turbo = false;
            delete gamepadAPI.controller;
        },
        update: function () {
            gamepadAPI.controller = navigator.getGamepads()[0]
            gamepadAPI.buttonsCache = [];// clear the buttons cache
            for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {// move the buttons status from the previous frame to the cache
                gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
            }
            gamepadAPI.buttonsStatus = [];// clear the buttons status
            var c = gamepadAPI.controller || {}; // get the gamepad object
            var pressed = [];
            if (c.buttons) {
                for (var b = 0, t = c.buttons.length; b < t; b++) {// loop through buttons and push the pressed ones to the array
                    if (c.buttons[b].pressed) {
                        pressed.push(gamepadAPI.buttons[b]);
                    }
                }
            }
            var axes = [];
            if (c.axes) {
                for (var a = 0, x = c.axes.length; a < x; a++) {// loop through axes and push their values to the array
                    axes.push(c.axes[a].toFixed(2));
                }
            }
            gamepadAPI.axesStatus = axes;// assign received values
            gamepadAPI.buttonsStatus = pressed;
            // console.log(pressed); // return buttons for debugging purposes
            return pressed;
        },
        buttonPressed: function (button, hold) {
            var newPress = false;
            for (var i = 0, s = gamepadAPI.buttonsStatus.length; i < s; i++) {// loop through pressed buttons
                if (gamepadAPI.buttonsStatus[i] == button) {// if we found the button we're looking for...
                    newPress = true;// set the boolean variable to true
                    if (!hold) {// if we want to check the single press
                        for (var j = 0, p = gamepadAPI.buttonsCache.length; j < p; j++) {// loop through the cached states from the previous frame
                            if (gamepadAPI.buttonsCache[j] == button) { // if the button was already pressed, ignore new press
                                newPress = false;
                            }
                        }
                    }
                }
            }
            return newPress;
        },
        buttons: [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'Left-Trigger', 'Right-Trigger', 'Back', 'Start', 'Axis-Left', 'Axis-Right', 'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right', "Power"
        ],
        buttonsCache: [],
        buttonsStatus: [],
        axesStatus: []
    };
    let canvas
    let canvas_context
    let keysPressed = {}
    let FLEX_engine
    let TIP_engine = {}
    let XS_engine
    let YS_engine
    TIP_engine.x = 350
    TIP_engine.y = 350
    class Point {
        constructor(x, y) {
            this.x = x
            this.y = y
            this.radius = 0
        }
        pointDistance(point) {
            return (new LineOP(this, point, "transparent", 0)).hypotenuse()
        }
    }

    class Vector { // vector math and physics if you prefer this over vector components on circles
        constructor(object = (new Point(0, 0)), xmom = 0, ymom = 0) {
            this.xmom = xmom
            this.ymom = ymom
            this.object = object
        }
        isToward(point) {
            let link = new LineOP(this.object, point)
            let dis1 = link.sqrDis()
            let dummy = new Point(this.object.x + this.xmom, this.object.y + this.ymom)
            let link2 = new LineOP(dummy, point)
            let dis2 = link2.sqrDis()
            if (dis2 < dis1) {
                return true
            } else {
                return false
            }
        }
        rotate(angleGoal) {
            let link = new Line(this.xmom, this.ymom, 0, 0)
            let length = link.hypotenuse()
            let x = (length * Math.cos(angleGoal))
            let y = (length * Math.sin(angleGoal))
            this.xmom = x
            this.ymom = y
        }
        magnitude() {
            return (new Line(this.xmom, this.ymom, 0, 0)).hypotenuse()
        }
        normalize(size = 1) {
            let magnitude = this.magnitude()
            this.xmom /= magnitude
            this.ymom /= magnitude
            this.xmom *= size
            this.ymom *= size
        }
        multiply(vect) {
            let point = new Point(0, 0)
            let end = new Point(this.xmom + vect.xmom, this.ymom + vect.ymom)
            return point.pointDistance(end)
        }
        add(vect) {
            return new Vector(this.object, this.xmom + vect.xmom, this.ymom + vect.ymom)
        }
        subtract(vect) {
            return new Vector(this.object, this.xmom - vect.xmom, this.ymom - vect.ymom)
        }
        divide(vect) {
            return new Vector(this.object, this.xmom / vect.xmom, this.ymom / vect.ymom) //be careful with this, I don't think this is right
        }
        draw() {
            let dummy = new Point(this.object.x + this.xmom, this.object.y + this.ymom)
            let link = new LineOP(this.object, dummy, "#FFFFFF", 1)
            link.draw()
        }
    }
    class Line {
        constructor(x, y, x2, y2, color, width) {
            this.x1 = x
            this.y1 = y
            this.x2 = x2
            this.y2 = y2
            this.color = color
            this.width = width
        }
        angle() {
            return Math.atan2(this.y1 - this.y2, this.x1 - this.x2)
        }
        squareDistance() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let squareDistance = (xdif * xdif) + (ydif * ydif)
            return squareDistance
        }
        hypotenuse() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            if (hypotenuse < 10000000 - 1) {
                if (hypotenuse > 1000) {
                    return squaretable[`${Math.round(10 * Math.round((hypotenuse * .1)))}`]
                } else {
                    return squaretable[`${Math.round(hypotenuse)}`]
                }
            } else {
                return Math.sqrt(hypotenuse)
            }
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.x1, this.y1)
            canvas_context.lineTo(this.x2, this.y2)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class LineOP {
        constructor(object, target, color, width) {
            this.object = object
            this.target = target
            this.color = color
            this.width = width
        }
        squareDistance() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let squareDistance = (xdif * xdif) + (ydif * ydif)
            return squareDistance
        }
        midpoint() {
            let xdif = this.object.x + this.target.x
            let ydif = this.object.y + this.target.y
            return new Point(xdif / 2, ydif / 2)
        }
        hypotenuse() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            if (hypotenuse < 10000000 - 1) {
                if (hypotenuse > 1000) {
                    return squaretable[`${Math.round(10 * Math.round((hypotenuse * .1)))}`]
                } else {
                    return squaretable[`${Math.round(hypotenuse)}`]
                }
            } else {
                return Math.sqrt(hypotenuse)
            }
        }
        angle() {
            return Math.atan2(this.object.y - this.target.y, this.object.x - this.target.x)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.object.x, this.object.y)
            canvas_context.lineTo(this.target.x, this.target.y)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class Triangle {
        constructor(x, y, color, length, fill = 0, strokeWidth = 0, leg1Ratio = 1, leg2Ratio = 1, heightRatio = 1) {
            this.x = x
            this.y = y
            this.color = color
            this.length = length
            this.x1 = this.x + this.length * leg1Ratio
            this.x2 = this.x - this.length * leg2Ratio
            this.tip = this.y - this.length * heightRatio
            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
            this.fill = fill
            this.stroke = strokeWidth
        }
        draw() {
            canvas_context.strokeStyle = this.color
            canvas_context.stokeWidth = this.stroke
            canvas_context.beginPath()
            canvas_context.moveTo(this.x, this.y)
            canvas_context.lineTo(this.x1, this.y)
            canvas_context.lineTo(this.x, this.tip)
            canvas_context.lineTo(this.x2, this.y)
            canvas_context.lineTo(this.x, this.y)
            if (this.fill == 1) {
                canvas_context.fill()
            }
            canvas_context.stroke()
            canvas_context.closePath()
        }
        isPointInside(point) {
            if (point.x <= this.x1) {
                if (point.y >= this.tip) {
                    if (point.y <= this.y) {
                        if (point.x >= this.x2) {
                            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
                            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
                            this.basey = point.y - this.tip
                            this.basex = point.x - this.x
                            if (this.basex == 0) {
                                return true
                            }
                            this.slope = this.basey / this.basex
                            if (this.slope >= this.accept1) {
                                return true
                            } else if (this.slope <= this.accept2) {
                                return true
                            }
                        }
                    }
                }
            }
            return false
        }
    }
    class Rectanglex {
        constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
            this.x = x
            this.y = y
            this.secret = getRandomColor()
            this.height = height
            this.width = width
            this.color = color
            this.xmom = 0
            this.ymom = 0
            this.stroke = stroke
            this.strokeWidth = strokeWidth
            this.fill = fill
            this.xforce = (Math.random() - .5) * 100
            this.yforce = (Math.random() - .5) * 100
            this.tail = 0
            this.walkable = true
            this.occupied = false
            this.closed = false
            // this.weight = 1

    // //////console.log(astar)
            this.pather = astar
        }

        getValueF() {
            //this is a problem
            var fValue = (this.getValueH()) + (this.getValueG());

            return (fValue);
        }
        getValueH() {
            var endNodePosition = {
                posx: endPoint.x,
                posy: endPoint.y
            };

            return (getDistance(this, endNodePosition));

        }
        getValueG() {
            var startPointPosition = {
                posx: endPoint.x,
                posy: endPoint.y
            };
            return (getDistance(this, startPointPosition));
        }
        getCost(fromNeighbor) {
            this.weight = 1
            // Take diagonal weight into consideration.
            if (fromNeighbor && fromNeighbor.x != this.x && fromNeighbor.y != this.y) {
                return this.weight * 1.41421;
            }
            return this.weight;
        }
        isWall(){
            if(this.tail > 1){
                return false
            }else{
                return true
            }
        }
        draw() {
            // if(this.t == 0){
            //     this.tail = 100
            // }
            // if(this.k == 0){
            //     this.tail = 100
            // }
            // if(this.k == gridx.grid.length-1){
            //     this.tail = 100
            // }
            // if(this.t == gridx.grid.length-1){
            //     this.tail = 100
            // }
            // // if(this.tail > 0 || this.head > 0){
            // //     this.color = `rgba(${255-(this.tail*8)},${this.tail*8},${this.tail*this.tail})`
                canvas_context.fillStyle = this.color
            // //     // canvas_context.strokeStyle = this.color
            // // }else{
            // // // canvas_context.fillStyle = this.color+"81"
            // // // canvas_context.strokeStyle = this.color+"81"
            // // }
            // if(this.tail > 0 || this.head > 0){
            //     canvas_context.fillStyle =`rgba(${255-(this.tail*4)},${this.tail*8},${Math.sqrt(this.tail*333)})`
            // }else  if(this.food){
            //     canvas_context.fillStyle =`rgba(${255-(this.food*255)},${this.food*255},${0})`
            // }else{
            //     canvas_context.fillStyle = "black"

            // }
            canvas_context.lineWidth = .5
            canvas_context.fillRect(this.x, this.y, this.width, this.height)
        }
        move() {
            this.x += this.xmom
            this.y += this.ymom
        }
        isPointInside(point) {
            if (point.x >= this.x) {
                if (point.y >= this.y) {
                    if (point.x <= this.x + this.width) {
                        if (point.y <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            if (point.x + point.radius >= this.x) {
                if (point.y + point.radius >= this.y) {
                    if (point.x - point.radius <= this.x + this.width) {
                        if (point.y - point.radius <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
    }
    class Rectangle {
        constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
            this.x = x
            this.y = y
            this.secret = getRandomColor()
            this.height = height
            this.width = width
            this.color = color
            this.xmom = 0
            this.ymom = 0
            this.stroke = stroke
            this.strokeWidth = strokeWidth
            this.fill = fill
            this.xforce = (Math.random() - .5) * 100
            this.yforce = (Math.random() - .5) * 100
            this.tail = 0
            this.walkable = true
            this.occupied = false
            this.closed = false
            // this.weight = 1

    // //////console.log(astar)
            this.pather = astar
        }

        getValueF() {
            //this is a problem
            var fValue = (this.getValueH()) + (this.getValueG());

            return (fValue);
        }
        getValueH() {
            var endNodePosition = {
                posx: endPoint.x,
                posy: endPoint.y
            };

            return (getDistance(this, endNodePosition));

        }
        getValueG() {
            var startPointPosition = {
                posx: endPoint.x,
                posy: endPoint.y
            };
            return (getDistance(this, startPointPosition));
        }
        getCost(fromNeighbor) {
            this.weight = 1
            // Take diagonal weight into consideration.
            if (fromNeighbor && fromNeighbor.x != this.x && fromNeighbor.y != this.y) {
                return this.weight * 1.41421;
            }
            return this.weight;
        }
        isWall(){
            if(this.tail > 1){
                return false
            }else{
                return true
            }
        }
        draw() {
            if(this.t == 0){
                this.tail = 100
            }
            if(this.k == 0){
                this.tail = 100
            }
            if(this.k == gridx.grid.length-1){
                this.tail = 100
            }
            if(this.t == gridx.grid.length-1){
                this.tail = 100
            }
            // if(this.tail > 0 || this.head > 0){
            //     this.color = `rgba(${255-(this.tail*8)},${this.tail*8},${this.tail*this.tail})`
            //     // canvas_context.fillStyle = this.color
            //     // canvas_context.strokeStyle = this.color
            // }else{
            // // canvas_context.fillStyle = this.color+"81"
            // // canvas_context.strokeStyle = this.color+"81"
            // }
            if(this.tail > 0 || this.head > 0){
                canvas_context.fillStyle =`rgba(${255-(this.tail*4)},${this.tail*8},${Math.sqrt(this.tail*333)})`
            }else  if(this.food){
                canvas_context.fillStyle =`rgba(${255-(this.food*255)},${this.food*255},${0})`
            }else{
                canvas_context.fillStyle = "black"

            }
            canvas_context.lineWidth = .5
            canvas_context.fillRect(this.x, this.y, this.width, this.height)
        }
        move() {
            this.x += this.xmom
            this.y += this.ymom
        }
        isPointInside(point) {
            if (point.x >= this.x) {
                if (point.y >= this.y) {
                    if (point.x <= this.x + this.width) {
                        if (point.y <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            if (point.x + point.radius >= this.x) {
                if (point.y + point.radius >= this.y) {
                    if (point.x - point.radius <= this.x + this.width) {
                        if (point.y - point.radius <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
    }
    class Circle {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = strokeWidth
            this.strokeColor = strokeColor
            this.origin = new Point(x, y)
        }
        draw() {
            canvas_context.lineWidth = 2
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                // canvas_context.fill()
                canvas_context.stroke();
            } else {
                console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -.1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -.1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -.1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -.1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    }
    class CircleRing {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = 10
            this.strokeColor = strokeColor
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } class Polygon {
        constructor(x, y, size, color, sides = 3, xmom = 0, ymom = 0, angle = 0, reflect = 0) {
            if (sides < 2) {
                sides = 2
            }
            this.reflect = reflect
            this.xmom = xmom
            this.ymom = ymom
            this.body = new Circle(x, y, size - (size * .293), "transparent")
            this.nodes = []
            this.angle = angle
            this.size = size
            this.color = color
            this.angleIncrement = (Math.PI * 2) / sides
            this.sides = sides
            for (let t = 0; t < sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
        }
        isPointInside(point) { // rough approximation
            this.body.radius = this.size - (this.size * .293)
            if (this.sides <= 2) {
                return false
            }
            this.areaY = point.y - this.body.y
            this.areaX = point.x - this.body.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.body.radius * this.body.radius)) {
                return true
            }
            return false
        }
        move() {
            if (this.reflect == 1) {
                if (this.body.x > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.body.x < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.body.x += this.xmom
            this.body.y += this.ymom
        }
        draw() {
            this.nodes = []
            this.angleIncrement = (Math.PI * 2) / this.sides
            this.body.radius = this.size - (this.size * .293)
            for (let t = 0; t < this.sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
            canvas_context.strokeStyle = this.color
            canvas_context.fillStyle = this.color
            canvas_context.lineWidth = 0
            canvas_context.beginPath()
            canvas_context.moveTo(this.nodes[0].x, this.nodes[0].y)
            for (let t = 1; t < this.nodes.length; t++) {
                canvas_context.lineTo(this.nodes[t].x, this.nodes[t].y)
            }
            canvas_context.lineTo(this.nodes[0].x, this.nodes[0].y)
            canvas_context.fill()
            canvas_context.stroke()
            canvas_context.closePath()
        }
    }
    class Shape {
        constructor(shapes) {
            this.shapes = shapes
        }
        draw() {
            for (let t = 0; t < this.shapes.length; t++) {
                this.shapes[t].draw()
            }
        }
        move() {
            for (let t = 0; t < this.shapes.length; t++) {
                this.shapes[t].move()
            }
        }
        isPointInside(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].isPointInside(point)) {
                    return true
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return true
                }
            }
            return false
        }
        innerShape(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return this.shapes[t]
                }
            }
            return false
        }
        isInsideOf(box) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (box.isPointInside(this.shapes[t])) {
                    return true
                }
            }
            return false
        }
        adjustByFromDisplacement(x, y) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (typeof this.shapes[t].fromRatio == "number") {
                    this.shapes[t].x += x * this.shapes[t].fromRatio
                    this.shapes[t].y += y * this.shapes[t].fromRatio
                }
            }
        }
        adjustByToDisplacement(x, y) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (typeof this.shapes[t].toRatio == "number") {
                    this.shapes[t].x += x * this.shapes[t].toRatio
                    this.shapes[t].y += y * this.shapes[t].toRatio
                }
            }
        }
        mixIn(arr) {
            for (let t = 0; t < arr.length; t++) {
                for (let k = 0; k < arr[t].shapes.length; k++) {
                    this.shapes.push(arr[t].shapes[k])
                }
            }
        }
        push(object) {
            this.shapes.push(object)
        }
    }

    class Spring {
        constructor(x, y, radius, color, body = 0, length = 1, gravity = 0, width = 1) {
            if (body == 0) {
                this.body = new Circle(x, y, radius, color)
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            } else {
                this.body = body
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            }
            this.gravity = gravity
            this.width = width
        }
        balance() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += (this.body.x - this.anchor.x) / this.length
                this.body.ymom += (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom -= (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom -= (this.body.y - this.anchor.y) / this.length
            } else {
                this.body.xmom -= (this.body.x - this.anchor.x) / this.length
                this.body.ymom -= (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom += (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom += (this.body.y - this.anchor.y) / this.length
            }
            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            this.beam.draw()
            this.body.draw()
            this.anchor.draw()
        }
        move() {
            this.anchor.ymom += this.gravity
            this.anchor.move()
        }

    }
    class SpringOP {
        constructor(body, anchor, length, width = 3, color = body.color) {
            this.body = body
            this.anchor = anchor
            this.beam = new LineOP(body, anchor, color, width)
            this.length = length
            this.marked = 0
        }

        clean() {
            if (this.sqr > ((this.length * 2.1) * (this.length * 1.1))) { // length is 16
                let k = cup.drops.indexOf(this.body.ref)
                let t = cup.drops.indexOf(this.anchor.ref)
                this.body.ref.links.splice(this.body.ref.links.indexOf(t), 1)
                this.anchor.ref.links.splice(this.anchor.ref.links.indexOf(k), 1)
                cup.links.splice(cup.links.indexOf(this), 1)
            }
        }
        balance() {
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += ((this.body.x - this.anchor.x) / this.length)
                this.body.ymom += ((this.body.y - this.anchor.y) / this.length)
                this.anchor.xmom -= ((this.body.x - this.anchor.x) / this.length)
                this.anchor.ymom -= ((this.body.y - this.anchor.y) / this.length)
            } else if (this.beam.hypotenuse() > this.length) {
                this.body.xmom -= (this.body.x - this.anchor.x) / (this.length)
                this.body.ymom -= (this.body.y - this.anchor.y) / (this.length)
                this.anchor.xmom += (this.body.x - this.anchor.x) / (this.length)
                this.anchor.ymom += (this.body.y - this.anchor.y) / (this.length)
            }

            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam.draw()
        }
        move() {
            //movement of SpringOP objects should be handled separate from their linkage, to allow for many connections, balance here with this object, move nodes independently
        }
    }

    class Color {
        constructor(baseColor, red = -1, green = -1, blue = -1, alpha = 1) {
            this.hue = baseColor
            if (red != -1 && green != -1 && blue != -1) {
                this.r = red
                this.g = green
                this.b = blue
                if (alpha != 1) {
                    if (alpha < 1) {
                        this.alpha = alpha
                    } else {
                        this.alpha = alpha / 255
                        if (this.alpha > 1) {
                            this.alpha = 1
                        }
                    }
                }
                if (this.r > 255) {
                    this.r = 255
                }
                if (this.g > 255) {
                    this.g = 255
                }
                if (this.b > 255) {
                    this.b = 255
                }
                if (this.r < 0) {
                    this.r = 0
                }
                if (this.g < 0) {
                    this.g = 0
                }
                if (this.b < 0) {
                    this.b = 0
                }
            } else {
                this.r = 0
                this.g = 0
                this.b = 0
            }
        }
        normalize() {
            if (this.r > 255) {
                this.r = 255
            }
            if (this.g > 255) {
                this.g = 255
            }
            if (this.b > 255) {
                this.b = 255
            }
            if (this.r < 0) {
                this.r = 0
            }
            if (this.g < 0) {
                this.g = 0
            }
            if (this.b < 0) {
                this.b = 0
            }
        }
        randomLight() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12) + 4)];
            }
            var color = new Color(hash, 55 + Math.random() * 200, 55 + Math.random() * 200, 55 + Math.random() * 200)
            return color;
        }
        randomDark() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12))];
            }
            var color = new Color(hash, Math.random() * 200, Math.random() * 200, Math.random() * 200)
            return color;
        }
        random() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 16))];
            }
            var color = new Color(hash, Math.random() * 255, Math.random() * 255, Math.random() * 255)
            return color;
        }
    }
    class Softbody { //buggy, spins in place
        constructor(x, y, radius, color, size, members = 10, memberLength = 5, force = 10, gravity = 0) {
            this.springs = []
            this.pin = new Circle(x, y, radius, color)
            this.points = []
            this.flop = 0
            let angle = 0
            this.size = size
            let line = new Line((Math.cos(angle) * size), (Math.sin(angle) * size), (Math.cos(angle + ((Math.PI * 2) / members)) * size), (Math.sin(angle + ((Math.PI * 2) / members)) * size))
            let distance = line.hypotenuse()
            for (let t = 0; t < members; t++) {
                let circ = new Circle(x + (Math.cos(angle) * size), y + (Math.sin(angle) * size), radius, color)
                circ.reflect = 1
                circ.bigbody = new Circle(x + (Math.cos(angle) * size), y + (Math.sin(angle) * size), distance, color)
                circ.draw()
                circ.touch = []
                this.points.push(circ)
                angle += ((Math.PI * 2) / members)
            }

            for (let t = 0; t < this.points.length; t++) {
                for (let k = 0; k < this.points.length; k++) {
                    if (t != k) {
                        if (this.points[k].bigbody.doesPerimeterTouch(this.points[t])) {
                            if (!this.points[k].touch.includes(t) && !this.points[t].touch.includes(k)) {
                                let spring = new SpringOP(this.points[k], this.points[t], (size * Math.PI) / members, 2, color)
                                this.points[k].touch.push(t)
                                this.points[t].touch.push(k)
                                this.springs.push(spring)
                                spring.beam.draw()
                            }
                        }
                    }
                }
            }

            console.log(this)

            // this.spring = new Spring(x, y, radius, color, this.pin, memberLength, gravity)
            // this.springs.push(this.spring)
            // for (let k = 0; k < members; k++) {
            //     this.spring = new Spring(x, y, radius, color, this.spring.anchor, memberLength, gravity)
            //     if (k < members - 1) {
            //         this.springs.push(this.spring)
            //     } else {
            //         this.spring.anchor = this.pin
            //         this.springs.push(this.spring)
            //     }
            // }
            this.forceConstant = force
            this.centroid = new Circle(0, 0, 10, "red")
        }
        circularize() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            this.angle = 0
            this.angleIncrement = (Math.PI * 2) / this.springs.length
            for (let t = 0; t < this.points.length; t++) {
                this.points[t].x = this.centroid.x + (Math.cos(this.angle) * this.forceConstant)
                this.points[t].y = this.centroid.y + (Math.sin(this.angle) * this.forceConstant)
                this.angle += this.angleIncrement
            }
        }
        balance() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.points.length; s++) {
                this.xpoint += (this.points[s].x / this.points.length)
                this.ypoint += (this.points[s].y / this.points.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            // this.centroid.x += TIP_engine.x / this.points.length
            // this.centroid.y += TIP_engine.y / this.points.length
            for (let s = 0; s < this.points.length; s++) {
                this.link = new LineOP(this.points[s], this.centroid, 0, "transparent")
                if (this.link.hypotenuse() != 0) {

                    if (this.size < this.link.hypotenuse()) {
                        this.points[s].xmom -= (Math.cos(this.link.angle()) * (this.link.hypotenuse())) * this.forceConstant * .1
                        this.points[s].ymom -= (Math.sin(this.link.angle()) * (this.link.hypotenuse())) * this.forceConstant * .1
                    } else {
                        this.points[s].xmom += (Math.cos(this.link.angle()) * (this.link.hypotenuse())) * this.forceConstant * .1
                        this.points[s].ymom += (Math.sin(this.link.angle()) * (this.link.hypotenuse())) * this.forceConstant * .1
                    }

                    // this.points[s].xmom += (((this.points[s].x - this.centroid.x) / (this.link.hypotenuse()))) * this.forceConstant
                    // this.points[s].ymom += (((this.points[s].y - this.centroid.y) / (this.link.hypotenuse()))) * this.forceConstant
                }
            }
            if (this.flop % 2 == 0) {
                for (let s = 0; s < this.springs.length; s++) {
                    this.springs[s].balance()
                }
            } else {
                for (let s = this.springs.length - 1; s >= 0; s--) {
                    this.springs[s].balance()
                }
            }
            for (let s = 0; s < this.points.length; s++) {
                this.points[s].move()
                this.points[s].draw()
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].draw()
            }
            this.centroid.draw()
        }
    }
    class Observer {
        constructor(x, y, radius, color, range = 100, rays = 10, angle = (Math.PI * .125)) {
            this.body = new Circle(x, y, radius, color)
            this.color = color
            this.ray = []
            this.rayrange = range
            this.globalangle = Math.PI
            this.gapangle = angle
            this.currentangle = 0
            this.obstacles = []
            this.raymake = rays
        }
        beam() {
            this.currentangle = this.gapangle / 2
            for (let k = 0; k < this.raymake; k++) {
                this.currentangle += (this.gapangle / Math.ceil(this.raymake / 2))
                let ray = new Circle(this.body.x, this.body.y, 1, "white", (((Math.cos(this.globalangle + this.currentangle)))), (((Math.sin(this.globalangle + this.currentangle)))))
                ray.collided = 0
                ray.lifespan = this.rayrange - 1
                this.ray.push(ray)
            }
            for (let f = 0; f < this.rayrange; f++) {
                for (let t = 0; t < this.ray.length; t++) {
                    if (this.ray[t].collided < 1) {
                        this.ray[t].move()
                        for (let q = 0; q < this.obstacles.length; q++) {
                            if (this.obstacles[q].isPointInside(this.ray[t])) {
                                this.ray[t].collided = 1
                            }
                        }
                    }
                }
            }
        }
        draw() {
            this.beam()
            this.body.draw()
            canvas_context.lineWidth = 1
            canvas_context.fillStyle = this.color
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath()
            canvas_context.moveTo(this.body.x, this.body.y)
            for (let y = 0; y < this.ray.length; y++) {
                canvas_context.lineTo(this.ray[y].x, this.ray[y].y)
                canvas_context.lineTo(this.body.x, this.body.y)
            }
            canvas_context.stroke()
            canvas_context.fill()
            this.ray = []
        }
    }
    let flash = 0
    function setUp(canvas_pass, style = "#000000") {
        canvas = canvas_pass
        canvas_context = canvas.getContext('2d');
        canvas.style.background = style
        window.setInterval(function () {
            main()
        }, 17)
        document.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;
        });
        document.addEventListener('keyup', (event) => {
            delete keysPressed[event.key];
        });
        window.addEventListener('pointerdown', e => {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine

            // example usage: if(object.isPointInside(TIP_engine)){ take action }
            root.x = TIP_engine.x
            root.y = TIP_engine.y
            // strike.targets.push(new Circle(TIP_engine.x, TIP_engine.y, 10, "white"))
            // example usage: if(object.isPointInside(TIP_engine)){ take action }
            window.addEventListener('pointermove', continued_stimuli);
            // flash = 1
            // strike.make()
            // tree.split()
            // gri.isPointInside(TIP_engine)

            // canvas_context.fillStyle = "#00000011"
            // canvas_context.clearRect(0, 0, canvas.width, canvas.height)  // refreshes the image
            // // gri.draw()
        });
        window.addEventListener('pointermove', continued_stimuli);

        window.addEventListener('pointerup', e => {
            // window.removeEventListener("pointermove", continued_stimuli);
        })
        function continued_stimuli(e) {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
            // let drop = new Droplet(TIP_engine.x, TIP_engine.y)
            // drop.bigbody.radius = 50
            // drop.bigbody.color = "#FF000044"

            // water[waterlength-1] = drop
            // gri.isPointInside(TIP_engine)

            // canvas_context.fillStyle = "#00000011"
            // canvas_context.fillRect(0, 0, canvas.width, canvas.height)  // refreshes the image
            // gri.draw()

        }
    }
    function gamepad_control(object, speed = 1) { // basic control for objects using the controler
        //         console.log(gamepadAPI.axesStatus[1]*gamepadAPI.axesStatus[0]) //debugging
        if (typeof object.body != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
                    object.body.x += (gamepadAPI.axesStatus[0] * speed)
                    object.body.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        } else if (typeof object != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
                    object.x += (gamepadAPI.axesStatus[0] * speed)
                    object.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        }
    }
    function control(object, speed = 1) { // basic control for objects
        if (typeof object.body != 'undefined') {
            if (keysPressed['w']) {
                object.body.y -= speed
            }
            if (keysPressed['d']) {
                object.body.x += speed
            }
            if (keysPressed['s']) {
                object.body.y += speed
            }
            if (keysPressed['a']) {
                object.body.x -= speed
            }
        } else if (typeof object != 'undefined') {
            if (keysPressed['w']) {
                object.ymom -= speed
            }
            if (keysPressed['d']) {
                object.xmom += speed
            }
            if (keysPressed['s']) {
                object.ymom += speed
            }
            if (keysPressed['a']) {
                object.xmom -= speed
            }
        }
    }
    function getRandomLightColor() { // random color that will be visible on  black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12) + 4)];
        }
        return color;
    }
    function getRandomColor() { // random color
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 2; i++) {
            color += letters[(Math.floor(Math.random() * 5) + 12)];
        }
        for (var i = 0; i < 2; i++) {
            color += letters[(Math.floor(Math.random() * 8) + 6)];
        }
        color += '00'
        return color;
    }
    function getRandomDarkColor() {// color that will be visible on a black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12))];
        }
        return color;
    }
    function castBetween(from, to, granularity = 10, radius = 1) { //creates a sort of beam hitbox between two points, with a granularity (number of members over distance), with a radius defined as well
        let limit = granularity
        let shape_array = []
        for (let t = 0; t < limit; t++) {
            let circ = new Circle((from.x * (t / limit)) + (to.x * ((limit - t) / limit)), (from.y * (t / limit)) + (to.y * ((limit - t) / limit)), radius, "red")
            circ.toRatio = t / limit
            circ.fromRatio = (limit - t) / limit
            shape_array.push(circ)
        }
        return (new Shape(shape_array))
    }

    let setup_canvas = document.getElementById('canvas') //getting canvas from document
    let pressure = document.getElementById('pressure') //getting canvas from document

    setUp(setup_canvas) // setting up canvas refrences, starting timer. 

    // object instantiation and creation happens here 

    class Gooblek {
        constructor(parts) {
            this.dots = []
            this.links = []
            let dis = 5
            let angle = 0
            for (let t = 0; t < parts; t++) {
                let dot = new Circle(350 + (Math.cos(angle) * dis), 350 + (Math.sin(angle) * dis), 4, "blue", 0, 0, 1, 1)
                dot.friction = .95
                dot.links = []
                this.dots.push(dot)
                angle += Math.PI / 10
                dis = 40
            }
            this.centroid = new Circle(350, 350, 2, "red")
        }
        draw() {
            this.centroid.x = 0
            this.centroid.y = 0

            for (let t = 0; t < this.dots.length; t++) {
                this.centroid.x += this.dots[t].x
                this.centroid.y += this.dots[t].y
            }
            this.centroid.x /= (this.dots.length)
            this.centroid.y /= (this.dots.length)

            for (let t = 0; t < this.dots.length; t++) {
                let xmom = (this.dots[t].x - this.centroid.x) * -1
                let ymom = (this.dots[t].y - this.centroid.y) * -1
                if (Math.abs(xmom) + Math.abs(ymom) > 1) {

                    let vec = new Vector(this.dots[t], xmom, ymom)
                    vec.normalize(2)
                    this.dots[t].xmom += vec.xmom//((Math.max(1, -500+(new LineOP(this.centroid, this.dots[t]).hypotenuse()))))
                    this.dots[t].ymom += vec.ymom//((Math.max(1, -500+(new LineOP(this.centroid, this.dots[t]).hypotenuse()))))
                }
            }
            for (let t = 0; t < this.dots.length; t++) {
                this.dots[t].frictiveMove()
                control(this.dots[t], 1.5)
            }

            for (let t = 0; t < this.dots.length; t++) {
                for (let k = 0; k < this.dots.length; k++) {
                    if (t != k) {
                        if (this.dots[t].doesPerimeterTouch(this.dots[k])) {
                            let link = new LineOP(this.dots[t], this.dots[k])
                            let dis = ((link.hypotenuse()) - (this.dots[t].radius + this.dots[k].radius))
                            let anf = link.angle()
                            this.dots[t].x += (Math.cos(anf) * dis) * 2
                            this.dots[t].y += (Math.sin(anf) * dis) * 2
                            this.dots[k].x -= (Math.cos(anf) * dis) * 2
                            this.dots[k].y -= (Math.sin(anf) * dis) * 2
                            this.dots[t].xmom += (Math.cos(anf) * dis) / 100
                            this.dots[t].ymom += (Math.sin(anf) * dis) / 100
                            this.dots[k].xmom -= (Math.cos(anf) * dis) / 100
                            this.dots[k].ymom -= (Math.sin(anf) * dis) / 100
                        }
                    }
                }
            }

            for (let t = 0; t < this.links.length; t++) {
                this.links[t].draw()
            }
            for (let t = 0; t < this.dots.length; t++) {
                this.dots[t].draw()
            }
            this.centroid.draw()


            for (let t = 0; t < this.dots.length; t++) {
                for (let k = 0; k < this.dots.length; k++) {
                    if (t != k) {
                        if (this.dots[t].doesPerimeterTouch(this.dots[k])) {
                            if (!this.dots[t].links.includes(k) && !this.dots[k].links.includes(t) && this.dots[t].links.length < 6 && this.dots[k].links.length < 6) {
                                let link = new SpringOP(this.dots[t], this.dots[k], 15, this.dots[t].radius, "#0000ff44")
                                this.links.push(link)
                                this.dots[t].links.push(k)
                                this.dots[k].links.push(t)
                            }
                        }
                    }
                }
            }
        }

    }


    let goo = new Gooblek(100)



    class Lightning {
        constructor(x, y) {
            this.x = x
            this.y = y
            this.eye = new Circle(x, y, 20, "#DDFFFF")
            this.body = new Circle(x, y, 2, "cyan", (Math.random() - .5), (Math.random() - .5))
            this.body.friction = .98
            this.points = []
            this.targets = [root]
            this.target = 0
            this.counter = 0
            this.segrange = 24
            this.seg = Math.random() * this.segrange
            this.life = 1000000000
        }
        make() {
            this.target = 0
            if (this.life > 0) {

                this.body = new Circle(this.x, this.y, 2, "cyan")
                this.points = []
                for (let t = 0; !this.body.doesPerimeterTouch(this.targets[this.targets.length - 1]) && this.life > 0; t++) {

                    // if (this.body.doesPerimeterTouch(this.targets[this.target])) {
                    //     this.target++
                    // }
                    this.target = this.targets.length - 1
                    this.counter++
                    if (this.life > 12) {
                        this.body.xmom *= 1.05
                        this.body.ymom *= 1.05
                    }
                    this.body.frictiveMove()
                    if (this.counter >= this.seg) {
                        this.life--
                        this.seg = Math.random() * this.segrange
                        this.counter = 0
                        let point = new Point(this.body.x, this.body.y)

                        this.points.push(point)
                        if (this.life < 10) {

                            let link = new LineOP(this.targets[this.target], this.body, "red", 1)
                            if (Math.random() < .5) {
                                let link = new LineOP(this.targets[this.target], this.body, "red", 1)
                                this.body.xmom = (this.targets[this.target].x - this.body.x) / (link.squareDistance() * 200)
                                this.body.ymom = (this.targets[this.target].y - this.body.y) / (link.squareDistance() * 200)
                            } else {
                                this.body.xmom += ((Math.random() - .5) / 2.7) + (this.targets[this.target].x - this.body.x) / (link.squareDistance() * 20)
                                this.body.ymom += ((Math.random() - .5) / 2.7) + (this.targets[this.target].y - this.body.y) / (link.squareDistance() * 20)
                                if (this.life == 3) {
                                    this.body.xmom *= 1.5
                                    this.body.ymom *= 1.5
                                }
                            }
                        } else {

                            if (Math.random() < .9) {
                                let link = new LineOP(this.targets[this.target], this.body, "red", 1)
                                this.body.xmom = (this.targets[this.target].x - this.body.x) / (link.squareDistance() * 3)
                                this.body.ymom = (this.targets[this.target].y - this.body.y) / (link.squareDistance() * 3)
                            } else {
                                let link = new LineOP(this.targets[this.target], this.body, "red", 1)
                                this.body.xmom += ((Math.random() - .5) / 20)
                                this.body.ymom += (Math.random() - .5) / 20
                            }
                        }

                        if (Math.random() < .001 || (Math.random() < this.life * .06 && this.life < 4) || (Math.random() < this.life * .10 && this.life <= 1)) {
                            let striker = new Lightning(point.x, point.y)
                            striker.life = 9
                            strikes.push(striker)
                            striker.points.push(point)
                        }
                    }
                    if (this.body.doesPerimeterTouch(this.targets[this.targets.length - 1])) {
                        this.targets = [new Point(TIP_engine.x, TIP_engine.y)]
                    }
                }
            }
        }
        draw() {
            // if (this.life > 100) {
            //     this.eye.draw()
            // }
            canvas_context.beginPath()
            if (this.points.length > 0) {
                let link = new Line(this.x, this.y, this.points[0].x, this.points[0].y, "#FF000088", 1)
                link.draw()
                for (let t = 1; t < this.points.length; t++) {
                    let link = new LineOP(this.points[t - 1], this.points[t], "#FF000088", 1)
                    link.draw()
                }
                canvas_context.stroke()
            }

        }

    }
    let strikes = []

    let root = new Circle(350, 600, 10, "white")
    let strike = new Lightning(640, 200)

    let gravity = .4


    class Droplet {
        constructor(x, y) {
            this.body = new Circle(x, y, 1, "blue")
            this.body.reflect = 1
            this.body.friction = 1//.99
            this.bigbody = new Circle(x, y, 7, "transparent")

            this.bigbody.color = "#00ffff20"
        }
        draw() {

            if (this !== water[waterlength - 1]) {
                this.body.ymom += gravity

                this.bigbody.radius = parseInt(pressure.value, 10)

                for (let t = 0; t < water.length; t++) {
                    if (this !== water[t] && t != waterlength - 1) {
                        if (this.bigbody.doesPerimeterTouch(water[t].bigbody)) {
                            // console.log("i")
                            let link = new LineOP(this.body, water[t].body)
                            let linkdis = link.hypotenuse()
                            let lang = link.angle()
                            if (linkdis == 0) {
                                linkdis = .0000001
                            }
                            this.body.xmom += (((linkdis) * (Math.cos(lang))) / linkdis) * 3
                            this.body.ymom += (((linkdis) * (Math.sin(lang))) / linkdis) * 3
                            water[t].body.xmom -= (((linkdis) * (Math.cos(lang))) / linkdis) * 3
                            water[t].body.ymom -= (((linkdis) * (Math.sin(lang))) / linkdis) * 3


                            // if(Math.random() < .5){
                            let xmomentumaverage = (this.body.xmom + water[t].body.xmom) / 2
                            let ymomentumaverage = (this.body.ymom + water[t].body.ymom) / 2
                            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
                            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
                            water[t].body.xmom = (water[t].body.xmom + xmomentumaverage) / 2
                            water[t].body.ymom = (water[t].body.ymom + ymomentumaverage) / 2
                            // }


                        }
                    }
                }


            } else {


                for (let t = 0; t < water.length; t++) {
                    if (this !== water[t]) {
                        if (this.bigbody.doesPerimeterTouch(water[t].bigbody)) {
                            // console.log("i")
                            let link = new LineOP(this.body, water[t].body)
                            let linkdis = link.hypotenuse()
                            let lang = link.angle()
                            if (linkdis == 0) {
                                linkdis = .0000001
                            }
                            this.body.xmom += (((linkdis) * (Math.cos(lang))) / linkdis) * 3
                            this.body.ymom += (((linkdis) * (Math.sin(lang))) / linkdis) * 3
                            water[t].body.xmom -= (((linkdis) * (Math.cos(lang))) / linkdis) * 10
                            water[t].body.ymom -= (((linkdis) * (Math.sin(lang))) / linkdis) * 10

                            // water[t].body.xmom -=( ((linkdis)*(Math.cos(link.angle()))))
                            // water[t].body.ymom -= (((linkdis)*(Math.sin(link.angle()))))

                            // if(Math.random() < .5){
                            // let xmomentumaverage = (this.body.xmom + water[t].body.xmom) / 2
                            // let ymomentumaverage = (this.body.ymom + water[t].body.ymom) / 2
                            // // this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
                            // // this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
                            // water[t].body.xmom = (water[t].body.xmom + xmomentumaverage) / 2
                            // water[t].body.ymom = (water[t].body.ymom + ymomentumaverage) / 2
                            // }


                        }
                    }
                }
            }


            if (this != arm.points[arm.points.length - 1]) {
                this.body.frictiveMove()

            }
            this.bigbody.x = this.body.x
            this.bigbody.y = this.body.y

            this.body.draw()
            this.bigbody.draw()

        }
    }

    let water = []
    let waterlength = 300

    for (let t = 0; t < waterlength; t++) {
        water.push(new Droplet(Math.random() * canvas.width, Math.random() * canvas.height))
    }

    class Arm {
        constructor() {
            this.ratespin = .01
            this.body = new Circle(350, 350, 5, "red")
            this.segs = 6
            this.points = [this.body]
            this.angles = []
            this.lengths = []
            this.links = []
            this.target = TIP_engine//new Circle(300, 300, 1, "red")
            this.lengths.push(1)
            for (let t = 0; t < this.segs; t++) {
                this.lengths.push(60)
                // this.lengths.push((Math.random() * 50) + 5)
            }
            for (let t = 0; t < this.segs + 1; t++) {
                this.angles.push(Math.random())
            }
            for (let t = 0; t < this.segs; t++) {
                // let point = new Circle(this.points[t].x + (this.lengths[t] * Math.cos(this.angles[t])), this.points[t].y + (this.lengths[t] * Math.sin(this.angles[t])), 3, "red")
                if (t == this.segs - 1) {
                    let point = new Droplet(this.points[t].x + (this.lengths[t] * Math.cos(this.angles[t])), this.points[t].y + (this.lengths[t] * Math.sin(this.angles[t])))
                    point.arm = 1
                    // point.color = "yellow"
                    // // point.bigbody =  new Circle(this.points[t].x + (this.lengths[t] * Math.cos(this.angles[t])), this.points[t].y + (this.lengths[t] * Math.sin(this.angles[t])), 20, "#FF000020")
                    water.push(point)
                    let link = new LineOP(point, this.points[t], "yellow", 2)
                    this.points.push(point)
                    this.links.push(link)
                } else {
                    let point = new Circle(this.points[t].x + (this.lengths[t] * Math.cos(this.angles[t])), this.points[t].y + (this.lengths[t] * Math.sin(this.angles[t])), 3, "red")
                    point.arm = 1
                    let link = new LineOP(point, this.points[t], "yellow", 2)
                    this.points.push(point)
                    this.links.push(link)
                }
            }
            this.checker = new LineOP(this.points[this.points.length - 1].body, TIP_engine)
        }
        draw() {

            for (let t = 0; t < water.length; t++) {
                if (this.points[this.points.length - 1] != water[t]) {
                    if (this.points[this.points.length - 1].body.doesPerimeterTouch(water[t].bigbody)) {
                        let link = new LineOP(this.points[this.points.length - 1].body, water[t].bigbody)
                        if (keysPressed['w']) {

                            water[t].body.xmom += (link.hypotenuse()) * (Math.cos(link.angle()))
                            water[t].body.ymom += (link.hypotenuse()) * (Math.sin(link.angle()))
                        } else {

                            water[t].body.xmom -= (link.hypotenuse()) * (Math.cos(link.angle())) / 3
                            water[t].body.ymom -= (link.hypotenuse()) * (Math.sin(link.angle())) / 3
                        }
                    }
                }
            }

            // this.target.draw()
            for (let t = 0; t < this.points.length; t++) {
                if (t > 0) {
                    this.points[t].y = this.points[t - 1].y + (this.lengths[t - 1] * Math.sin(this.angles[t - 1]))
                    this.points[t].x = this.points[t - 1].x + (this.lengths[t - 1] * Math.cos(this.angles[t - 1]))
                }
                if (t == this.points.length - 1) {
                    this.points[t].bigbody.radius = 50
                    this.points[t].body.radius = 50
                    this.points[t].bigbody.color = "#FF000020"
                    this.points[t].body.color = "#FFF00020"
                    // this.points[t].draw()
                } else {
                    this.points[t].draw()
                }
            }
            for (let t = 0; t < this.links.length; t++) {
                this.links[t].draw()
            }
            for (let k = 0; k < 50; k++) {
                for (let t = 0; t < this.points.length; t++) {
                    let check = this.checker.hypotenuse()
                    if (t > 0) {
                        if ((this.angles[t - 1] - this.angles[t]) < Math.PI) {
                            this.angles[t] += this.ratespin
                            this.normalize()
                            if (this.checker.hypotenuse() > check) {
                                this.angles[t] -= (this.ratespin * 2)
                            } else if (this.checker.hypotenuse() < check - 10) {
                                this.angles[t] += this.ratespin
                            }
                        } else {

                            this.angles[t] -= this.ratespin
                            this.normalize()
                            if (this.checker.hypotenuse() > check) {
                                this.angles[t] += this.ratespin
                            } else if (this.checker.hypotenuse() < check - 10) {
                                this.angles[t] += this.ratespin
                            }
                        }
                    } else {
                    }
                    this.angles[t] %= Math.PI * 2
                }
            }
        }
        normalize() {
            for (let t = 0; t < this.points.length; t++) {

                if (t == this.points.length - 1) {

                    if (t > 0) {
                        this.points[t].body.y = this.points[t - 1].y + (this.lengths[t - 1] * Math.sin(this.angles[t - 1]))
                        this.points[t].body.x = this.points[t - 1].x + (this.lengths[t - 1] * Math.cos(this.angles[t - 1]))
                        this.points[t].bigbody.y = this.points[t - 1].y + (this.lengths[t - 1] * Math.sin(this.angles[t - 1]))
                        this.points[t].bigbody.x = this.points[t - 1].x + (this.lengths[t - 1] * Math.cos(this.angles[t - 1]))
                        this.points[t].body.ymom = 0
                        this.points[t].body.xmom = 0
                        this.points[t].bigbody.ymom = 0
                        this.points[t].bigbody.xmom = 0
                    }
                } else {

                    if (t > 0) {
                        this.points[t].y = this.points[t - 1].y + (this.lengths[t - 1] * Math.sin(this.angles[t - 1]))
                        this.points[t].x = this.points[t - 1].x + (this.lengths[t - 1] * Math.cos(this.angles[t - 1]))
                    }
                }
            }
        }
    }


    let arm = new Arm()


    class Grain {
        constructor(x, y) {
            this.r = 0
            this.g = 0
            this.b = 0
            this.widthout = .75
            this.internalDampening = .95
            this.body = new Rectangle(x, y, 2, 2, `rgb(${this.r},${this.g},${this.b})`)
        }
        draw() {

            for (let t = 0; t < balls.length; t++) {
                if (this.body.doesPerimeterTouch(balls[t])) {
                    this.body.xforce = balls[t].xmom * 100
                    this.body.yforce = balls[t].ymom * 100
                    balls[t].x = balls[t].origin.x
                    balls[t].y = balls[t].origin.y
                }
            }
            this.body.xforce *= this.internalDampening
            this.body.yforce *= this.internalDampening
            if (this.body.xforce > 0) {
                this.r = this.body.xforce * 255
                this.g = 0
            } else {
                this.g = this.body.xforce * -255
                this.r = 0
            }
            this.b = this.body.yforce * 255
            this.body.color = `rgb(${this.r},${this.g},${this.b})`
            this.body.draw()
            if (this.body.xforce > 0) {
                if (this.t + 1 < grid.size) {
                    grid.grid[this.t + 1][this.k].body.xforce += (this.body.xforce / 2)
                    this.body.xforce *= .5
                    // if(Math.random()<.5){
                    if (this.k + 1 < grid.size) {
                        grid.grid[this.t + 1][this.k + 1].body.xforce += (this.body.xforce / (1 / (1 - this.widthout)))
                        this.body.xforce *= (this.widthout * 1.01)
                    }
                    // }else{
                    if (this.k - 1 > 0) {
                        grid.grid[this.t + 1][this.k - 1].body.xforce += (this.body.xforce / (1 / (1 - this.widthout)))
                        this.body.xforce *= (this.widthout * 1.01)
                    }
                    // }
                } else { this.body.xforce *= .5 }
            }
            if (this.body.xforce < 0) {
                if (this.t - 1 > 0) {
                    grid.grid[this.t - 1][this.k].body.xforce += (this.body.xforce / 2)
                    this.body.xforce *= .5
                    // if(Math.random()<.5){
                    if (this.k + 1 < grid.size) {
                        grid.grid[this.t - 1][this.k + 1].body.xforce += (this.body.xforce / (1 / (1 - this.widthout)))
                        this.body.xforce *= (this.widthout * 1.01)
                    }
                    // }else{
                    if (this.k - 1 > 0) {
                        grid.grid[this.t - 1][this.k - 1].body.xforce += (this.body.xforce / (1 / (1 - this.widthout)))
                        this.body.xforce *= (this.widthout * 1.01)
                    }
                    // }
                } else { this.body.xforce *= .5 }
            }
            if (this.body.yforce > 0) {
                if (this.k + 1 < grid.size) {
                    grid.grid[this.t][this.k + 1].body.yforce += (this.body.yforce / 2)
                    this.body.yforce *= .5
                    // if(Math.random()<.5){
                    if (this.t + 1 < grid.size) {
                        grid.grid[this.t + 1][this.k + 1].body.yforce += (this.body.yforce / (1 / (1 - this.widthout)))
                        this.body.yforce *= (this.widthout * 1.01)
                    }
                    // }else{
                    if (this.t - 1 > 0) {
                        grid.grid[this.t - 1][this.k + 1].body.yforce += (this.body.yforce / (1 / (1 - this.widthout)))
                        this.body.yforce *= (this.widthout * 1.01)
                    }
                    // }
                } else { this.body.yforce *= .5 }
            }
            if (this.body.yforce < 0) {
                if (this.k - 1 > 0) {
                    grid.grid[this.t][this.k - 1].body.yforce += (this.body.yforce / 2)
                    this.body.yforce *= .5
                    // if(Math.random()<.5){
                    if (this.t + 1 < grid.size) {
                        grid.grid[this.t + 1][this.k - 1].body.yforce += (this.body.yforce / (1 / (1 - this.widthout)))
                        this.body.yforce *= (this.widthout * 1.01)
                    }
                    // }else{
                    if (this.t - 1 > 0) {
                        grid.grid[this.t - 1][this.k - 1].body.yforce += (this.body.yforce / (1 / (1 - this.widthout)))
                        this.body.yforce *= (this.widthout * 1.01)
                    }
                    // }
                } else { this.body.yforce *= .5 }
            }
        }
    }

    class Grid {
        constructor(size) {
            this.size = size
            this.x = 200
            this.y = 200
            this.grid = []
            for (let t = 0; t < size; t++) {
                this.set = []
                for (let k = 0; k < size; k++) {
                    let grain = new Grain((this.x + (t * 2)), (this.y + (k * 2)))
                    grain.t = t
                    grain.k = k
                    this.set.push(grain)
                }
                this.grid.push(this.set)
            }
        }
        draw() {
            for (let t = 0; t < this.grid.length; t++) {
                for (let k = 0; k < this.grid[t].length; k++) {
                    this.grid[t][k].draw()
                }
            }
        }
    }

    let balls = []
    let ball = new Circle(100, 120, 3, "black", 5, 5)
    balls.push(ball)

    ball = new Circle(500, 220, 3, "black", -10, 0)
    balls.push(ball)

    ball = new Circle(500, 240, 3, "black", -10, 0)
    balls.push(ball)
    ball = new Circle(250, 100, 3, "black", 0, 10)
    balls.push(ball)

    let grid = new Grid(100)

    class Tree {
        constructor(sides, size, splits, color) {
            this.center = new Circle(350, 350, 2, color)
            this.points = []
            this.angle = 0
            this.dis = size
            this.color = color
            for (let t = 0; t < sides; t++) {
                let point = new Point(this.center.x + (Math.cos(this.angle) * this.dis), this.center.y + (Math.sin(this.angle) * this.dis))
                this.points.push(point)
                this.angle += (Math.PI / (sides / 2))
            }
            for (let t = 0; t < splits; t++) {
                this.split()
            }
        }
        draw() {
            this.center.draw()
            for (let t = 1; t < this.points.length; t++) {
                let line = new LineOP(this.points[t - 1], this.points[t], this.color, .5)
                line.draw()
            }
            let line = new LineOP(this.points[this.points.length - 1], this.points[0], this.color, .5)
            line.draw()
        }
        split() {
            let pointset = this.points.length
            for (let t = 1; t < this.points.length; t++) {
                let line = new LineOP(this.points[t - 1], this.points[t], this.color, .5)

                let point = line.midpoint()
                let angle = line.angle() + (Math.PI / 3)
                let pointmid = new Point(point.x + (Math.cos(angle) * (line.hypotenuse() * .33)), point.y + (Math.sin(angle) * (line.hypotenuse() * .33)))
                let pointy = new Point(point.x + (Math.cos(line.angle()) * (line.hypotenuse() * .33)), point.y + (Math.sin(line.angle()) * (line.hypotenuse() * .33)))
                let pointx = new Point(point.x - (Math.cos(line.angle()) * (line.hypotenuse() * .33)), point.y - (Math.sin(line.angle()) * (line.hypotenuse() * .33)))
                this.points.splice(t, 0, pointy)
                this.points.splice(t + 1, 0, pointmid)
                this.points.splice(t + 2, 0, pointx)
                t += 3
                // if(Math.random()<.53/this.points.length){
                //     break
                // }
            }

            let line = new LineOP(this.points[this.points.length - 1], this.points[0], this.color, .5)

            let point = line.midpoint()
            let angle = line.angle() + (Math.PI / 3)
            let pointmid = new Point(point.x + (Math.cos(angle) * (line.hypotenuse() * .33)), point.y + (Math.sin(angle) * (line.hypotenuse() * .33)))
            let pointy = new Point(point.x + (Math.cos(line.angle()) * (line.hypotenuse() * .33)), point.y + (Math.sin(line.angle()) * (line.hypotenuse() * .33)))
            let pointx = new Point(point.x - (Math.cos(line.angle()) * (line.hypotenuse() * .33)), point.y - (Math.sin(line.angle()) * (line.hypotenuse() * .33)))
            this.points.push(pointy)
            this.points.push(pointmid)
            this.points.push(pointx)
        }
    }

    class Plant {
        constructor(x, y) {
            this.root = new Point(x, y)
        }
    }
    class Quad {
        constructor(rect) {
            this.quads = []
            this.trees = []
            if (rect.width > 10) {
                for (let t = 0; t < 2; t++) {
                    let quat = []
                    for (let k = 0; k < 2; k++) {
                        let rectangle = new Rectangle(rect.x + ((rect.width * .5) * t), rect.y + ((rect.height * .5) * k), rect.width * .5, rect.height * .5, "transparent")
                        let quar = new Quad(rectangle)
                        quat.push(quar)
                    }
                    this.quads.push(quat)
                }
                this.quadcheck = rect
            } else {
                this.quadcheck = rect
                this.quads = rect
                this.quads.length = 0
            }
        }
        isPointInside(point) {
            if (this.quadcheck.isPointInside(point)) {
                this.quadcheck.color = "red"
                if (this.quads.length > 0) {
                    let wet = 0
                    for (let t = 0; t < 2; t++) {
                        for (let k = 0; k < 2; k++) {
                            if (this.quads[t][k].isPointInside(point)) {
                                this.trees.push(point.parent)
                                wet = 1
                                return true
                            }
                        }
                    }
                    if (wet == 0) {
                        return false
                    }
                } else {
                    if (this.quads.isPointInside(point)) {
                        this.trees.push(point.parent)
                        return true
                    }
                }
                return false
            } else {
                return false
            }
        }
        sparkCheck(point){
            if (this.quadcheck.isPointInside(point)) {
                this.quadcheck.color = "red"
                if (this.quads.length > 0) {
                    let wet = 0
                    for (let t = 0; t < 2; t++) {
                        for (let k = 0; k < 2; k++) {
                            if (this.quads[t][k].sparkCheck(point)) {
                                return true
                            }
                        }
                    }
                    //             // this.trees.push(point.parent)
                    //             wet = 1
                    //             // for(let t = 0;t<this.trees.length;t++){
            
                    //             //     // if (this.trees[t].body.isPointInside(point)) {
                    //             //     //     this.trees[t].flame = 1
                    //             //     //     return true
                    //             //     // }
                    //             // }
                    //             // return true
                    //         }
                    //     }
                    // }
                    // if (wet == 0) {
                    //     return false
                    // }
                } else {
                    for(let t = 0;t<this.trees.length;t++){

                        if (this.trees[t].body.doesPerimeterTouch(point)) {
                            this.trees[t].flame = 1
                            return true
                        }
                    }
                }
                return false
            } else {
                return false
            }
        }
        draw() {
            if (this.quadcheck.color == "red") {
                this.quadcheck.draw()
                this.quadcheck.color = "transparent"
                if (this.quads.length > 0) {
                    for (let t = 0; t < 2; t++) {
                        for (let k = 0; k < 2; k++) {
                            this.quads[t][k].draw()
                        }
                    }
                } else {
                    this.quadcheck.draw()
                }
            }
        }
    }



    let rec = new Rectangle(-2000,-2000, 4000, 4000, "gray")
    let gri = new Quad(rec, 0, 0, 0)
    class Trees{
        constructor(x,y,zise){
            this.body = new Rectangle(x,y,zise,zise,"green")
            this.body.parent = this
            this.flame = 0
            if(Math.random()<.01){
                // this.flame = 1
            }
            gri.isPointInside(this.body)
        }
        draw(){
            if(this.body.width < 1){
                return
            }
            this.body.draw()
            if(this.flame == 0){

            }else{
                if(Math.random()<(.001*this.flame)){
                    this.flame++
                }
                if(Math.random()<(.05*this.flame)){
                    fire.sparks.push(new Circle(this.body.x+(this.body.width*.5), this.body.y+(this.body.height*.5), 3, getRandomColor(), (Math.random()-.5)*.1, (Math.random()-.5)*.1))
                }
                for(let t = 0;t<this.flame;t++){
                    this.body.width*=.998
                    this.body.height*=.998
                }
            }
        }
    }

    let trees = []
    for(let t = 0;t<40000;t++){
        trees.push(new Trees((Math.random()-.5)*4000,(Math.random()-.5)*4000, (Math.random()*2)+5))
    }
    



    class Orbi{
        constructor(){
            this.angle = 0
            this.dis = 50
            this.colors = ['red', 'orange', 'yellow', '#00ff00', 'Cyan', 'Blue']
            this.body = new Circle(350,350, 10, "white")
            this.shots = []
            this.spawn = .01
        }
        draw(){
            if(Math.random()< this.spawn){
                let shot = new Circle(this.body.x - ((Math.random()-.5)*300), this.body.y - ((Math.random()-.5)*300), 8, this.colors[Math.floor(Math.random()*this.colors.length)])
                this.shots.push(shot)
            }
            this.body.draw()
            this.orbs = []
            if (keysPressed['w']) {
                this.body.y -= 2
            }
            if (keysPressed['d']) {
                this.body.x += 2
            }
            if (keysPressed['s']) {
                this.body.y += 2
            }
            if (keysPressed['a']) {
                this.body.x -= 2
            }
            if(keysPressed['l']){
                this.angle+=.01
            }
            if(keysPressed['j']){
                this.angle-=.01
            }
            for(let t = 0;t<this.colors.length;t++){
                let circ = new Circle(this.body.x+(this.dis*Math.cos(this.angle+(t*(Math.PI/3)))), this.body.y+(this.dis*Math.sin(this.angle+(t*(Math.PI/3)))), 10, this.colors[t])
                this.orbs.push(circ)
            }

            for(let k = 0;k<this.shots.length;k++){
                this.shots[k].xmom += (this.body.x-this.shots[k].x)/1000
                this.shots[k].ymom += (this.body.y-this.shots[k].y)/1000
                this.shots[k].xmom *=.97
                this.shots[k].ymom *=.97
                this.shots[k].move()
                this.shots[k].draw()
            }
            for(let k = 0;k<this.shots.length;k++){
                if(this.shots[k].marked == 1)[
                    this.shots.splice(k,1)
                ]
            }
            for(let t = 0;t<this.orbs.length;t++){
                this.orbs[t].draw()
                for(let k = 0;k<this.shots.length;k++){
                    if(this.orbs[t].doesPerimeterTouch(this.shots[k])){
                        if(this.shots[k].color == this.orbs[t].color){
                            this.shots[k]. marked = 1
                        }
                    }
                }
            }
        }
    }

    let orbi = new Orbi()
    // canvas_context.scale(.25,.25)
    // canvas_context.translate(1600,1600)
    class Fire{
        constructor(x,y){
            this.body = new Circle(x,y, 40, "blue")
            this.sparks = [this.body]
        }
        draw(){            
        // if (keysPressed['w']) {
        //     this.body.y -= 2
        // }
        // if (keysPressed['d']) {
        //     this.body.x += 2
        // }
        // if (keysPressed['s']) {
        //     this.body.y += 2
        // }
        // if (keysPressed['a']) {
        //     this.body.x -= 2
        // }
            this.body.draw()

            for(let t = 0;t<this.sparks.length;t++){
                if(this.sparks[t].marked == 1){
                    this.sparks.splice(t,1)
                }

            }
            for(let t = 0;t<this.sparks.length;t++){
                this.sparks[t].radius*=.97
                if(this.sparks[t].radius < .1){
                    this.sparks[t].marked = 1
                }

                if (keysPressed['w']) {
                    this.sparks[t].y -= 2
                }
                if (keysPressed['d']) {
                    this.sparks[t].x += 2
                }
                if (keysPressed['s']) {
                    this.sparks[t].y += 2
                }
                if (keysPressed['a']) {
                    this.sparks[t].x -= 2
                }
                this.sparks[t].move()
                this.sparks[t].draw()
                gri.sparkCheck(this.sparks[t])

            }

        }
    }
    let fire = new Fire(400,400)

    console.log(gri)

    var endPoint;
    let mode = "endPoint"

    //any point in 2D space
    class Vec2 {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    endPoint = new Vec2(400, 400);

    class Gridx{
        constructor(size){
            this.size = size
            this.grid = []
            this.steps = []
            for(let t = 0;t<size;t++){
                this.column = []
                for(let k = 0;k<size;k++){
                    let rectangle = new Rectangle(t*20, k*20, 20,20, "#000000")
                    rectangle.t = t
                    rectangle.k = k
                    this.column.push(rectangle)
                }
                this.grid.push(this.column)
            }
            this.grid[Math.floor(size*.5)][Math.floor(size*.5)].head = 1
            this.xdir = 0
            this.ydir = 0
            this.grid[Math.floor(size*.9)][Math.floor(size*.9)].food = 1
            this.length = 100
            this.diagonal = false
            this.food = this.grid[Math.floor(size*.9)][Math.floor(size*.9)]
            this.head =  this.grid[Math.floor(size*.5)][Math.floor(size*.5)]
            this.path = []
            this.dirtyNodes = []
            this.width = canvas.width
            this.height = canvas.height
            this.createGrid()
            // this.head.pather.search(this, this.head, this.food)
        }
        crash(){
            this.length = 3
            for(let t = 0;t<this.grid.length;t++){
                for(let k = 0;k<this.grid[t].length;k++){
                    this.grid[t][k].head = 0
                    this.grid[t][k].ate = 0
                    this.grid[t][k].tail = 0
                    // this.grid[t][k].head = 0
                }
            }
            this.grid[Math.floor(this.size*.5)][Math.floor(this.size*.5)].head = 1
            for(let t = 0;t<this.grid.length;t++){
                for(let k = 0;k<this.grid[t].length;k++){
                    this.grid[t][k].tail = 0
                }
            }
        }

        cleanDirty() {
            for (var i = 0; i < this.dirtyNodes.length; i++) {
                astar.cleanNode(this.dirtyNodes[i]);
            }
            this.dirtyNodes = [];
        }
        markDirty(node) {
            this.dirtyNodes.push(node);
        }
        neighbors(node) {

            var ret = [];
            var x = node.t;
            var y = node.k;
            var grid = this.grid;

            // West
            if (grid[x - 1] && grid[x - 1][y]) {
                ret.push(grid[x - 1][y]);
            }

            // East
            if (grid[x + 1] && grid[x + 1][y]) {
                ret.push(grid[x + 1][y]);
            }

            // South
            if (grid[x] && grid[x][y - 1]) {
                ret.push(grid[x][y - 1]);
            }

            // North
            if (grid[x] && grid[x][y + 1]) {
                ret.push(grid[x][y + 1]);
            }

            if (this.diagonal) {
                // Southwest
                if (grid[x - 1] && grid[x - 1][y - 1]) {
                    ret.push(grid[x - 1][y - 1]);
                }

                // Southeast
                if (grid[x + 1] && grid[x + 1][y - 1]) {
                    ret.push(grid[x + 1][y - 1]);
                }

                // Northwest
                if (grid[x - 1] && grid[x - 1][y + 1]) {
                    ret.push(grid[x - 1][y + 1]);
                }

                // Northeast
                if (grid[x + 1] && grid[x + 1][y + 1]) {
                    ret.push(grid[x + 1][y + 1]);
                }
            }

            return ret;
        }
        createGrid() {
            let NODESIZE = 20
            var tempNode;
            var countNodes = 0;
            let gridPointsByPos = []
            this.gridPoints = []
            for (var i = 0; i < this.width; i += NODESIZE) {
                gridPointsByPos[i] = [];
                for (var j = 0; j < this.height; j += NODESIZE) {
                    gridPointsByPos[i][j] = countNodes;
                    tempNode = new Rectangle(i, j, 20, 20, "tan", countNodes, NODESIZE, i, j, true);
                    tempNode.f = tempNode.getValueF();
                    this.gridPoints.push(tempNode);
                    countNodes++;
                }
            }
        }

        draw(){
            // //console.log(this.path)
            if(this.path.length > 1){
                if(this.path[1].t > this.head.t){
                    if(this.xdir != -1){
                    this.ydir = 0
                    this.xdir = 1
                }else{
                    this.ydir =  Math.sign(Math.random()-.5)
                    this.xdir =  0
                }
                }else if(this.path[1].k > this.head.k){
                    if(this.ydir != -1){
                    this.ydir = 1
                    this.xdir = 0
                }else{
                    this.ydir = 0
                    this.xdir =  Math.sign(Math.random()-.5)
                }
                }else if(this.path[1].t < this.head.t){
                    if(this.xdir != 1){
                    this.ydir = 0
                    this.xdir = -1
                }else{
                    this.ydir =  Math.sign(Math.random()-.5)
                    this.xdir =  0
                }
                }else if(this.path[1].k < this.head.k){
                        if(this.ydir != 1){
                            this.ydir = -1
                            this.xdir = 0
                        }else{
                            this.ydir = 0
                            this.xdir =  Math.sign(Math.random()-.5)
                        }
                }
            }
            // if(this.path.length > 1 && this.head){
            // // //this.xdir = -Math.sign(this.head.t-this.path[1].t)
            // // this.ydir = -Math.sign(this.head.k-this.path[1].k)
            // // if(this.head.t+this.xdir >= this.grid.length){
            // //     this.ydir = -Math.sign(this.head.k-this.path[1].k)
            // //     //this.xdir = 0
            // // }else if(this.head.t+this.xdir < 0){
            // //     this.ydir = 0
            // //     //this.xdir = -Math.sign(this.head.t-this.path[1].t)
            // // }else if(this.head.k+this.ydir >= this.grid.length){
            // //     this.ydir = 0
            // //     //this.xdir = -Math.sign(this.head.t-this.path[1].t)
            // // }else if(this.head.k+this.ydir < 0){
            // //     this.ydir = -Math.sign(this.head.k-this.path[1].k)
            // //     this.xdir = 0
            // // }
            // // }else if(this.grid[this.head.t+this.xdir][this.head.k+this.ydir].tail >= 1){
            //     let j = 0
            //     while(this.head.t+this.xdir >= this.grid.length    ||    this.head.t+this.xdir < 0   ||   this.head.k+this.ydir >= this.grid.length  ||  this.head.k+this.ydir < 0 ){
            //         j++
            //         if(j > 1000){
            //             break
            //         }
            //         // this.ydir = Math.sign(Math.random()-.5)
            //         // this.xdir = Math.sign(Math.random()-.5)

            //         //this.path = []
            //         // this.head.pather.search(this, this.head, this.food)
            //     }

            //     if(this.grid[this.head.t+this.xdir] ){
            //         let j = 0
            //         while(this.grid[this.head.t+this.xdir][this.head.k+this.ydir].tail >= 1){
            //             j++
            //             if(j > 1000){
            //                 break
            //             }
            //             // this.ydir = Math.sign(Math.random()-.5)
            //             // this.xdir = Math.sign(Math.random()-.5)
    
            //             //this.path = []
            //             // this.head.pather.search(this, this.head, this.food)
            //         }
            //     }
            // // }else{

            // }
            let j = 0
            while(this.head.t+this.xdir >= this.grid.length-1    ||    this.head.t+this.xdir < 1   ||   this.head.k+this.ydir >= this.grid.length-1  ||  this.head.k+this.ydir < 1 ){
                j++
                if(j > 1000){
                    break
                }
                if(Math.random()<.5){
                    // this.ydir = Math.sign(Math.random()-.5)
                    // this.xdir = 0
                }else{
                    // this.ydir = 0
                    // this.xdir = Math.sign(Math.random()-.5)
                }

                //this.path = []
                // this.head.pather.search(this, this.head, this.food)
            }

            if(Math.random()<1){
                this.path = []
                this.head.pather.search(this, this.head, this.food)

                let x = Math.floor(Math.random()*(this.size-2)*1)+1
                let y = Math.floor(Math.random()*(this.size-2)*1)+1

                if(this.food.tail > 0 || this.food.head > 0){
                    this.food.food = 0

                    this.food = this.grid[x][y]
                    // this.grid[x][y].food = 1

                    this.food.food = 1
                    while(this.food.tail > 0 || this.food.head > 0){
                        this.food.food = 0
    
                        this.food = this.grid[x][y]
                        // this.grid[x][y].food = 1
                        this.food.food = 1
                         x = Math.floor(Math.random()*(this.size-2)*1)+1
                         y = Math.floor(Math.random()*(this.size-2)*1)+1
                    }
                }
            }

            // if(this.head.t+this.xdir < this.size){
            //     if(this.head.k+this.ydir < this.size){
            //     let j = 0

            //     // console.log(this.grid, this.head)
            //     if(typeof this.grid[this.head.t+this.xdir][this.head.k+this.ydir] != 'undefined'){
            //         while(this.grid[this.head.t+this.xdir][this.head.k+this.ydir].tail >= 1){
            //             j++
            //             if(j > 1000){
            //                 break
            //             }
            //             if(Math.random()<.5){
            //                 // this.ydir = Math.sign(Math.random()-.5)
            //                 // this.xdir = 0
            //             }else{
            //                 // this.ydir = 0
            //                 // this.xdir = Math.sign(Math.random()-.5)
            //             }
            //             //this.path = []
            //             // this.head.pather.search(this, this.head, this.food)
            //         }
            //     }
            // }
            // }
            ////console.log(this.path)
            // if(keysPressed['w']){
            //     if(this.ydir != 1){
            //         // //////console.log('hitw2')
            //         this.ydir = -1
            //         this.xdir = 0
            //     }
            // }
            // if(keysPressed['s']){
            //     if(this.ydir != -1){
            //         // //////console.log('hits2')
            //         this.ydir = 1
            //         this.xdir = 0
            //     }
            // }
            // if(keysPressed['a']){
            //     //////console.log('hita')
            //     if(this.xdir != 1){
            //         // //////console.log('hit2')
            //         this.xdir = -1
            //         this.ydir = 0
            //     }
            // }
            // if(keysPressed['d']){
            //     //////console.log('hitd')
            //     if(this.xdir != -1){
            //         // //////console.log('hitd2')
            //         this.xdir = 1
            //         this.ydir = 0
            //     }
            // }
            //////console.log(this.xdir, this.ydir)

            this.headmove = 0
            for(let t = 0;t<this.grid.length;t++){
                for(let k = 0;k<this.grid[t].length;k++){
                    if(this.grid[t][k].head == 1 &&  this.headmove == 0){
                        this.headmove = 1
                        this.grid[t][k].color = "#FF0000"
                        let j = 0

                        while(this.head.t+this.xdir >= this.grid.length-1    ||    this.head.t+this.xdir < 1   ||   this.head.k+this.ydir >= this.grid.length-1  ||  this.head.k+this.ydir < 1 ){
                            if(j > 100000){
                                break
                            }
                            j++
                                if(Math.random()<.5){
                                    this.ydir = Math.sign(Math.random()-.5)
                                    this.xdir = 0
                                }else{
                                    this.ydir = 0
                                    this.xdir = Math.sign(Math.random()-.5)
                                }
                        }
                         j = 0
                         let q = 0

                        while(this.grid[t+this.xdir][k+this.ydir].tail > 1){
                            if(j > 100000){
                                break
                            }
                            j++
                            let q = 0
                            if(Math.random()<.5){
                                this.ydir = Math.sign(Math.random()-.5)
                                this.xdir = 0
                            }else{
                                this.ydir = 0
                                this.xdir = Math.sign(Math.random()-.5)
                            }
                            while(this.head.t+this.xdir >= this.grid.length-1    ||    this.head.t+this.xdir < 1   ||   this.head.k+this.ydir >= this.grid.length-1  ||  this.head.k+this.ydir < 1 ){
                                if(q > 100000){
                                    break
                                }
                                q++
                                if(Math.random()<.5){
                                    this.ydir = Math.sign(Math.random()-.5)
                                    this.xdir = 0
                                }else{
                                    this.ydir = 0
                                    this.xdir = Math.sign(Math.random()-.5)
                                }
                            }
                        }

                        

                         
                        if(t+this.xdir > this.grid[t].length){
                            console.log(this, '1')
                            // this.crash()
                        }else if(t+this.xdir < 0){
                            console.log(this, '2')
                            // this.crash()
                        }else if(k+this.ydir > this.grid[t].length){
                            console.log(this, '3')
                            // this.crash()
                        }else if(k+this.ydir < 0){
                            console.log(this, '4')
                            // this.crash()
                        }else if((t <= this.grid.length && k <= this.grid.length && t >= 0 && k >= 0) ){
                    
                            this.grid[t][k].tail = this.length
                            this.grid[t][k].head = 0
                            this.grid[t+this.xdir][k+this.ydir].head = 1
                            if(this.grid[t+this.xdir][k+this.ydir].tail > 1){
                                this.crash()
                            }else{
                                this.head = this.grid[t+this.xdir][k+this.ydir]
                                if(this.path.includes(this.head) && this.path.indexOf(this.head) > 0 ){
                                    this.path.splice((this.path.indexOf(this.head)),1)
                                }
                            }
                            if(this.food.tail > 0 || this.food.head > 0){
                                this.length++
                                this.grid[t+this.xdir][k+this.ydir].ate=1
                                this.grid[t+this.xdir][k+this.ydir].food=0
                                let x = Math.floor(Math.random()*(this.size-2)*1)+1
                                let y = Math.floor(Math.random()*(this.size-2)*1)+1

                                this.food.food = 0
                                this.food = this.grid[x][y]
                                this.grid[x][y].food = 1
                                while(this.food.tail > 0 || this.food.head > 0){
                                    this.food.food = 0
                                    this.food = this.grid[x][y]
                                    this.grid[x][y].food = 1
                                     x = Math.floor(Math.random()*(this.size-2)*1)+1
                                     y = Math.floor(Math.random()*(this.size-2)*1)+1
                                }
                                //this.path = []
                                // this.head.pather.search(this, this.head, this.food)
                            }
                        }else{

                            let j = 0

                            while(this.head.t+this.xdir >= this.grid.length-1    ||    this.head.t+this.xdir < 0  ||   this.head.k+this.ydir >= this.grid.length-1  ||  this.head.k+this.ydir < 0 ){
                                if(j > 100000){
                                    break
                                }
                                j++
                                    if(Math.random()<.5){
                                        this.ydir = Math.sign(Math.random()-.5)
                                        this.xdir = 0
                                    }else{
                                        this.ydir = 0
                                        this.xdir = Math.sign(Math.random()-.5)
                                    }
                            }
                             j = 0
                             let q = 0
    
                            while(this.grid[t+this.xdir][k+this.ydir].tail > 1){
                                if(j > 100000){
                                    break
                                }
                                j++
                                let q = 0
                                if(Math.random()<.5){
                                    this.ydir = Math.sign(Math.random()-.5)
                                    this.xdir = 0
                                }else{
                                    this.ydir = 0
                                    this.xdir = Math.sign(Math.random()-.5)
                                }
                                while(this.head.t+this.xdir >= this.grid.length-1    ||    this.head.t+this.xdir < 0  ||   this.head.k+this.ydir >= this.grid.length-1  ||  this.head.k+this.ydir < 0 ){
                                    if(q > 100000){
                                        break
                                    }
                                    q++
                                    if(Math.random()<.5){
                                        this.ydir = Math.sign(Math.random()-.5)
                                        this.xdir = 0
                                    }else{
                                        this.ydir = 0
                                        this.xdir = Math.sign(Math.random()-.5)
                                    }
                                }
                            }
    
                            

                            this.grid[t][k].tail = this.length
                            this.grid[t][k].head = 0
                            this.grid[t+this.xdir][k+this.ydir].head = 1
                            if(this.grid[t+this.xdir][k+this.ydir].tail > 1){
                                this.crash()
                            }else{
                                this.head = this.grid[t+this.xdir][k+this.ydir]
                                if(this.path.includes(this.head) && this.path.indexOf(this.head) > 0 ){
                                    this.path.splice((this.path.indexOf(this.head)),1)
                                }
                            }
                            if(this.grid[t+this.xdir][k+this.ydir].food == 1){
                                this.length++
                                this.grid[t+this.xdir][k+this.ydir].ate=1
                                this.grid[t+this.xdir][k+this.ydir].food=0
                                let x = Math.floor(Math.random()*(this.size-2)*1)+1
                                let y = Math.floor(Math.random()*(this.size-2)*1)+1

                                this.food.food = 0
                                this.food = this.grid[x][y]
                                this.grid[x][y].food = 1
                                while(this.grid[x][y].tail > 0 ){

                                    this.food.food = 0
                                    this.food = this.grid[x][y]
                                    this.grid[x][y].food = 1
                                     x = Math.floor(Math.random()*(this.size-2)*1)+1
                                     y = Math.floor(Math.random()*(this.size-2)*1)+1
                                }
                                //this.path = []
                                // this.head.pather.search(this, this.head, this.food)
                            }
                            console.log(this, '5')
                            // if(this.grid[t+this.xdir][k+this.ydir].tail >= 1){
                                // this.crash()
                            // }


                                
                        }


                    }else if(this.grid[t][k].food >= 1){
                        // this.head.pather.search(this, this.head, this.food)

                        if(this.grid[t][k].tail <= 1){
                            this.grid[t][k].color = "#000000"
                            this.grid[t][k].ate = 0
                        }
                        this.grid[t][k].color = "#FFFF00"
                        if(this.grid[t][k].color == "#00FFFF" ){
                            this.grid[t][k].color = "#000000"
                        }
                    }else if(this.grid[t][k].tail >= 1){
                        this.grid[t][k].color = "#0000ff"
                        this.grid[t][k].tail--
                        if(this.grid[t][k].color == "#00FFFF" && this.grid[t][k].tail <= 1){
                            this.grid[t][k].ate = 0
                            this.grid[t][k].color = "#000000"
                        }
                        if(this.grid[t][k].ate >= 1){
                            this.grid[t][k].color = "#00FFFF"
                            // if(this.grid[t][k].color == "cyan" && this.grid[t][k].tail <= 1){
                            //     this.grid[t][k].ate = 0
                            //     this.grid[t][k].color = "black"
                            // }

                        }
                        // if(this.grid[t][k].tail <= 1){
                        //     this.grid[t][k].color = "black"
                        //     this.grid[t][k].ate = 0
                        // }
                    }else{
                        this.grid[t][k].color = "#000000"
                        if(this.grid[t][k].color == "#00FFFF" ){
                            this.grid[t][k].color = "#000000"
                        }

                        if(this.grid[t][k].tail <= 1){
                            this.grid[t][k].color = "#000000"
                            this.grid[t][k].ate = 0
                        }
                    }
                    // if(this.path.includes(this.grid[t][k])){
                    //     this.grid[t][k].color = "red"
                    // }else{

                    //     this.grid[t][k].color = "black"
                    // }
                    this.grid[t][k].draw()
                    this.grid[t][k].food = 0
                    if(this.grid[t][k].tail > 0){

                        if(this.grid[t][k] == this.food){
                        let x = Math.floor(Math.random()*(this.size-2)*1)+1
                        let y = Math.floor(Math.random()*(this.size-2)*1)+1

                        this.food.food = 0
                        this.food = this.grid[x][y]
                        this.grid[x][y].food = 1
                        while(this.food.tail > 0 || this.food.head > 0){

                            this.food.food = 0
                            this.food = this.grid[x][y]
                            this.grid[x][y].food = 1
                             x = Math.floor(Math.random()*(this.size-2)*1)+1
                             y = Math.floor(Math.random()*(this.size-2)*1)+1
                        }
                    }

                    if(this.grid[t][k] == this.food){
                        this.grid[t][k].food = 1
                        this.grid[t][k].tail = 0
                    }else{
                        this.grid[t][k].food = 0
                    }
                    }else{

                        if(this.grid[t][k] == this.food){
                            this.grid[t][k].food = 1
                            this.grid[t][k].tail = 0
                        }else{
                            this.grid[t][k].food = 0
                        }
                    }
                }
            }
        }
    }

    let gridx = new Gridx(40)

    class Branch {
        constructor(brick){
            this.brick = new Rectanglex(brick.x, brick.y, brick.width, brick.height, "red")
        }
        draw(){
            this.brick.draw()
        }
    }

    class Grower {
        constructor(seed){
            this.seed = seed
            this.endpoints = [seed, gridx.grid[10][15], gridx.grid[30][20], gridx.grid[12][11], gridx.grid[27][10]]
            this.bows = []
            for(let t = 0;t<this.endpoints.length;t++){
                this.seed.pather.search(gridx, this.seed,this.endpoints[t])
                if(t > 0){
                    this.bows.push(this.seed.pather.search(gridx, this.seed,this.endpoints[t]))
                }
            }
            this.body = []
            for(let t = 0;t<this.bows.length;t++){
                for(let k = 0;k<this.bows[t].length;k++){
                    if(!this.body.includes(this.bows[t][k])){
                        this.body.push(this.bows[t][k])
                    }
                }
            }
            this.trunk = []
            for(let t = 0;t<this.body.length;t++){
                    this.trunk.push(new Branch(this.body[t]))
            }
        }
        draw(){
            console.log(this)
            for(let t = 0;t<this.trunk.length;t++){
                this.trunk[t].draw()
            }
        }
    }

    let grow = new Grower(gridx.grid[20][39])
    
    class Ribbon{
        constructor(){
            this.body = new Circle(100,400, 10, "white")
            this.springs = []
            this.end = new Point(600, 790)
            this.start = new Point(600, 10)
            this.dots = castBetween(this.end, this.start, 200, 3)
            this.springs = []
            for(let t = 1;t<this.dots.shapes.length;t++){
                let spring = new SpringOP(this.dots.shapes[t-1], this.dots.shapes[t], 3.2, 10, "red")
                this.springs.push(spring)
            }
        }
        draw(){
            
            if (keysPressed['w']) {
                this.body.y -= 2
            }
            if (keysPressed['d']) {
                this.body.x += 2
            }
            if (keysPressed['s']) {
                this.body.y += 2
            }
            if (keysPressed['a']) {
                this.body.x -= 2
            }
            for(let t = 0;t<this.springs.length;t++){
                // console.log(this.springs)
                if(this.springs[t].marked != 1){
                    this.springs[t].balance()
                }
            }
            this.dots.shapes[0].xmom = 0
            this.dots.shapes[0].ymom = 0
            this.dots.shapes[this.dots.shapes.length-1].xmom = 0
            this.dots.shapes[this.dots.shapes.length-1].ymom = 0
            for(let t = 1;t<this.dots.shapes.length-1;t++){
                this.dots.shapes[t].move()
            }
            this.dots.shapes[0].xmom = 0
            this.dots.shapes[0].ymom = 0
            this.dots.shapes[this.dots.shapes.length-1].xmom = 0
            this.dots.shapes[this.dots.shapes.length-1].ymom = 0
            this.dots.draw()
            for(let t = 0;t<this.springs.length;t++){
                if(this.springs[t].marked != 1){
                let link = new LineOP(this.springs[t].anchor, this.springs[t].body, "Red", 10)
                link.draw()
                }
            }
            for(let t = 0;t<this.springs.length;t++){
                if(this.springs[t].body.doesPerimeterTouch(this.body)){
                    this.springs[t].body.xmom += .5
                    for(let k = 0;k<this.springs.length;k++){
                        this.springs[k].body.xmom += .5*(Math.random()-.5)
                        this.springs[k].anchor.xmom += .5*(Math.random()-.5)
                    }
                    if(this.springs[t].marked != 1){
                    this.springs[t].marked += .2
                    }
                }else if(this.springs[t].anchor.doesPerimeterTouch(this.body)){
                    this.springs[t].body.anchor += .5

                    for(let k = 0;k<this.springs.length;k++){
                        this.springs[k].body.xmom += .5*(Math.random()-.5)
                        this.springs[k].anchor.xmom += .5*(Math.random()-.5)
                    }
                    if(this.springs[t].marked != 1){
                    this.springs[t].marked += .2
                    }
                }
            }
            this.body.draw()
        }
    }

    let ribn = new Ribbon()

    function main() {
        // canvas_context.fillStyle = "#000000"
        gamepadAPI.update() //checks for button presses/stick movement on the connected controller)
        //     // // game code goes here
        // let tree = new Tree(Math.round((Math.random()*5)+1), Math.random()*200, (Math.random()*4)+2, getRandomColor())

        canvas_context.clearRect(-10000, -10000, canvas.width*1000, canvas.height*1000)  // refreshes the image
        // // let tree = new Tree(20, 200, 6, "red")
        // // orbi.draw()
        // // gri.isPointInside(orbi.body)
        ribn.draw()
        // // tree.draw()
        // gridx.draw()
        // for(let t= 0;t<trees.length;t++){
        //     trees[t].draw()
        // grow.draw()
        // }
        // fire.draw()

        //     // // goo.draw()
            // grid.draw()
        //     // // strike.draw()
        //     // // for(let t = 0;t<strikes.length;t++){
        //     // //     strikes[t].draw()
        //     // // }
        //     // for(let t = 0;t<water.length;t++){
        //     //     water[t].draw()
        //     // }
        //     // arm.draw()

        //     for(let t = 0;t<balls.length;t++){

        //         balls[t].move()
        //         balls[t].draw()
        // }
    }

    function getDistance(nodeA, nodeB) {
        // return distancetable[`${nodeA.x},${nodeB.y},${nodeA.x},${nodeB.y}`]
        var distX = Math.abs(nodeA.x - nodeB.x);
        var distY = Math.abs(nodeA.y - nodeB.y);

        if (distX > distY) {
            return ((1.4 * distY) + ((distX - distY)))

        }
        return (1.4 * distX + ((distY - distX)));
    }
})
