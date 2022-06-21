/**
 *
 */
function MiscObjects () {
	
}

//extending existing phaser classes




//radial mask for any sprite
function RadialBacking(_game, _spriteTop, _spriteBot, _time){
	this.game = _game;
	//the sprite that is filling up (in the case of the trivia one it looks like the dark sprite)
	this.spriteTop = _spriteTop;
	//the sprite that is behind
	this.spriteBot = _spriteBot;
	this.maskCanvas = this.game.add.graphics(0,0);
	//orient which way is 0, defaults to the right
	this.maskCanvas.angle = -90;
	this.spriteTop.parent.add(this.maskCanvas);
	//the diagonal is the max distance it needs to be
	this.drawRadius = Phaser.Math.distance(this.spriteTop.centerX, this.spriteTop.centerY, this.spriteTop.left, this.spriteTop.top);
	//how big each slice gets before it adds/subtracts one. I guess technically a larger slice is more efficient but PI/8 seems good.
	this.sliceAngle = Math.PI/8;
	this.maskCanvas.beginFill(0xff0000, 0.5);
	this.fillRadians = 0;

	this.sliceStack = [];
	
	this.time = _time;
	this.currentTime = 0;
	this.fillToTheta(this.fillRadians);

	//test it out
//	var fillOrder= [0.85, 0.1, 0.85, 0.1, 0.5, 1];
//	this.game.input.onDown.add(function(){
//		this.fillToTheta(fillOrder.shift());
//	}, this);
	
	
}

RadialBacking.prototype.play = function(){
	this.fillToTheta(1);
};

RadialBacking.prototype.pause = function(){
	
	this.fillTween.stop();
	console.log(this.currentTime);
};


//returns the tween so you can do something onComplete or whatever
RadialBacking.prototype.fillToTheta = function(targetTheta, customTime){
	
	var drawSlice = function(startAngle, endAngle){
		var center = new Phaser.Point(this.spriteTop.centerX, this.spriteTop.centerY);
		var v1 = new Phaser.Point(Math.cos(startAngle)*this.drawRadius, Math.sin(startAngle)*this.drawRadius);
		var v2 = new Phaser.Point(Math.cos(endAngle)*this.drawRadius, Math.sin(endAngle)*this.drawRadius);
		var newPoly = new Phaser.Polygon(center, v1, v2);
		newPoly.startAngle = startAngle;
		newPoly.endAngle = endAngle;
		return newPoly;
	};
	var targetRadians = Phaser.Math.linear(0, Math.PI*2, targetTheta);
	
	
	var lastStart = this.sliceStack.length==0?0:this.sliceStack[this.sliceStack.length-1].endAngle;
	
	var dummy = {value: this.fillRadians};
	if(this.fillTween){
		this.fillTween.stop();
	}
	var updateMask = function(_radians){
		this.fillRadians = _radians;
		this.maskCanvas.clear();
		this.maskCanvas.beginFill(0xff0000, 0.5);
		var newPolygon = drawSlice.call(this, lastStart, this.fillRadians);
		this.maskCanvas.drawShape(newPolygon);
		
		//first draw all existing polygons
		this.sliceStack.forEach(function(poly){
			this.maskCanvas.beginFill(0x00ff00, 0.5);
			this.maskCanvas.drawShape(poly);
		}, this);
		
		//then decide if we need to add a new one or remove one
		if(this.fillRadians - lastStart> (this.sliceAngle)){
			this.sliceStack.push(newPolygon);
			lastStart = this.fillRadians;
		}else if(this.fillRadians - lastStart< 0){
			
			lastStart = this.sliceStack.length==0?0:this.sliceStack[this.sliceStack.length-1].startAngle;
			this.sliceStack.pop();
			
		}
		
		var fillPercent = this.fillRadians/(Math.PI*2);
		this.currentTime = Phaser.Math.linear(0, this.time, fillPercent);
		
		this.spriteTop.mask = this.maskCanvas;
	};
	
	var speed = customTime == undefined? Phaser.Math.linear(0, this.time, (this.time-this.currentTime)/this.time): customTime;
	this.fillTween = this.game.add.tween(dummy).to({value: targetRadians}, speed, Phaser.Easing.Sinusoidal.InOut, true);

	this.fillTween.onUpdateCallback(function(){
		updateMask.call(this, dummy.value);
	}, this);
	this.fillTween.onComplete.add(function(){
		updateMask.call(this, dummy.value);
	}, this);
	
	return this.fillTween;
};


//General fill meter

function FillMeter(_game, _fillSprite){
	this.game = _game;
	this.fillSprite = _fillSprite;
	this.customUpdate = new Phaser.Signal();
	this.fillMask = this.game.add.graphics(0,0);
	
	this.fillSprite.parent.add(this.fillMask);
	this.fillBounds = new Phaser.Rectangle().copyFrom(this.fillSprite);
	this.fillBounds.centerOn(this.fillSprite.centerX, this.fillSprite.centerY);
	this.fillMask.beginFill(0xff0000);
	
	this.fillRect = new Phaser.Rectangle(this.fillBounds.left, this.fillBounds.top, 0, this.fillBounds.height);
	
	this.fillMask.drawShape(this.fillBounds);
	//thetas/second
	//i.e. 0.5 = it takes 1 second to fill half way
	this.fillSpeed = 0.5;
	
	this.fillTheta = 0;
	
	this.fillByTheta(this.fillTheta);
	
}

FillMeter.prototype.fillByTheta = function(targetTheta, doAnimate){
	doAnimate = doAnimate==undefined?true:doAnimate;
	if (typeof targetTheta === 'string' || targetTheta instanceof String){
		targetTheta = this.fillTheta + parseFloat(targetTheta);
	}
	
	if(this.fillTween){
		this.fillTween.stop();
	}
	
	var dummy = {value: this.fillTheta};
	var speed = doAnimate?Math.abs(targetTheta - this.fillTheta)/ this.fillSpeed:0;
	this.fillTheta = targetTheta;
	speed*=1000;
		
	var updateFillRect = function(theta){
		this.fillRect.width = Phaser.Math.linear(0, this.fillBounds.width, dummy.value);
		this.fillMask.clear();
		this.fillMask.beginFill(0);
		this.fillMask.drawShape(this.fillRect);
		this.fillSprite.mask = this.fillMask;
		this.customUpdate.dispatch(theta);
	};
	
	
	
	if(speed>0){
		this.fillTween = this.game.add.tween(dummy).to({value: targetTheta}, speed, Phaser.Easing.Sinusoidal.InOut, true);

		this.fillTween.onUpdateCallback(function(){
			updateFillRect.call(this, dummy.value);
			
		}, this);
		this.fillTween.onComplete.add(function(){
			updateFillRect.call(this, dummy.value);
		}, this);
	}else{
		dummy.value = targetTheta;
		updateFillRect.call(this, dummy.value);
	}
	return this.fillTween;
};



//Inactivity Timer

function InactivityTimerManager(aGame, delay, removeCondition, removeConditionContext){
	this.delay = delay;
	this.game = aGame;
	this.removeCondition = removeCondition;
	this.removeConditionContext = removeConditionContext;
	this.onInactivity = new Phaser.Signal();
	this.onReset = new Phaser.Signal();
	this.isRunning = false;
	this.data = {};
	this.createNewInactivityEvent();
}

InactivityTimerManager.prototype.resetInactivityTimer = function(data){
	console.log("Inactivity Timer Manager: resetting...");
	if(this.isRunning){
		this.onReset.dispatch(data);
	}
	this.isRunning = false;
	
	this.removeInactivityTimer();
	this.createNewInactivityEvent();
};

InactivityTimerManager.prototype.createNewInactivityEvent = function(){

	this.inactivityTimingEvent = this.game.time.events.add(this.delay, function(){
		if(this.removeCondition.call(this.removeConditionContext)){
			console.log("Inactivity Timer Manager: destroying...");
			return;
		}
		if(this.isRunning){
			console.log("Inactivity Timer Manager already running: returning...");
			return;
		}
		console.log("Inactivity Timer Manager: firing...");
		this.isRunning = true;
		this.onInactivity.dispatch();
	}, this);
};

InactivityTimerManager.prototype.manualFire = function(data){
	if(this.isRunning){
		this.removeInactivityTimer();
	}
	this.isRunning = true;
	this.onInactivity.dispatch(data);
};
InactivityTimerManager.prototype.removeInactivityTimer = function(){
	if(this.isRunning){
		this.onReset.dispatch();
	}
	this.isRunning = false;
	
	this.game.time.events.remove(this.inactivityTimingEvent);
};



//BG GRID
//useful for a general background grid, and can be rendered at an angle as well!
function gridSquare(row, col, worldPos){
	this.row = row;
	this.col = col;
	this.worldPos = worldPos;
	this.empty = true;
	this.cost = 1;

}
function BGGrid(game, sprite, origin, angle, length1, length2, precision, gridAngle){
	
	if(angle%90==0){
		console.error("ANGLE CANNOT BE STRAIT, for this is based around a tilted perspective grid\nif you want a strait" +
				"up and down grid, make the angle 45, and then the grid angle -45 (tilt, then untilt basically)");
		return false;
	}
	
	this.game = game;
	this.origin = origin;
	
	this.precision = precision;
	this.length1 = length1/this.precision;
	this.length2 = length2/this.precision;
	this.angle = angle;
	this.gridAngle = gridAngle==undefined?0:gridAngle;
	this.radian = Util.toRadians(this.angle);
	this.sprite = sprite;
	this.parent = this.sprite.parent;
	this.dc = this.game.add.graphics(0,0);
	this.dc.alpha = 0;
	sprite.parent.add(this.dc);
	this.dc.position.setTo(0,0);
	this.dc.lineStyle(5, 0xff0000, 1);
	this.dc.beginFill(Util.vibesColor(), 0.2);
	
	this.bounds = new Phaser.Rectangle().copyFrom(this.sprite);
	this.bounds.centerOn(this.sprite.centerX, this.sprite.centerY);
	//recursively Generate
	//breadth first
	
	this.gridSquares = new Map();
	
	this.dc.drawCircle(this.origin.x, this.origin.y, 20);
	
	var q = [];
	var explored= new Set();
	explored.add(Util.cantorPairSigned(0,0));
	q.push(new GridSquare(0,0, origin));
	//renders grid as long as it remains in the bounds of the grid (set by the sprite)
	
	var generateGridPoly = function(x, y){
		var topMidPoint = new Phaser.Line(x, y, x, y+ this.length1/2).rotateAround(x, y, this.radian + Math.PI/2).end;
		var botMidPoint = new Phaser.Line(x, y, x, y+ this.length1/2).rotateAround(x, y, this.radian + Math.PI/2 + Math.PI).end;
		var topLine = new Phaser.Line(0,0, 0, this.length2).rotateAround(0,0, -this.radian+ Math.PI/2);
		var botLine = topLine.clone();
		topLine.centerOn(topMidPoint.x, topMidPoint.y);
		botLine.centerOn(botMidPoint.x, botMidPoint.y);
		var points = [topLine.end, topLine.start, botLine.start, botLine.end];
		return new Phaser.Polygon(points);
	};
	
	while (q.length>0){
		var v = q.shift();
		
		this.gridSquares.set(Util.cantorPairSigned(v.row, v.col), v);
		var w = Math.cos(this.radian) * this.length1;
		var h = Math.sin(this.radian)* this.length2;
		
		var newPoly = generateGridPoly.call(this, v.worldPos.x, v.worldPos.y);
		var polygonPoints = newPoly.points;
		for(var i = 0; i<polygonPoints.length; i++){
			polygonPoints[i] = polygonPoints[i].rotate(v.worldPos.x, v.worldPos.y, this.gridAngle, true);
		}
		v.polygonShape = newPoly;
		//v.sideLength = this.diagonalLength;
		this.dc.lineStyle(5, 0x000000, 1);
		this.dc.drawShape(v.polygonShape);

		for(var col = -1; col<2; col++){
			for(var row = -1; row<2; row++){
				if(row + col == -1 || row+col == 1){
					var coordToCheck = {row: v.row + row, col: v.col + col};
					if(!explored.has(Util.cantorPairSigned(coordToCheck.row, coordToCheck.col))){
						explored.add(Util.cantorPairSigned(coordToCheck.row, coordToCheck.col));
						
						var colOffset = new Phaser.Line().fromAngle(this.origin.x, this.origin.y, this.radian, this.length1*coordToCheck.col);
						var rowOffset = new Phaser.Line().fromAngle(colOffset.end.x, colOffset.end.y, -this.radian, this.length2*coordToCheck.row);

						var newWorldPos = new Phaser.Point(rowOffset.end.x, rowOffset.end.y);
						newWorldPos = newWorldPos.rotate(this.origin.x, this.origin.y, this.gridAngle, true);
						var newGridSquare = new GridSquare(coordToCheck.row, coordToCheck.col, newWorldPos);
						if(this.pointOnBG(newGridSquare.worldPos)){
							var coordText = this.game.add.text(newWorldPos.x, newWorldPos.y, (newGridSquare.row + "," +newGridSquare.col));
							coordText.alpha = this.dc.alpha;
							coordText.anchor.setTo(0.5);
							q.push(newGridSquare);
						}
						
						
					}
				}
				
			}
		}
			
	}
	
	//this is lazy but I am tired
	var refPoints = this.getSquare(0,0).polygonShape.points;

	this.crossAngle1 = Phaser.Math.angleBetween(refPoints[0].x, refPoints[0].y, refPoints[1].x, refPoints[1].y);
	this.crossAngle2 = Phaser.Math.angleBetween(refPoints[2].x, refPoints[2].y, refPoints[1].x, refPoints[1].y);
	var visualCross1 = new Phaser.Line().fromAngle(this.origin.x, this.origin.y, this.crossAngle1, 100);
	var visualCross2 = new Phaser.Line().fromAngle(this.origin.x, this.origin.y, this.crossAngle2, 100);
	
	this.dc.lineStyle(10, 0xff00ff);
	this.dc.moveTo(visualCross1.start.x, visualCross1.start.y);
	
	this.dc.lineTo(visualCross1.end.x, visualCross1.end.y);
	this.dc.lineStyle(10, 0x0000ff);
	this.dc.moveTo(visualCross2.start.x, visualCross2.start.y);
	
	this.dc.lineTo(visualCross2.end.x, visualCross2.end.y);
};

BGGrid.prototype.intersectsEdge = function(line){
	for(var bound in this.bounds){
		var result = new Phaser.Point();
		if(Phaser.Line.intersects(line, this.bounds[bound], true, result)!=null){
			return result;
		}
	}
	return false;
};

BGGrid.prototype.getSquare = function(row, col){
	return this.gridSquares.get(Util.cantorPairSigned(row, col));
};

BGGrid.prototype.renderPath = function(canvas, path){
	
	canvas.moveTo(path[0].worldPos.x, path[0].worldPos.y);
	var i = 0;
	path.forEach(function(square){
		canvas.lineStyle(10, Util.vibesColor());
		if(i!=0){
			canvas.lineTo(square.worldPos.x, square.worldPos.y);
		}
		i++;
	}, this);
};

BGGrid.prototype.cost = function(startSquare, toSquare){
	return toSquare.cost;
};
BGGrid.prototype.getAStarPath = function(startSquare, endSquare){
	var frontier = new PriorityQueue();
	var frontierSet = new Set();

	var debugText = function(text, square){
		var t = this.game.add.text(0,0,text);
		t.anchor.setTo(0.5);
		this.scene.f_tilesParent.add(t);
		t.position.setTo(square.position.x, square.position.y);
		return t;
	}.bind(this);
	var addToOpenSet = function(square, priority){
		if(!square){

		}
		frontier.enqueue(square, priority);
		frontierSet.add(square.id);
	}.bind(this);
	var getMinOpenSet = function(){
		var chosen = frontier.dequeue();
		frontierSet['delete'](chosen.element.id);
		return chosen;
	}.bind(this);

	var D = 1;
	var D2 = 1;

	var heuristic = function(currentSquare){
		var dx = Math.abs(currentSquare.position.x - endSquare.position.x);
	    var dy = Math.abs(currentSquare.position.y - endSquare.position.y);
	    return D * (dx + dy);
	};


	addToOpenSet(startSquare, 0);

	var came_from = new Map();
	//gscore
	var cost_so_far = new Map();
	came_from.set(startSquare, null);
	cost_so_far.set(startSquare.id, 0);


	while(frontier.items.length> 0){
		var current = getMinOpenSet().element;
		
		if(current.row == endSquare.row && current.col == endSquare.col){
			var prev = came_from.get(endSquare);
			var path = [endSquare];
			while(prev){
				
				if(prev){
					path.push(prev);
				}
				prev = came_from.get(prev);
				
			}
			
			path = path.reverse();
			return path;
		}

	   for(var col = -1; col<2; col++){
			for(var row = -1; row<2; row++){
				if(Math.abs(row + col) == 1){
					
					var nextCoordToCheck = {row: current.row + row, col: current.col + col};
					var next = this.gridSquares.get(Util.cantorPairSigned(nextCoordToCheck.row, nextCoordToCheck.col));
					if(!next){
						continue;
					}
					var newCost = cost_so_far.get(current) + this.cost(current, next);
					
					if(newCost<(cost_so_far.get(next.id)==undefined?Infinity:cost_so_far.get(next.id))){
						
						cost_so_far.set(next.id, newCost);
						var priority = newCost + heuristic.call(this, next);
						came_from.set(next, current);
						if(!frontierSet.has(Util.cantorPairSigned(next.row, next.col))){
							
							addToOpenSet(next, priority);
						}

					}
					

				}
			}
		}
	}

	return false;
};




//this took so mf long to make:((((
//I love the cross product so much <3
BGGrid.prototype.worldPosToSquare = function(x, y){
	
	var lineToOrigin = new Phaser.Line(x, y, this.origin.x, this.origin.y);
	var helperP1 = new Phaser.Point(this.origin.x+ Math.cos(this.crossAngle2 + Math.PI)*50, this.origin.y +Math.sin(this.crossAngle2+ Math.PI)*50);
	var negativeCol = false;
	var negativeRow = true;
	
	var crossAngle1Vector = new Phaser.Point(Math.cos(this.crossAngle1), Math.sin(this.crossAngle1));
	var crossAngle2Vector = new Phaser.Point(Math.cos(this.crossAngle2), Math.sin(this.crossAngle2));
	var lineToOriginVector = new Phaser.Point(Math.cos(lineToOrigin.angle), Math.sin(lineToOrigin.angle));	
	if(crossAngle1Vector.cross(lineToOriginVector)>0){
		negativeCol = true;
		helperP1 = helperP1.rotate(this.origin.x, this.origin.y, Math.PI);
	}
	var helperP2 = new Phaser.Point(x + Math.cos(this.crossAngle1)*50, y + Math.sin(this.crossAngle1)*50);
	if(crossAngle2Vector.cross(lineToOriginVector)<0){
		negativeRow = false;
		helperP2 = helperP2.rotate(x, y, Math.PI);
	}	
	var angleA = Util.find_angle(lineToOrigin.end, lineToOrigin.start, helperP2);
	var angleB = Util.find_angle(lineToOrigin.start, lineToOrigin.end, helperP1);
	var angleC = Math.PI - angleA - angleB;
	var colLength = (lineToOrigin.length * Math.sin(angleA))/Math.sin(angleC);
	var rowLength = (lineToOrigin.length * Math.sin(angleB))/Math.sin(angleC);
	rowLength *= (negativeRow?-1:1);
	colLength *= (negativeCol?-1:1);
	var colLine = new Phaser.Line().fromAngle(this.origin.x, this.origin.y, this.crossAngle2, -colLength);
	var rowLine = new Phaser.Line().fromAngle(this.origin.x, this.origin.y, this.crossAngle1, rowLength);

	return {row: Math.round(rowLength/this.length2), col: Math.round(colLength/this.length1)};	
};



BGGrid.prototype.pointOnBG = function(coord){
	return !(coord.x < this.sprite.left || coord.x > this.sprite.right || coord.y < this.sprite.top || coord.y > this.sprite.bottom);
};



function ParticleQueue(_game, _parent){
	this.game = _game;
	this.queue = [];
	this.allParicles = [];
	this.activeParticles = new Map();
	this.parent = _parent;
	this.group = this.game.add.group(0,0);
	this.parent.add(this.group);
};

ParticleQueue.prototype.initParticles = function(keys, amount){
	
	for(var i = 0; i< amount; i++){
		var newP = this.game.add.sprite(0,0, this.game.rnd.pick(keys));
		newP.anchor.setTo(0.5);
		
		var g = this.game.add.group();
		g.add(newP);
		g.alpha =0;
		g.visual = newP;
		this.group.add(g);
		this.queue.push(g);
		this.allParicles.push(g);
	};
};

ParticleQueue.prototype.popFront = function(){
	var p = this.queue.shift();
	if(p){
		this.activeParticles.set(p.id, p);
	}
	return p;
};
ParticleQueue.prototype.pushBack = function(p){
	console.log();
	this.activeParticles["delete"](p.id);
	return this.queue.push(p);
};


function QueueElement(element, priority){
	  this.element = element;
	  this.priority = priority;
	}

function PriorityQueue(){
	this.items = [];
}

PriorityQueue.prototype.enqueue = function(element, priority){
	// initialise the element
	var queueElement = new QueueElement(element, priority);
	var added = false;
	
	for(var i=0;i<this.items.length;i++){
	  // check if current element's priority is higher
	  if(queueElement.priority < this.items[i].priority){
	    this.items.splice(i,0,queueElement);
	    added = true;
	    break;
	  }
	}
	
	// element belongs to the end of queue
	if(!added){
	  this.items.push(queueElement);
	}
};

PriorityQueue.prototype.dequeue = function(){
  // return the element from the beginning of queue
	return this.items.shift();
};


