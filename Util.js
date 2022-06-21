/**
 *
 */
function Util () {

}


Util.clamp = function(num, min, max){
	return Math.max(min, Math.min(num, max));
};

Util.arrayRemove = function(arr, value){
	return arr.filter(function(ele){
       return ele != value;
   });
};

//PARAMETERS
//aSprite - sprite obj- this will be auto passed when using onComplete()
//aSpriteAnimation - the sprite obj's animation - this will be auto passed when using onComplete()
//aNumSpriteSheets - MAX number of JSON/Sprite Sheet your animation has
//aLoop - boolean (if you want your animation to loop)
Util.nextMultiAtlasAnimation = function(aSprite,aSpriteAnimation,aNumSpriteSheets,aLoop){
	if(aSprite.key.match(/\d+$/)!=null && parseInt(aSprite.key.match(/\d+$/)[0]) < aNumSpriteSheets){
		var tempString;
		if(parseInt(aSprite.key.match(/\d+$/)[0]) == aNumSpriteSheets-1){
			if(!aLoop) return;
			tempString = aSprite.key.slice(0,aSprite.key.indexOf(aSprite.key.match(/\d+$/)[0]))+'0';
		}
		else{
			tempString = aSprite.key.slice(0,aSprite.key.indexOf(aSprite.key.match(/\d+$/)[0]))+(parseInt(aSprite.key.match(/\d+$/)[0])+1);
		}
		aSprite.loadTexture(tempString,0);
		var tempAnim = aSprite.animations.add(aSpriteAnimation.name).play(aSpriteAnimation.speed);
		tempAnim.onComplete.add(Util.nextMultiAtlasAnimation,aSprite,0,aNumSpriteSheets,aLoop);
	}
};
//Example of how to set it up:
//Let's say you want to name your animation 'walk' and want the the animation to play w/ a speed of 10,
//And let's say you have 3 JSON/Spritesheets animation made w/ the TexturePacker's multi-pack export
//the 3 JSON key's must be named w/ a numbered suffix ascending from 0
//the key's can be named whatever so let's say for this example they're named 'Dummy_0','Dummy_1', & 'Dummy_2'
//
//
//   mySprite = level_p.add.sprite(xPoistion, yPosition, 'Dummy_0');
//	    mySprite.animations.add('walk').play(10);
//	    mySprite.animations.currentAnim.onComplete.add(Util.nextMultiAtlasAnimation,mySprite,0,3,true);
//
//
//	The above example is how you can set up the sprite's animation.
//All you need to do is call onComplete() on the first JSON animation
//and pass it the function Util.nextMultiAtlasAnimation()
//
//   mySprite = level_p.add.sprite(xPoistion, yPosition, 'Dummy_0');
//	    mySprite.animations.add('walk')
//	    mySprite.animations.currentAnim.onComplete.add(Util.nextMultiAtlasAnimation,mySprite,0,3,true);
//
//	NOTE you don't have to play it right away, you can use your animation like normal
//
//   mySprite.animations.currentAnim.play(10);
//		mySprite.animations.currentAnim.stop();
//

Util.scaleToBoundary = function(aSprite, aBoundWidth, aBoundHeight){
	var isWidthLimit = (aSprite.width / aBoundWidth) > (aSprite.height / aBoundHeight);
	if(isWidthLimit){
		var scaleRatio = aSprite.width / aBoundWidth;
		aSprite.width = aBoundWidth;
		aSprite.height = aSprite.height / scaleRatio;
	}
	else{
		var scaleRatio = aSprite.height / aBoundHeight;
		aSprite.height = aBoundHeight;
		aSprite.width = aSprite.width / scaleRatio;
	}
	//console.log("new width: " + aSprite.width);
	//console.log("new height: " + aSprite.height);
};

Util.numberFormatCommas = function(number){
	return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

Util.getChildFrom = function(groupName,dataField,value){
    var tempElement = false;
    groupName.forEach(function(element){if(element.data[dataField]==value){if(tempElement==false) {tempElement=element;}}},this,true);
    return tempElement;
};

//Loops through all groups and sub groups, setting scale to self scale * min/max.
Util.setScaleMinMaxGroup = function(group, minX, minY, maxX, maxY){
    if(group.ignore != null && group.ignore)
        return;
    if(group.children != null && group.children.length > 0){
        for(var i = 0; i < group.children.length; i++)
            Util.setScaleMinMaxGroup(group.children[i], minX, minY, maxX, maxY);
    }else
        group.setScaleMinMax(minX*group.scale.x, minY*group.scale.y, maxX*group.scale.x, maxY*group.scale.y);
};

// Make a solid color shape, returns the new image to be used as pleased.
// Game is Phaser Game (this.game), source is the sprite you want to have a color version of, col is the string color in hex '#ffffff' being white.
// Makes a new image that is a copy of the orignal sprite, returns the new image.
// Common use cases: Flash white, white tint overlay, easy flash without tint, etc.
// Change Color only handles Sprites, and only does the making of things, does not do tweens/etc.
Util.changeColor = function(game, source, col){
	// Tint tween to do a source
	var color = Phaser.Color.hexToColor(col);
	var temp = game.make.image(0+source.anchor.x*source.width,0+source.anchor.y*source.height, game.add.bitmapData(source.width, source.height).fill(color.r, color.g,color.b).blendDestinationAtop().draw(source, 0+source.anchor.x*source.width,0+source.anchor.y*source.height, source.width, source.height));


	var ret = game.add.sprite(source.x, source.y, temp.texture);
	ret.anchor.set(source.anchor.x, source.anchor.y);
	// Make copy of child sprite to fade in and out.
	return ret;
};

// Will return a polygon for use with p2 physics
// Will apply the scale to the shape, allowing for mirrored/smaller/etc.
// Applies scale by Multiplication, so to flip a flip, do another -1 scale.
// Otherwise, would require a separate json file for each scale possibility.
// Returns just the polygon of the key.
// For negative scales (flip/mirror):
// do the scaling to the sprite first (i.e. mirror the sprite first, then assign the polygon gotten from this function)
// Use: resizePolygon('spriteKey', 'jsonKey', {x:0.5, y:0.5}, this.game}
Util.resizePolygon = function(key, json, scale, game){


	var phyData = game.cache.getPhysicsData(json);
	var copyData = JSON.parse(JSON.stringify(phyData));

	// apply scale to shapes.
	var shapes = copyData[key];
	for(var i=0; i < shapes.length; i++){
		// Loop through the shapes, adjust each number
		for(var j=0; j<shapes[i]['shape'].length; j++){
			// if mod 2 == 0, it's even, so an x coord
			if(j % 2 == 0)
				shapes[i]['shape'][j] = shapes[i]['shape'][j]*scale.x;
			else
				shapes[i]['shape'][j] = shapes[i]['shape'][j]*scale.y;

		}
	}

	// if the scale was negative, need to reverse the shapes
	if(scale.x < 0 || scale.y < 0){
		var temp = Util.orderPolygon(copyData[key]);
	}

	return copyData[key];
};

// toggles a body's shapes to be sensors (collision detected but no physics other than gravity)
// Destrucitve, does edit original body.
// use: Util.sensorToggle(obj, true);
Util.sensorToggle = function(sprite, sensorBool){
for(var i=0; i < sprite.body.data.shapes.length; i++){
		sprite.body.data.shapes[i].sensor = sensorBool;
	}
};

Util.orderPolygon = function(polygonData){
	// Order points


	// Checks the shapes of the polygonData, reorders as needed.
	for(var i=0; i<polygonData.length; i++){
		var tempArr = [];
		// first pair becomes last pair and so on.
		// First, making a copy
		for(var j = 1; j < (polygonData[i]['shape'].length); j+=2){
			tempArr.push({x:polygonData[i]['shape'][j-1], y:polygonData[i]['shape'][j]});

//
//			// Store the back pair
//			var backX = polygonData[i]['shape'][polygonData[i]['shape'].length-(2*j+2)];
//			var backY = polygonData[i]['shape'][polygonData[i]['shape'].length-(2*j+1)];
//
//			// Assign the front values to the back
//			var frontX = polygonData[i]['shape'][j*2];
//			var frontY = polygonData[i]['shape'][j*2 + 1];
//
//			// Assign front to back
//			polygonData[i]['shape'][polygonData[i]['shape'].length-(2*j+2)] = frontX;
//			polygonData[i]['shape'][polygonData[i]['shape'].length-(2*j+1)] = frontY;
//
//			// Assign back to front
//			polygonData[i]['shape'][j*2] = backX;
//			polygonData[i]['shape'][j*2 + 1] = backY;
		}
		if(tempArr.length > 0){
			// Sort top to bottom
			tempArr.sort(function(a,b){return a.y - b.y;});

			// Find center
			var centerY = (tempArr[0].y + tempArr[tempArr.length - 1].y)/2;


			// Sort right to left
			tempArr.sort(function(a,b){return b.x - a.x;});

			// Find center
			var centerX = (tempArr[0].x + tempArr[tempArr.length - 1].x)/2;

			var center = {x:centerX, y:centerY};

			var startAng;
			tempArr.forEach(function(point){
				var ang = Math.atan2(point.y - center.y, point.x - center.x);
				if(!startAng){startAng = ang;}
				else{
					if(ang < startAng){
						ang += Math.PI * 2;
					}
				}
				point.angle = ang;
			});

			// Sort clockwise, reverse, move last point back to start
			tempArr.sort(function(a,b){
				return a.angle - b.angle;
			});

			var counterClock = tempArr;

			//counterClock.unshift(counterClock.pop());
			// Assign it back to polygon data

			for(var j = 0; j < counterClock.length; j++){
				polygonData[i]['shape'][j*2] = counterClock[j].x;
				polygonData[i]['shape'][j*2+1] = counterClock[j].y;

			}

		}
	}
	return polygonData;

};

Util.toDegrees = function(angle) {
  return angle * (180 / Math.PI);
};

Util.toRadians  = function(angle) {
  return angle * (Math.PI / 180);
};

/**
 * Initialize an empty multi dimensional array.
 * Ex:
 * var array2d = Util.createArray(10, 10) for a multidimensional array of size [10][10]
 * @param length      the size of one dimension of the array
 * @returns {Array}   an empty array
 */
Util.createArray = function(length) {
	var arr = new Array(length || 0),
	i = length;
	if (arguments.length > 1) {
		var args = Array.prototype.slice.call(arguments, 1);
		while(i--) arr[length-1 - i] = this.createArray.apply(this, args);
	}
	return arr;
};


Util.resetTweenHelper = function(tween, state) {
	if (tween) {
		tween.stop();
		state.game.tweens.remove(tween);
	}

};

//    _____ _                       _      ______                _   _
//   /  ___(_)                     ( )     |  ___|              | | (_)
//   \ `--. _ _ __ ___   ___  _ __ |/ ___  | |_ _   _ _ __   ___| |_ _  ___  _ __  ___
//    `--. \ | '_ ` _ \ / _ \| '_ \  / __| |  _| | | | '_ \ / __| __| |/ _ \| '_ \/ __|
//   /\__/ / | | | | | | (_) | | | | \__ \ | | | |_| | | | | (__| |_| | (_) | | | \__ \
//   \____/|_|_| |_| |_|\___/|_| |_| |___/ \_|  \__,_|_| |_|\___|\__|_|\___/|_| |_|___/
//
//simon functions

Util.initDebugButtons = function(parent, aGame){
//	parent.children.forEach(function(item){
//		item.scale.setTo(3,3);
//	});
//	Playable.resetAnchor(parent.getChildAt(0), 0, 0);
//	Playable.resetAnchor(parent.getChildAt(1), 1, 0);
//	Playable.resetAnchor(parent.getChildAt(2), 1, 1);
//	Playable.resetAnchor(parent.getChildAt(3), 0, 1);


//	Playable.cc.push(i);
//	Playable.ccItems.forEach(function(cc, j){
//		console.log(Playable.cc);
//		cc.evaluate();
//	}, this);
	Playable.cc = [];
	Playable.ccItems = [];
	aGame.input.onDown.add(function(){
		console.log();
		var pointer = aGame.input.activePointer;
		var region =-1;
		if(pointer.x< aGame.width/2){
			if(pointer.y< aGame.height/2){
				region =0;
			}else{
				region = 3;
			}
		}else{
			if(pointer.y< aGame.height/2){
				region =1;
			}else{
				region = 2;
			}

		}
		console.log(region);

		Playable.cc.push(region);
		console.log(Playable.cc);
		Playable.ccItems.forEach(function(cc, j){
			console.log(Playable.cc);
			cc.evaluate();
		}, this);
	});

};
Util.worldToLocal = function(posInWorldSpace, localSprite){

	var testPoint = new Phaser.Point();

	localSprite.parent.worldTransform.applyInverse(posInWorldSpace, testPoint);
	localSprite.updateTransform();
	return testPoint;
}

Util.moveToGroup = function(sprite, newGroup, index){
	if(!index){
		index = 0;
	}
	sprite.updateTransform();

	var oldWorldPosition = sprite.worldPosition;
	var oldWorldTransform = new Phaser.Matrix();
	var oldScale = new Phaser.Point();
	sprite.worldScale.clone(oldScale);
	sprite.worldTransform.clone(oldWorldTransform);

	newGroup.add(sprite, false, index);
	var newLocalPosition = this.worldToLocal(oldWorldPosition, sprite);
	sprite.updateTransform();
	var scaleFactor = {
			x: oldScale.x/sprite.worldScale.x,
			y: oldScale.y/sprite.worldScale.y
	};
	sprite.x = newLocalPosition.x;
	sprite.y = newLocalPosition.y;
	sprite.scale.setTo(sprite.scale.x* scaleFactor.x, sprite.scale.y* scaleFactor.y);
};

Util.zoomGroupToPos = function(game, camera, group, point, zoomAmount, time){
	console.log(group);
	if(camera.parent != group){

		this.moveToGroup(camera, group);

	}
	var pointToZoom = this.worldToLocal(point.worldPosition, camera);

	game.add.tween(camera).to({x: pointToZoom.x, y: pointToZoom.y}, time, Phaser.Easing.Sinusoidal.InOut, true);
	return game.add.tween(group.scale).to({x:zoomAmount.toString(), y:zoomAmount.toString()},time, Phaser.Easing.Sinusoidal.InOut, true);
};


Util.spawnParticleExplosion = function(game, sprite, spawnPos, numParticles, innerRadius, outerRadius, minParticleSize, maxParticleSize, randomRadius, easingFunction){
	var particleGroup = game.add.group();
	easingFunction = easingFunction ? easingFunction: Phaser.Easing.Sinusoidal.Out;
	randomRadius = randomRadius ? randomRadius: false;
	for(var i = 0; i< numParticles; i++){
		var radian = i/numParticles * (2 * Math.PI);

		var startPos = new Phaser.Point(spawnPos.x + Math.cos(radian) * innerRadius, spawnPos.y + Math.sin(radian) * innerRadius);
		var modOuterRadius = outerRadius;
		if(randomRadius){
			modOuterRadius = game.rnd.realInRange(innerRadius, outerRadius);
		}
		var endPos = new Phaser.Point(spawnPos.x + Math.cos(radian) * modOuterRadius, spawnPos.y + Math.sin(radian) * modOuterRadius);
		var particle = game.add.sprite(startPos.x, startPos.y, sprite);
		particle.angle = game.rnd.realInRange(0, 360);
		particle.anchor.setTo(0.5, 0.5);
		particleGroup.add(particle);
		particleSize = game.rnd.realInRange(minParticleSize, maxParticleSize);
		Util.scaleToBoundary(particle, particleSize, particleSize);
		game.add.tween(particle).to({x: endPos.x, y: endPos.y}, 500, easingFunction, true);
		game.add.tween(particle).to({alpha: 0}, 500, Phaser.Easing.Linear.None, true);
	}
	game.time.events.add(500, function(){
		particleGroup.removeAll();
	}, this);
	return particleGroup;
};

Util.spawnParticlesInCircle = function(game, sprite, spawnPos, numParticles, radius, minParticleSize, maxParticleSize){
	var particleGroup = game.add.group();
	for(var i = 0; i< numParticles; i++){
		var randomRadian =  game.rnd.frac() * (2 * Math.PI);
		var randPos = new Phaser.Point(spawnPos.x + Math.cos(randomRadian) * (game.rnd.frac() * radius), spawnPos.y + Math.sin(randomRadian) * (game.rnd.frac() * radius));
		var particle = game.add.sprite(randPos.x, randPos.y, sprite);
		particle.angle = game.rnd.realInRange(0, 360);
		particle.anchor.setTo(0.5, 0.5);
		particleGroup.add(particle);
		var particleSize = game.rnd.realInRange(minParticleSize, maxParticleSize);
		Util.scaleToBoundary(particle, particleSize, particleSize);
		var randScale = {
				x: particle.scale.x,
				y: particle.scale.y
		};
		particle.scale.setTo(0,0);
		game.add.tween(particle.scale).to({x: randScale.x, y:randScale.y}, 500, Phaser.Easing.Cubic.Out, true).chain(
				game.add.tween(particle).to({alpha: 0}, 200, Phaser.Easing.Linear.None, false)
		);

	}
};


Util.slideTransionGroup = function(game, group, speed){
	console.log(Global.cameraOffsetX, Global.cameraOffsetY);
	var mask = game.add.graphics(Global.cameraOffsetX,Global.cameraOffsetY);
	 mask.beginFill(0x000000, 0);
	 this.maskRect = mask.drawRect(0, 0, game.width, game.height);
	 var maskTween = game.add.tween(this.maskRect).to({width: 0}, speed, Phaser.Easing.Linear.None, true);

	 maskTween.onUpdateCallback(function(){
		 group.mask = mask;
	 }, this);

	 return maskTween;
};



Util.intializeProgressBar = function(prefabRef, config){
	if(prefabRef.ProgressBarManager!=undefined){
		console.log("ERROR: " + prefabRef.name + " already has a progress bar manager");
		return;
	}

	prefabRef.ProgressBarManager = new ProgressBarManager(prefabRef.game, config);
	return prefabRef.ProgressBarManager;
};

Util.resetTimingEvent = function(aGame, timingEvent){
	aGame.time.events.remove(timingEvent);
	return aGame.time.events.add(timingEvent.delay, timingEvent.callback, timingEvent.callbackContext);
}


Util.getAngleOfLine = function(line){
	return (Math.atan2(line.end.y- line.start.y,  line.end.x- line.start.x) * 180/ Math.PI);
}
//charSpacingMod & new line mod: you should manually set these for each type, because I think that there are values for these baked
//into the fonts or something that aren't accessible through Phaser, so you should just set these to some small value depending on
//what looks best for each font.

//I'll add some additional functions that do some cool animations (maybe with a tween manager that fires an on complete when the last letter is tweened)
Util.splitWordIntoLetters = function(aGame, textObject, charSpacingMod, newLineMod, hideOriginal){
	var textArray = textObject.text.split('');
	var letterWidth = textObject.left;
	var letterHeight = textObject.top;
	var lines = [];
	var numLines  =0;
	lines.push(aGame.add.group());
	Util.moveToGroup(lines[0], textObject.parent);
	lines[0].position.setTo(0,0);
	lineWidths = [];
	textArray.forEach(function(item, i){
		if(textObject.text.charCodeAt(i)== 10){
			lines.push(aGame.add.group());
			lineWidths.push(letterWidth -textObject.left);
			letterWidth = textObject.left;
			letterHeight+= textObject.fontSize + newLineMod;
			numLines ++;
			Util.moveToGroup(lines[numLines], textObject.parent);
			console.log(lines[numLines]);
			lines[numLines].position.setTo(0,0);

		}else{
			var testWord = new webfontGEOText(aGame, letterWidth, letterHeight, item, textObject.style);

			testWord.data = textObject.data;
			//testWord.anchor.setTo(0.5, 0.5);
			Util.moveToGroup(testWord, aGame.world);
			testWord.font = testWord.data.webfont;
			aGame.world.bringToTop(testWord);
			letterWidth+= testWord.width-testWord.strokeThickness -charSpacingMod;
			lines[numLines].add(testWord);
			testWord.setAnchorToMiddle();
		}

	}, this);

	console.log(lines[0].parent == textObject.parent);
	lineWidths.push(letterWidth -textObject.left);
	var textObjectCenter = new Phaser.Point(textObject.left + textObject.anchor.x*textObject.width, textObject.top + textObject.anchor.y*textObject.height);
	lines.forEach(function(item, i){
		var offset = item.children[0].worldPosition.x - textObjectCenter.x;
		offset = (offset*2 + item.width);
		offset/=2;
		console.log(offset);
		console.log(item.width);
		item.children.forEach(function(letter, j){
			letter.x-= offset;
		});

	});
	if(hideOriginal){
		textObject.visible = false;

	}
	return lines;
};





//Help funtion to initialize a progressBar with a few simple ingredients
function ProgressBarManager(aGame, config){
	this.game = aGame;
	this.leftPiece = config.leftPiece;
	this.rightPiece = config.rightPiece;
	this.centerPiece = config.centerPiece;
	this.backingPiece = config.backingPiece;
	this.lerpSpeed = config.lerpSpeed;
	this.easingFunction = config.easingFunction;
	this.currentTween = undefined;
	this.barAmount = 1;
	this.padding = config.padding;
	this.fullWidth = this.backingPiece.width - this.leftPiece.width - this.rightPiece.width - this.padding;

	this.onBarStartMove = new Phaser.Signal();
	this.onBarEndMove = new Phaser.Signal();

	this.setToAmount(1);
}

ProgressBarManager.prototype.setToAmount = function(amount){
	this.centerPiece.width = this.fullWidth * amount;
	this.rightPiece.x = this.fullWidth * amount;
	this.barAmount = amount;
};
ProgressBarManager.prototype.tweenByAmount = function(delta, autoStart){
	autoStart = (typeof autoStart !== 'undefined') ?  autoStart : true;
	this.barAmount += delta;
	console.log(this.barAmount);
	return this.tweenToAmount(this.barAmount, autoStart);
};
ProgressBarManager.prototype.tweenToAmount = function(amount, autoStart){

	this.onBarStartMove.dispatch();
	autoStart = (typeof autoStart !== 'undefined') ?  autoStart : true;
	this.barAmount = amount;
	this.barAmount = Math.min(Math.max(this.barAmount, 0), 1);

	if(this.currentTween){
		this.currentTween.stop();
	}

	this.currentTween = this.game.add.tween(this.centerPiece).to({width: this.fullWidth * this.barAmount}, this.lerpSpeed, this.easingFunction, autoStart);
	this.game.add.tween(this.rightPiece).to({x: this.fullWidth * this.barAmount}, this.lerpSpeed, this.easingFunction, autoStart);
	this.currentTween.onComplete.add(function(){
		this.currentTween = undefined;
		this.onBarEndMove.dispatch();
	}, this);
	return this.currentTween;

};

Util.resetAnchorHelper = function(obj, xPos, yPos, hOffset, vOffset, xOffset, yOffset) {
	if(obj.currentOrientation == Global.orientation){
		return;
	}
  	AppLovin.anchorRemove(obj);
  	obj.fixedToCamera = false;
  	obj.position.setTo(xPos, yPos);
  	obj.camOffsetInitX = xPos;
  	obj.camOffsetInitY = yPos;
  	obj.fixedToCamera = true;
	AppLovin.anchorAdd(obj, hOffset, vOffset, xOffset, yOffset);
	obj.currentOrientation = Global.orientation;
};







Util.addStaticP2Environment = function(aGame, config){
	var currentSprite = config.parent.getByName(config.worldSprite);
	currentSprite.updateTransform();
	Util.resetAnchor(currentSprite, 0.5, 0.5);
	aGame.physics.p2.enable(currentSprite, Global.debug);
	currentSprite.body.clearShapes();
	currentSprite.body.loadPolygon(config.physicsSheet, config.physicsName);
	currentSprite.body.static = true;
	currentSprite.body.setCollisionGroup(config.collisionGroup);
	currentSprite.body.setMaterial(config.physicsMaterial);
	currentSprite.body.collides(config.collidesWith);
	currentSprite.body.collideWorldBounds = false;
	return currentSprite;
}


Util.addDynamicP2Environment = function(aGame, config){
	var currentSprite = config.parent.getByName(config.worldSprite);
	currentSprite.updateTransform();
	Util.resetAnchor(currentSprite, 0.5, 0.5);
	aGame.physics.p2.enable(currentSprite, Global.debug);
	currentSprite.body.clearShapes();
	currentSprite.body.loadPolygon(config.physicsSheet, config.physicsName);
	currentSprite.body.static = false;
	currentSprite.body.setCollisionGroup(config.collisionGroup);
	currentSprite.body.setMaterial(config.physicsMaterial);
	currentSprite.body.collides(config.collidesWith);
	currentSprite.body.collideWorldBounds = false;
	return currentSprite;
}


//TODO
//	this does NOTTT work if there is any type of rotation involved lmaooooo
Util.resetAnchor = function(sprite, newX, newY){
	var deltaPivot = {x: sprite.anchor.x - newX, y: sprite.anchor.y - newY};
	var deltaPosition = {x: deltaPivot.x * sprite.width, y: deltaPivot.y * sprite.height};
	sprite.anchor.setTo(newX, newY);
	sprite.position.x -= deltaPosition.x;
	sprite.position.y -= deltaPosition.y;

};

//Maps NxN => Z
Util.cantorPair = function(x, y)
{
    return (0.5 * (x + y) * (x + y + 1)) + y;
}

Util.cantorPairSigned = function(x, y) 
{
    const a = (x >= 0.0 ? 2.0 * x : (-2.0 * x) - 1.0);
    const b = (y >= 0.0 ? 2.0 * y : (-2.0 * y) - 1.0);
    return Util.cantorPair(a, b);
}

Util.getForwardVector = function(sprite){

	var radian = -sprite.angle *(Math.PI/180);
	return new Phaser.Point( Math.sin(radian), Math.cos(radian));
};

Util.IsIpad = function(aState){
//	var theta = 0.05;
//	switch(Global.orientation){
//		case "l":
//			return (Math.abs(window.innerWidth/window.innerHeight - (16/9)) > theta);
//			break;
//		case "p":
//			return (Math.abs(window.innerWidth/window.innerHeight - (9/16)) > theta);
//			break;
//		default:
//			return false;
//	}
	AppLovin.handleOrientation(aState);
	console.log(Global.cameraOffsetX, Global.cameraOffsetY);
	return Global.cameraOffsetX < -20 || Global.cameraOffsetY < -20;
};



//ty kellie
Util.unlerp = function(min, max, value){
	return (value-min)/(max-min);
};

Util.updateForTime = function(aGame, time, easingFunction, callback, callbackContext, autoplay, delay){
	autoplay = (autoplay == undefined) ? true : autoplay;
	delay = (delay == undefined) ? 0: delay;
	var proxy = {value: 0};

	var proxyTween = aGame.add.tween(proxy).to({value: 1}, time, easingFunction, autoplay, delay);
	var startTime = new Date().getTime();
	proxyTween.onUpdateCallback(function(){

		callback.call(callbackContext, proxy.value, new Date().getTime() - startTime);
	}, callbackContext);

	return proxyTween;
}

Util.zeroPad = function(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
};
Util.getColorShade = function(hexColor, percentage, lighten){
	var color = Phaser.Color.valueToColor(hexColor);
	var rShadeIncrement, gShadeIncrement, bShadeIncrement;
	
	if(lighten){
		rShadeIncrement = (255 - color.r) / 100;
		gShadeIncrement = (255 - color.g) / 100;
		bShadeIncrement = (255 - color.b) / 100;
	} else {
		rShadeIncrement = -((color.r) / 100);
		gShadeIncrement = -((color.g) / 100);
		bShadeIncrement = -((color.b) / 100);
	}
	
	color.r += rShadeIncrement * percentage;
	color.g += gShadeIncrement * percentage;
	color.b += bShadeIncrement * percentage;
	
	return Phaser.Color.getColor(color.r, color.g, color.b);
};
//Credit to Viseth!!!
Util.shakeObj = function(aObject,aDur,aMag,aIntesity){

	var aState = aObject.game.state.getCurrentState();
	var magnitude = 10; // max distance in pixels it can shake about
	var shakeIntensity = 25; // duration of one shake cycle

	if(aMag!=null)
		magnitude = aMag;
	if(aIntesity!=null)
		shakeIntensity = aIntesity;

	aObject.shakeStartPos = new Phaser.Point(aObject.x,aObject.y);

	var myTween = { x:aState.add.tween(aObject).to({x:'+'+magnitude},shakeIntensity,Phaser.Easing.Sinusoidal.InOut,true,0,-1,true),
					y:aState.add.tween(aObject).to({y:'+'+magnitude},shakeIntensity,Phaser.Easing.Sinusoidal.InOut,true,0,-1,true)};

	Object.keys(myTween).forEach(function(key) {
	    myTween[key].totalDur = aDur;

	    myTween[key].onLoop.add(function(aObj,aTween){
			var neg = Math.random() < 0.5 ? -1 : 1;
			aTween.timeline[0].vEnd[Object.keys(aTween.timeline[0].vEnd)[0]] = aTween.timeline[0].vEnd[Object.keys(aTween.timeline[0].vStart)[0]] + neg*Math.random()*magnitude/2;
			aTween.totalDur-= aTween.timeline[0].duration;

			if(aTween.totalDur<0){
				aTween.stop();
				aObj.position = new Phaser.Point(aObject.shakeStartPos.x,aObject.shakeStartPos.y);
			}
			else{
				aTween.timeline[0].duration = shakeIntensity*(1+Math.random());
			}
		});
	});
};

//An Inplace function to
//rotate a N x N matrix
//by 90 degrees in
//anti-clockwise direction
//https://www.geeksforgeeks.org/inplace-rotate-square-matrix-by-90-degrees/
Util.rotateMatrix = function(N,mat){

 // Consider all squares one by one
 for (var x = 0; x < N / 2; x++)
 {

     // Consider elements in group
     // of 4 in current square
     for (var y = x; y < N - x - 1; y++)
     {

         // Store current cell in
         // temp variable
         let temp = mat[x][y];

         // Move values from right to top
         mat[x][y] = mat[y][N - 1 - x];

         // Move values from bottom to right
         mat[y][N - 1 - x]
             = mat[N - 1 - x][N - 1 - y];

         // Move values from left to bottom
         mat[N - 1 - x][N - 1 - y] = mat[N - 1 - y][x];

         // Assign temp to left
         mat[N - 1 - y][x] = temp;
     }
 }
};

Util.deepCopyObject = function(inObject) {
	var outObject, value, key;

	if (typeof inObject !== "object" || inObject === null) {
	 return inObject;
	}

	// Create an array or object to hold the values
	outObject = Array.isArray(inObject) ? [] : {}

	for (key in inObject) {
	 value = inObject[key];

	 // Recursively (deep) copy for nested objects, including arrays
	 outObject[key] = Util.deepCopyObject(value);
	}

	return outObject;
};

Util.linearInterpolateLine = function(line, t, reverse){
	reverse = reverse== undefined ? false: reverse;
	if(reverse){
		return new Phaser.Point(
					Phaser.Math.linear(line.end.x, line.start.x, t),
					Phaser.Math.linear(line.end.y, line.start.y, t)
			);
	}
	return new Phaser.Point(
			Phaser.Math.linear(line.start.x, line.end.x, t),
			Phaser.Math.linear(line.start.y, line.end.y, t)
	);
};

Util.clampPoint = function(point, lowX, highX, lowY, highY){
	return new Phaser.Point(Phaser.Math.clamp(point.x, lowX, highX), Phaser.Math.clamp(point.y, lowY, highY));
}


Util.getValidLangcode = function(langCode){
	if(langCode == "DE" || langCode == "FR" || langCode == "EN"){
		return langCode;
	}
	return "EN";
}

Util.nbsReplace = function(string){
	return string;
	//never forget :(
	var mod = string.replace(/ /g, String.fromCharCode(160));
	return mod;
}

Util.vibesColor = function(){
	var componentToHex = function(c) {
	  var hex = c.toString(16);
	  return hex.length == 1 ? "0" + hex : hex;
	}

	var rgbToHex = function(r, g, b) {
	  return "0x" + componentToHex.call(this, r) + componentToHex.call(this, g) + componentToHex.call(this, b);
	}
	var hue = Math.random();

	var pastel = Phaser.Color.HSLtoRGB(hue, 1, 0.8);
	return rgbToHex.call(this, pastel.r, pastel.g, pastel.b);
};




Util.smoothstep = function(min, max, value) {
	var x = Math.max(0, Math.min(1, (value-min)/(max-min)));
	return x*x*(3 - 2*x);
};
//THANK YOU http://jon-martin.com/?p=570
//texture key: string of the texture
//_maskColor: a 0xRRGGBBAA color of the color you want to mask out
//sensitivity: 0-1 range float that dictates how sensitive it is to the color (usually good at 0.5)
//smooth: 0-1 range of the smoothing of the edges (usually good at 0.01)
Util.chromaKeySprite = function(textureKey, _maskColor, sensitivity, smooth){
	var refSprite = this.game.add.sprite(0,0, textureKey);
	var width = refSprite.width;
	var height = refSprite.height;
	var bmd = this.game.make.bitmapData(width, height);
	var maskColor = Phaser.Color.fromRGBA(_maskColor);
	bmd.draw(textureKey, 0,0);
	bmd.update(0,0, width, height);

	var makeUnitColor = function(color){
		return {
			r: Util.unlerp(0, 255, color.r),
			g: Util.unlerp(0, 255, color.g),
			b: Util.unlerp(0, 255, color.b),
			a: Util.unlerp(0, 255, color.a)
		}
	};
	var maskUnit = makeUnitColor.call(this, maskColor);
	bmd.processPixelRGB(function(c){
		var sourceUnit = makeUnitColor.call(this, c);
		var maskY = 0.2989 * maskUnit.r + 0.5866 * maskUnit.g + 0.1145 * maskUnit.b;
		var maskCr = 0.7132 * (maskUnit.r - maskY);
		var maskCb = 0.5647 * (maskUnit.b - maskY);
		var Y = 0.2989 * sourceUnit.r + 0.5866 * sourceUnit.g + 0.1145 * sourceUnit.b;
		var Cr = 0.7132 * (sourceUnit.r - Y);
		var Cb = 0.5647 * (sourceUnit.b - Y);
		var blendValue = Util.smoothstep(sensitivity, sensitivity + smooth, Phaser.Math.distance(Cr, Cb, maskCr, maskCb));
		c.a = 255 * blendValue;
		c.r *= blendValue;
		c.g *= blendValue;
		c.b *= blendValue;
		return c;
	}, this, 0, 0, width, height);
	refSprite.destroy();
	var returnSprite = this.game.add.sprite(width, height, bmd);
	return returnSprite;
};
Util.getLineCircleIntersection = function(line, circle){
	var x1 = line.start.x;
	var y1 = line.start.y;
	var x2 = line.end.x;
	var y2 = line.end.y;
	var r = circle.radius;
	
	//adjust because the formula only works for circles at 0,0
	x1 -= circle.x;
	x2 -= circle.x;
	y1 -= circle.y;
	y2 -= circle.y;
	
	
	
	var dx = x2-x1;
	var dy = y2-y1;
	var dr = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
	var D = x1*y2 - x2*y1;
	
	var sgn = function(x){
		return x<0?-1:1;
	}
	
	var finalX1 = ((D * dy) + sgn.call(this, dy)*dx*Math.sqrt(Math.pow(r, 2) * Math.pow(dr, 2) - Math.pow(D, 2)))/Math.pow(dr, 2);
	var finalX2 = ((D * dy) - sgn.call(this, dy)*dx*Math.sqrt(Math.pow(r, 2) * Math.pow(dr, 2) - Math.pow(D, 2)))/Math.pow(dr, 2);
	
	var finalY1 = ((-D * dx) + Math.abs(dy) *  Math.sqrt(Math.pow(r, 2) * Math.pow(dr, 2) - Math.pow(D, 2)))/Math.pow(dr, 2);
	var finalY2 = ((-D * dx) - Math.abs(dy) *  Math.sqrt(Math.pow(r, 2) * Math.pow(dr, 2) - Math.pow(D, 2)))/Math.pow(dr, 2);
	
	
	var p1 = new Phaser.Point(finalX1 +circle.x, finalY1+circle.y);
	var p2 = new Phaser.Point(finalX2 + circle.x, finalY2 +circle.y);
	//Delta<0	no intersection
	//Delta=0	tangent
	//Delta>0	intersection
	var delta = Math.pow(r, 2) * Math.pow(dr, 2) - Math.pow(D, 2);
	return {p1: p1, p2: p2, delta: delta};
	
};

Util.getLineRectIntersection = function(line, rect){
	
	var intersections = [];
	var createLine = function(p1, p2){
		return new Phaser.Line(p1.x, p1.y, p2.x, p2.y);
	}.bind(this);

	var getIntersectData = function(_line, rectSide, sideName){
		var pointOfIntersection = Phaser.Line.intersects(_line, rectSide);
		rectSide.name = sideName;
		
		return {point: pointOfIntersection, side: rectSide};
	}.bind(this);
	//check top
	
	intersections.push(getIntersectData(line, createLine(rect.topLeft, rect.topRight), "top"));
	//check right
	intersections.push(getIntersectData(line, createLine(rect.topRight, rect.bottomRight), "right"));
	//check bottom
	intersections.push(getIntersectData(line, createLine(rect.bottomRight, rect.bottomLeft), "bottom"));
	//checl left
	intersections.push(getIntersectData(line, createLine(rect.bottomLeft, rect.topLeft), "left"));
	
	intersections = intersections.filter(function(element){
		return element.point!=null;
	}, this);
	if(intersections.length == 0){
		return false;
	}
	//sort by ditance from start
	intersections = intersections.sort(function(pointA, pointB){
		return Phaser.Point.distance(line.start, pointA.point) - Phaser.Point.distance(line.start, pointB.point);
	}, this);
	
	return {i1: intersections[0], i2: intersections[1]};
	
}


Util.getLinePolyIntersection = function(line, poly){
	if(poly instanceof Phaser.Rectangle){
		return Util.getLineRectIntersection(line, poly);
	}
	var intersections = [];
	var lines = Util.getLinesFromPoly(poly);
	
	lines.forEach(function(sideLine){
		intersections.push({point: line.intersects(sideLine), side: sideLine});
	}, this);
	
	intersections = intersections.filter(function(item){
		return item.point!=null;
	}, this);
	if(intersections.length==0){
		return null;
	}
	
	intersections = intersections.sort(function(a, b){
		return Phaser.Point.distance(a.point, line.start) - Phaser.Point.distance(b.point, line.start);
	}, this);
	return {i1: intersections[0], i2: intersections[1]};
}

//hex grid helpers
Util.oddr_to_cube = function(row, col){
	var x = col - (row - (row&1)) / 2;
	var z = row;
	var y = -x-z;
	return {x:x, y:y, z:z};
};
Util.cube_to_oddr = function(x, y, z){
	if(y == undefined){
		try{
			return Util.cube_to_oddr(x.x, x.y, x.z);
		}catch(e){
			console.log("args must be x,y,z or {x:x, y:y,z:z}");
		}
	}
	var col = x + (z - (z&1)) / 2;
    var row = z;
    return {col: col, row: row};
};

//https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_line
//I love math
Util.distPointToLine = function(point, line){
	var x1 = line.start.x;
	var y1 = line.start.y;
	var x2 = line.end.x;
	var y2 = line.end.y;
	var x0 = point.x;
	var y0 = point.y;
	
	return Math.abs((x2 - x1)*(y1-y0) - (x1-x0)*(y2-y1))/(Math.sqrt(Math.pow((x2-x1), 2) + Math.pow((y2-y1), 2)));
};
//https://stackoverflow.com/questions/17763392/how-to-calculate-in-javascript-angle-between-3-points
Util.find_angle = function(A,B,C) {
    var AB = Math.sqrt(Math.pow(B.x-A.x,2)+ Math.pow(B.y-A.y,2));    
    var BC = Math.sqrt(Math.pow(B.x-C.x,2)+ Math.pow(B.y-C.y,2)); 
    var AC = Math.sqrt(Math.pow(C.x-A.x,2)+ Math.pow(C.y-A.y,2));
    return Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB));
}

Util.calculateRowLine = function(_leftBound, _rightBound, theta){
	
	var leftPoint = Util.linearInterpolateLine(_leftBound, theta, true);
	var rightPoint = Util.linearInterpolateLine(_rightBound, theta, true);
	return new Phaser.Line(leftPoint.x, leftPoint.y, rightPoint.x, rightPoint.y);
};


Util.getLinesFromPoly = function(poly){
	var lines = [];
	for(var i = 0; i< poly.points.length; i++){
		lines.push(new Phaser.Line(poly.points[i].x, poly.points[i].y, poly.points[(i+1)%poly.points.length].x,poly.points[(i+1)%poly.points.length].y));
		lines[i].name = "";
	}
	return lines;
}

Util.scaleQuadrilateral = function(center, shape, amount){
	var points = [];
	shape.points.forEach(function(p){
		var newP = p.clone();
		var angleToCenter = center.angle(newP);
//		newP.x += Math.cos(angleToCenter)*amount;
//		newP.y += Math.sin(angleToCenter)*amount;
		newP.x *= amount;
		newP.y *= amount;
		points.push(newP);
	}, this);
	var transformedCenter = Phaser.Point.interpolate(points[0], points[2], 0.5);
	
	points.forEach(function(p){
		p.x += center.x - transformedCenter.x;
		p.y += center.y - transformedCenter.y;
	}, this);
	
	return new Phaser.Polygon(points);
};

Util.getLuminance = function(r, g, b){
	return (0.2126*r + 0.7152*g + 0.0722*b);
};

Util.LightenDarkenColor = function(colorCode, amount) {
	 var usePound = false;
	 
    if (colorCode[0] == "#") {
        colorCode = colorCode.slice(1);
        usePound = true;
    }
 
    var num = parseInt(colorCode, 16);
 
    var r = (num >> 16) + amount;
 
    if (r > 255) {
        r = 255;
    } else if (r < 0) {
        r = 0;
    }
 
    var b = ((num >> 8) & 0x00FF) + amount;
 
    if (b > 255) {
        b = 255;
    } else if (b < 0) {
        b = 0;
    }
 
    var g = (num & 0x0000FF) + amount;
 
    if (g > 255) {
        g = 255;
    } else if (g < 0) {
        g = 0;
    }
 
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
};

Util.getBezierCurve = function(p1, p2, p3, t){
//	p1 = new Phaser.Point(Phaser.Math.linear(p1.x, p2.x, 0.5), Phaser.Math.linear(p1.y, p2.y, 0.5));
//	p3 = new Phaser.Point(Phaser.Math.linear(p2.x, p3.x, 0.5), Phaser.Math.linear(p2.y, p3.y, 0.5));
	
	var x = Math.pow(1-t, 2) *p1.x + 2*(1-t)*t*p2.x + Math.pow(t, 2) *p3.x;
	var y = Math.pow(1-t, 2) *p1.y + 2*(1-t)*t*p2.y + Math.pow(t, 2) *p3.y;
	return new Phaser.Point(x,y);
};

Util.shake = function(shakeCircle, obj, itr, maxTime, onComplete){
	if(maxTime!=undefined && maxTime<=0){
		itr = 0;
	}
	var startTime = this.game.time.now;
	var endLoc = itr == 0?shakeCircle:shakeCircle.random();
	var dist = Phaser.Point.distance(obj.position, endLoc);
	obj.shakeTween = this.game.add.tween(obj).to({x: endLoc.x, y: endLoc.y}, dist/10, Phaser.Easing.Sinusoidal.InOut, true);
	
	obj.shakeTween.onComplete.add(function(){
		if(itr == 0){
			if(onComplete){
				onComplete.call(this);
			}
			return;
		}
		Util.shake.call(this, shakeCircle, obj, itr-1, maxTime?maxTime + (startTime - this.game.time.now):maxTime, onComplete);
	}, this);
};

Util.processImage = function(imgKey, pixelCallBack){
	var width = this.game.cache.getImage(imgKey).width;
	var height = this.game.cache.getImage(imgKey).height;
	var bmd = this.game.add.bitmapData(width, height);
	bmd.draw(imgKey, 0, 0);
	bmd.update();
	var row = 0;
	var col = 0;
	var returnArr = [];
	bmd.processPixelRGB(function(data){
		if(col == 0){
			returnArr.push([]);
		}
		returnArr[row].push(pixelCallBack.call(this, data));
		col++;
		if(col>=width){
			row++;
			col = 0;
		}
	}, this, 0, 0, width, height);
	bmd.destroy();
	
	return returnArr;
};
