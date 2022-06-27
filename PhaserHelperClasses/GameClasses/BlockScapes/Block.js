function Block(_game, _blockArr, _color, _cellSize, _trayScale, _parent){
	this.game = _game;
	Phaser.Group.call(this, _game, _parent);
	this.blockArr = Util.deepCopyObject(_blockArr);
	this.color = _color;
	this.cellSize = _cellSize;
	this.trayScale = new Phaser.Point(_trayScale, _trayScale);

	this.rows = this.blockArr.length;
	this.cols = this.blockArr[0].length;
	this.bounds = new Phaser.Rectangle(0,0,this.cols*this.cellSize, this.rows*this.cellSize);
	this.shadowGroup = this.game.add.group(this);
	this.bounds.centerOn(0,0);
	this.blockMap = new Map();
	this.SM = new StateMachine("SPAWNING", "RESTING", "DRAG", "PAUSE", "RETURNING");
	this.onClick = new Phaser.Signal();
	this.initBlockSM();
	
	for(var row = 0; row< this.rows; row++){
		this.blockArr[row] = this.blockArr[row].split('');
		for(var col = 0; col< this.blockArr[row].length; col++){
			if(this.blockArr[row][col]== " "){
				continue;
			}
			var centerX = Phaser.Math.linear(this.bounds.left, this.bounds.right, (col+0.5)/this.cols);
			var centerY = Phaser.Math.linear(this.bounds.top, this.bounds.bottom, (row+0.5)/this.rows);

			var cell = new BSBlock(this.game, this);
			cell.resizeWithWidth(this.cellSize*1.8);
			cell.position.setTo(centerX, centerY);
			cell.blockOffset = {row: row, col: col};
			this.blockMap.set(Util.cantorPair(row, col), cell);
			cell.setColor(this.color);
			var shadowBlock = this.game.add.sprite(centerX + this.cellSize/3, centerY + this.cellSize/3, this.color=="purple"?"shadow_glasses":"shadow", null, this.shadowGroup).setAnchor(0.5);
			shadowBlock.resizeWithWidth(this.cellSize*1.7);
			shadowBlock.alpha = 0.5;
		};
	}
	this.SM.changeState("RESTING");
	this.sort('y', Phaser.Group.SORT_DESCENDING);
	this.sendToBack(this.shadowGroup);
}

Block.prototype = Object.create(Phaser.Group.prototype);
Block.prototype.constructor = Block;

Block.prototype.initShowGlow = function(sparkleQueue){
	
	this.blockMap.forEach(function(value, key){
		
		value.showGlow = BSBoard.showGlow.bind(value, new Phaser.Circle(value.centerX, value.centerY, this.cellSize), sparkleQueue, this);
		value.hideGlow = BSBoard.hideGlow.bind(value);

		
	}, this);
	
}

Block.prototype.showGlow = function(upperLeft, glowData){
	
	this.blockMap.forEach(function(value, key){
		var boardCoord = {row: upperLeft.row + value.blockOffset.row, col: upperLeft.col + value.blockOffset.col};
		if(glowData.rowsToDestroy.includes(boardCoord.row) || glowData.colsToDestroy.includes(boardCoord.col)){
			value.showGlow();
		}else{
			value.hideGlow();
		}
		
	}, this);
}

Block.prototype.hideGlow = function(){
	this.blockMap.forEach(function(value, key){
		if(value.hideGlow){
			value.hideGlow();
		}
		
	}, this);
};

Block.prototype.changeFaceState = function(state, arg){
	this.blockMap.forEach(function(value, key){
		value.faceSM.changeState(state, arg);
	}, this);
};

Block.prototype.initBlockSM = function(){
	
	var mouseOffset = new Phaser.Point();
	var targetScale = this.trayScale;
	var thetaMod = 5;
	var scalePosTheta = 1;
	var startScale = this.scale.clone();
	var startPos = this.position.clone();
	this.SM.states.RESTING.onEnter.add(function(data){
		
	}, this);
	
	var updateScale = function(tweenFunction){
		this.scale = Phaser.Point.interpolate(startScale, targetScale, tweenFunction.call(this, scalePosTheta));
		
		
	};
	var updatePos = function(targetPos, tweenFunction){
		this.position = Phaser.Point.interpolate(startPos, targetPos, tweenFunction.call(this, scalePosTheta));
		
	};
	//we want to update the scale in these two states;

	this.SM.states.RESTING.onEnter.add(function(data){
		
	
	}, this);
	
	
	this.SM.states.DRAG.onEnter.add(function(data){
		
		scalePosTheta = 0;
		mouseOffset = data.mouseOffset.clone();
		startScale = this.scale.clone();
		startPos = this.position.clone();
		targetScale = new Phaser.Point(1, 1);
	}, this);
	this.SM.states.DRAG.onUpdate.add(function(data){
		scalePosTheta+= this.game.time.physicsElapsed * thetaMod;
		scalePosTheta = Math.min(1,scalePosTheta);
		var mousePos = new Phaser.Point(this.game.input.activePointer.x + Global.cameraOffsetX, this.game.input.activePointer.y + Global.cameraOffsetY);
		var targetPos = new Phaser.Point(mousePos.x + mouseOffset.x, mousePos.y + mouseOffset.y);
		this.position = Phaser.Point.interpolate(this.position, targetPos, this.game.time.physicsElapsed*20);
		updateScale.call(this, Phaser.Easing.Back.Out);
		
	}, this);
	
	
	var pauseTime = 0;
	this.SM.states.RETURNING.onEnter.add(function(data){
		scalePosTheta = 0;
		targetScale = this.trayScale;

		startScale = this.scale.clone();
		startPos = this.position.clone();
		if(data.misplaced){
			Util.shake.call(this, new Phaser.Circle(startPos.x, startPos.y, 10), this, 10);
			pauseTime = 0.5;
		}
		
	}, this);
	
	this.SM.states.RETURNING.onUpdate.add(function(data){
		pauseTime-=this.game.time.physicsElapsed;
		if(pauseTime>0){
			return;
		}
		scalePosTheta+= this.game.time.physicsElapsed * thetaMod;
		scalePosTheta = Math.min(1,scalePosTheta);
		
		updatePos.call(this, this.basePos, Phaser.Easing.Sinusoidal.InOut);
		updateScale.call(this, Phaser.Easing.Sinusoidal.InOut);
		
		if(scalePosTheta>=1){
			this.SM.changeState("RESTING");
		}
		
	}, this);
	
	this.SM.onUpdateSignal.add(function(){
		this.blockArr.forEach(function(b){
			if(b.faceSM){
				b.faceSM.onUpdate();
			}
			
		}, this);
	}, this);

}

Block.prototype.initMouseDown = function(callback){
	this.blockMap.forEach(function(value, key){
		value.baseSprite.inputEnabled = true;
		value.baseSprite.events.onInputDown.add(function(){
			this.onClick.dispatch(this, value);
			callback.call(this, this, value);
		}, this);
	}, this);
};

Block.prototype.getUpperLeft = function(){
	return new Phaser.Point(this.bounds.left + this.x + this.cellSize/2, this.bounds.top + this.y + this.cellSize/2);
};






















