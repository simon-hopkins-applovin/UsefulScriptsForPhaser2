function Cell(game, row, col, empty, cellSize, blockParent, fxParent, centerPos, chunkQueue){
	this.game = game;
	Phaser.Group.call(this, this.game, blockParent);
	this.row = row;
	this.col = col;
	this.empty = empty;
	this.cellSize = cellSize;
	this.FXParent = fxParent;
	this.chunkQueue = chunkQueue;
	this.color = null;
	this.id = Util.cantorPair(row, col);
	this.blockParent = blockParent;
	this.blocked = false;
	this.isShaking = false;
	
	this.blockVisual = new BSBlock(this.game, this);
	
	
	this.isGlowing = false;
	this.empty?this.setToEmpty():this.setToFull();
	this.position.setTo(centerPos.x, centerPos.y);
	
	this.blockVisual.resizeWithWidth(cellSize*1.7);
	this.blockVisual.baseScale = this.blockVisual.scale.clone();
	console.log(this.blockVisual.alpha);
	this.spawnCircle = new Phaser.Circle(0, 0,this.cellSize);
	//ref to a particle queue it can use for explosions
}

Cell.prototype = Object.create(Phaser.Group.prototype);
Cell.prototype.constructor = Cell;

Cell.prototype.grayAnim = function(delay){
	this.parent.bringToTop(this.graySprite);
	this.graySprite.alphaTween = this.game.add.tween(this.graySprite).to({alpha: 1}, 300, Phaser.Easing.Linear.Out, true, delay);
	this.graySprite.alphaTween.onComplete.add(function(){
		this.setToEmpty();
	}, this);
	
};

Cell.prototype.setToEmpty = function(){
	this.color = null;
	this.empty = true;
	this.blockVisual.baseSprite.alpha = 0;
	this.blockVisual.f_faceParent.alpha = 0;
}

Cell.prototype.setToFull = function(){
	this.blockVisual.baseSprite.alpha = 1;
	this.blockVisual.f_faceParent.alpha = 1;
};

Cell.prototype.setColor = function(color){
	this.color = color;
	this.blockVisual.setColor(color);
}

Cell.prototype.destroyAnim = function(delay, onComplete){
	
	if(this.empty || this.blocked){
		if(onComplete){
			onComplete.call(this, this);
		}
		return;
	}
	delay = delay==undefined?0:delay;

	this.blockVisual.boardDestroyAnim(delay, function(){
		if(onComplete){
			onComplete.call(this, this);
		}
	}.bind(this));
	this.hideGlow();

	
	var launchObj = function(p, tweenTime){
		var dummy = {value:0};
		var dummyTween = this.game.add.tween(dummy).to({value: 1}, tweenTime, Phaser.Easing.Linear.None, true);
		var launchAngle = this.game.rnd.realInRange(Math.PI/2-0.3, Math.PI/2+0.3);
		var v0 = this.game.rnd.realInRange(750, 1000);
		var t = 0;
		var startPos = p.position.clone();
		
		p.scaleTween = this.game.add.tween(p.scale).to({x: 0, y: 0}, 200, Phaser.Easing.Sinusoidal.InOut, true, tweenTime-200);
		
		dummyTween.onUpdateCallback(function(){
			var x = v0* Math.cos(launchAngle)*t;
			
			var y = v0*Math.sin(launchAngle)*t - (0.5)*4000*Math.pow(t,2);
			t+= this.game.time.physicsElapsed;
			p.position.setTo(startPos.x + x, startPos.y-y);
		}, this);
		
		return dummyTween;
	};
	
	var spawnChunk = function(){
		var p = this.chunkQueue.popFront();
		if(!p){
			return;
		};
		p.alpha = 1;
		
		switch(this.color){
			case "yellow":
				p.visual.loadTexture("3D_block_Yellow");
				break;
			case "orange":
				p.visual.loadTexture("3D_block_Orange");
				break;
			case "purple":
				p.visual.loadTexture("3D_block_PURPLE");
				
				break;
			case "red":
				p.visual.loadTexture("3D_block_red");
				break;
			case "blue":
				p.visual.loadTexture("3D_block_Blue");
				break;
		}
		p.position.setTo(this.getWorldPos().x, this.getWorldPos().y);
		p.rotTween = this.game.add.tween(p).to({angle: "360"}, 1000, Phaser.Easing.Linear.None, true);
		p.scale.setTo(this.game.rnd.realInRange(this.blockVisual.baseScale.x/2, this.blockVisual.baseScale.x));
		launchObj.call(this, p, 1000).onComplete.add(function(){
			this.chunkQueue.pushBack(p);
		}, this);

		
	}
	this.game.time.events.add(delay + 150, function(){
		
		for(var i = 0; i<10; i++){
			spawnChunk.call(this);
		}
	}, this);
	
};

Cell.prototype.shakeAnim = function(){
	if(this.isShaking){
		return;
	}
	this.isShaking = true;
	var shakeCircle = new Phaser.Circle(this.parent.x, this.parent.y, 10);
	
	Util.shake.call(this, shakeCircle, this.parent, 8, null, function(){this.isShaking=false;}.bind(this));
}

Cell.prototype.appearAnim = function(delay){
	this.blockVisual.alpha = 1;
	this.blockVisual.scale.setTo(0);
	this.blockVisual.scaleTween = this.game.add.tween(this.blockVisual.scale).to({x: this.blockVisual.baseScale.x, y: this.blockVisual.baseScale.y}, 200, Phaser.Easing.Back.Out, true, delay);
	return this.blockVisual.scaleTween;
};