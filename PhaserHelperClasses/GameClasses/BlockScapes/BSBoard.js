/**
 *
 */


//W X H
const BLOCKTYPE = {
	_1x1: ["X"],
	_2x1: ["XX"],
	_1x2: ["X",
	       "X"],
   _3x2T: ["XXX",
           " X "],
   _3x2T270: ["X ",
              "XX",
              "X "],
  _3x2T90: [" X",
            "XX",
            " X"],
   _3x2T180: [" X ",
              "XXX"],
   _2x2L: ["X ",
           "XX"],
   _2x2L180: ["XX",
              "X "],
//   _3x3: ["XXX",
//          "XXX",
//          "XXX"],
   _2x2: ["XX",
          "XX"],
//   _4x1: ["XXXX"],
//   _1x4: ["X",
//          "X",
//          "X",
//          "X"],
   _2x2J: [" X",
           "XX"],
   _2x2J180: ["XX",
              " X"],
    _3x1: ["XXX"],
    _1x3: ["X",
           "X",
           "X"],
//    _P_0: ["XX",
//           "XX",
//           "X "],
//    _3x2: ["XXX",
//           "XXX"],
    _2x3J180: ["XX",
               "X ",
               "X "],
    _3x2L: ["XXX",
            "X  "],
    _3x2Z: ["XX ",
            " XX"],
//    _2x3L180: ["XX",
//               " X",
//               " X"],
                    
           
    
	
}

function BSBoard (_game, _boardBacking, _trayBacking) {
	
	this.game = _game;
	Phaser.Group.call(this, this.game);
	this.boardBacking = _boardBacking;
	this.trayBacking = _trayBacking;
	this.boardDC = this.game.add.graphics(0,0);
	this.trayDC = this.game.add.graphics(0,0);
	this.boardBacking.parent.add(this.boardDC);
	this.trayBacking.parent.add(this.trayDC);
	this.boardBounds = new Phaser.Rectangle().copyFrom(this.boardBacking);

	this.boardBounds.centerOn(this.boardBacking.x, this.boardBacking.y);
	
	this.trayBounds = new Phaser.Rectangle().copyFrom(this.trayBacking);

	this.trayBounds.centerOn(this.trayBacking.x, this.trayBacking.y);
	
	this.boardBacking.alpha = 0;
	this.trayBacking.alpha = 0;
	this.boardArr = [];
	//init vars
	this.trayBlocks = [];
	
	this.piecesLoaded = 0;
	this.SM = new StateMachine("PLACING", "FEEDBACK", "LOCKED", "GAMEOVER");
	
	
};

BSBoard.prototype = Object.create(Phaser.Group.prototype);
BSBoard.prototype.constructor = BSBoard;


BSBoard.prototype.initialize = function(rows, cols, _initTrayData, _trayParent, _dragParent, _fxParent){
	
	this.initTrayData = _initTrayData;
	this.blocksParent = this.game.add.group(this);
	this.trayParent = _trayParent;
	this.dragParent = _dragParent;
	this.FXParent = _fxParent;
	this.glowSparkleQueue = new ParticleQueue(this.game, this.FXParent);
	this.glowSparkleQueue.initParticles(["sparkle_particle"], 100);
	this.currentDragBlock = null;
	this.chunkQueue = new ParticleQueue(this.game, this.FXParent);
	this.chunkQueue.initParticles(["3D_block_Blue"], 100);
	
	for(var i = 0; i< this.initTrayData.maxSlots; i++){
		this.trayBlocks.push(null);
	}
	this.trayQueue = Util.deepCopyObject(this.initTrayData.shapeQueue);
	this.colorQueue = Util.deepCopyObject(this.initTrayData.colorQueue);
	//render board
	this.rows = rows;
	this.cols = cols;
	
	this.cellSize = Math.min(this.boardBounds.width/this.cols, this.boardBounds.height/this.rows);
	
	
	this.boardArr = [];
	for(var row = 0; row< this.rows; row++){
		
		this.boardArr.push([]);
		for(var col = 0; col< this.cols; col++){
			var centerX = Phaser.Math.linear(this.boardBounds.left, this.boardBounds.right, (col+0.5)/this.cols);
			var centerY = Phaser.Math.linear(this.boardBounds.top, this.boardBounds.bottom, (row+0.5)/this.rows);
			
			var newCell = new Cell(this.game, row, col, true, this.cellSize, this.blocksParent, this.FXParent, new Phaser.Point(centerX, centerY), this.chunkQueue);
			
			var fxLocalPos = this.worldTransform.apply(newCell.position);
			newCell.showGlow = BSBoard.showGlow.bind(newCell.blockVisual, new Phaser.Circle(fxLocalPos.x,fxLocalPos.y, newCell.width), this.glowSparkleQueue, this.FXParent);
			newCell.hideGlow = BSBoard.hideGlow.bind(newCell.blockVisual);
			this.boardArr[row].push(newCell);

		};
	}
	this.blocksParent.sort('y', Phaser.Group.SORT_DESCENDING);
	
	
	
	this.trayBacking.inputEnabled=true;
	
	this.trayBacking.events.onInputDown.add(function(){
		var mousePos = Phaser.State.prototype.getMousePos.call(this);
		var clickPos = this.game.world.worldTransform.apply(this.trayBacking.parent.worldTransform.applyInverse(mousePos));
		var index = 0;
		if(Global.orientation == "l"){
			index = Util.unlerp(this.trayBacking.top, this.trayBacking.bottom, clickPos.y);
			console.log(Math.floor(index*3));
		}else{
			index = Util.unlerp(this.trayBacking.left, this.trayBacking.right, clickPos.x);
			console.log(Math.floor(index*3));
		};
		index = Math.floor(index*3);
		console.log(this.trayBlocks, index, this.trayBlocks[index]);
		this.onBlockClick(this.trayBlocks[index]);
	}, this);
	
	//this.renderBoard(this.initBoardData, false);
	//render Tray
	this.initSM();
};

BSBoard.prototype.onBlockClick = function(block, cell){
	if(!this.SM.checkState("PLACING")){
		return;
	}
	if(!block.SM.checkState("RESTING")){
		return;
	}
	if(!block){
		return;
	}
	if(Global.isSIP){
		return;
	}
	if(!block.isPlacable){
		return;
	}
	
	
	this.game.add.sound("click_tap").play();
	var mousePos = Phaser.State.prototype.getMousePos.call(this);
	if(block.scaleTween){
		block.scaleTween.stop();
	}
	block.parent.bringToTop(block);
	var mouseOffset = Phaser.Point.subtract(block.position,mousePos);
	this.currentDragBlock = block;
	this.currentDragBlock.SM.changeState("DRAG", {mouseOffset: mouseOffset});
	this.SM.states.PLACING.SM.changeState("DRAGGING");
}

BSBoard.prototype.changeBoardCellsFaceState = function(state, arg){
	for(var row = 0; row< this.rows; row++){
		for(var col = 0; col< this.cols; col++){
			if(this.boardArr[row][col].empty){
				continue;
			}
			this.boardArr[row][col].blockVisual.faceSM.changeState(state, arg);
		}
	}
}

BSBoard.prototype.initSM = function(){
	var goodSounds = [];
	var badSounds = [];
	var anticipationSounds = [];
	var addToQueue = function(key, queue, loop){
		var newSound = this.game.add.sound(key, 1, loop);
		newSound.queue = queue;
		queue.push(newSound);
	}.bind(this);
	for(var i = 0; i< 3; i++){
		addToQueue("COMBINED_VO_genericPositive_mixdown_1", goodSounds, false);
		addToQueue("COMBINED_VO_genericNeg_mixdown_1", badSounds, false);
		addToQueue("VO_COMBINED_Anticipation_mixdown_1", anticipationSounds, true);
	}
	var currentSound = null;
	var nextSoundEvent = null;
	var playSound = function(queue){
		console.log(currentSound);
		if(currentSound){
			console.log("stopping");
			currentSound.fadeOut(500);
			currentSound.queue.push(currentSound);
		}
		if(nextSoundEvent){
			this.game.time.events.remove(nextSoundEvent);
		}
		currentSound = queue.shift();
		currentSound.volume = 1;
		nextSoundEvent = this.game.time.events.add(300, function(){
			console.log("starting");
			currentSound.play();
		}, this);
//		if(currentSound.isPlaying){
//			
//		}else{
//			currentSound.play();
//		}
		
		
		
	}
	
	this.SM.states.PLACING.SM = new StateMachine("DRAGGING", "CHOOSING");

	this.SM.states.PLACING.SM.states.DRAGGING.onEnter.add(function(){
		playSound.call(this, anticipationSounds);
		this.changeBoardCellsFaceState("WATCHING", {blockToFollow: this.currentDragBlock});
	}, this);
	
	this.game.input.onUp.add(function(){
		
		if(this.currentDragBlock){
			this.changeBoardCellsFaceState("DEFAULT");
			var boardCoord = this.getCellFromWorldPos(this.currentDragBlock.getUpperLeft());
			var fillCells = this.getPieceFit(boardCoord.row,boardCoord.col, this.currentDragBlock);
			
			if(fillCells){
				fillCells.forEach(function(cell){
					cell.hideGlow();
				}, this);
				//could have callback if the animation for placing is complex;
				this.currentDragBlock.hideGlow();
				
				this.game.add.sound("block_place").play();
				this.placePiece(this.currentDragBlock, fillCells);
				
				
				this.SM.changeState("FEEDBACK", {cellsToFill: fillCells});
				this.currentDragBlock.changeFaceState("DESTROY");
				this.currentDragBlock.destroy();
			}else{
				
				playSound.call(this, badSounds);
				
				this.SM.states.PLACING.SM.changeState("CHOOSING");
				this.currentDragBlock.SM.changeState("RETURNING", {misplaced: true});
				this.changeBoardCellsFaceState("NERVOUS");
				this.currentDragBlock.changeFaceState("NERVOUS");
				this.iterateAllCells(function(cell){
					cell.hideGlow();
				}.bind(this));
				this.currentDragBlock.hideGlow();
			};
			
		}
		
		this.currentDragBlock = null;
	}, this);

	
	//render once for persistant board
	this.SM.states.PLACING.onEnter.add(function(data){
		console.log(this.toString());
		this.SM.states.PLACING.SM.changeState("CHOOSING");
		
		this.trayBlocks.forEach(function(block){
			if(block == null){
				this.shiftTrayQueue(true, this.colorQueue.shift(), this.dragParent, true);
			}
			
		}, this);
		var i = 0;
		this.trayBlocks.forEach(function(block){
			
			block.isPlacable = true;
			console.log(this.getPieceFitCoord(i), block.trayIndex, i);
			if(block.alphaTween){
				block.alphaTween.stop();
			}
			if(!this.getPieceFitCoord(i)){
				block.isPlacable = false;
				
				block.alphaTween = this.game.add.tween(block).to({alpha: 0.5}, 300, Phaser.Easing.Linear.None, true);
				//block.changeFaceState("NERVOUS", {persistant: true})
			}else{
				//block.changeFaceState("DEFAULT", {persistant: true})
				block.alphaTween = this.game.add.tween(block).to({alpha: 1}, 300, Phaser.Easing.Linear.None, true);
			}
				
			i++;
		}, this);
		
		var numPresent = 0;
		this.iterateAllCells(function(cell){
			if(!cell.empty){
				numPresent++;
			}
		}.bind(this));
		if(numPresent==0 || this.piecesLoaded >=20){
			this.SM.changeState("GAMEOVER", {outOfMoves: false});
		}
		
		//out of moves
		
		var validMove = this.getPieceFitCoord();
		if(!validMove){
			this.SM.changeState("GAMEOVER", {outOfMoves: true});
		};
		
		
		
		
		
	}, this);
	
	var dc = this.game.add.graphics(0,0);
	
	var lastCoord = null;
	
	var coordsEqual = function(c1, c2){
		if(!c1 || !c2){
			return false;
		}
		return (c1.row == c2.row && c1.col == c2.col);
	}.bind(this);
	
	this.SM.states.PLACING.onUpdate.add(function(data){
		dc.clear();
		if(this.currentDragBlock){
			var currentCoord = this.getCellFromWorldPos(this.currentDragBlock.getUpperLeft());
			if(!coordsEqual(currentCoord, lastCoord)){
				
				if(currentCoord){
					this.iterateAllCells(function(cell){
						cell.hideGlow();
					}.bind(this));
					var prospectFillCells = this.getPieceFit(currentCoord.row, currentCoord.col, this.currentDragBlock);
					
					if(prospectFillCells.length>0){
						prospectFillCells.forEach(function(cell){
							cell.showGlow();
						}, this);
						var glowData = this.resolveBoard(prospectFillCells, true);
						
						this.iterateDestroyData(glowData, function(cell){
							
							if(!cell.empty){
								cell.showGlow();
								
							}
						}.bind(this));
						if(glowData.rowsToDestroy.length>0 || glowData.colsToDestroy.length>0){
							this.currentDragBlock.showGlow(currentCoord, glowData);
						}else{
							
							this.currentDragBlock.hideGlow();
						}
						
					}else{
						this.currentDragBlock.hideGlow();
						
					}
					
				}else{
					if(lastCoord){
						this.currentDragBlock.hideGlow();
						this.iterateAllCells(function(cell){
							cell.hideGlow();
						}.bind(this));
					}
				}
			}else{
				
			}
		}
		
		lastCoord = currentCoord;
		
	}, this);

	this.SM.onUpdateSignal.add(function(){
		for(var row = 0; row< this.rows; row++){
			for(var col = 0; col< this.cols; col++){
				if(this.boardArr[row][col].empty){
					continue;
				}
				this.boardArr[row][col].blockVisual.faceSM.onUpdate();
			}
		}
		this.trayBlocks.forEach(function(block){
			if(block){
				block.SM.onUpdate();
			}
		}, this);
	}, this);
	
	
	
	this.SM.states.FEEDBACK.onEnter.add(function(data){
		if(data.outOfMoves){
			console.log("out of moves");
			this.SM.changeState("GAMEOVER");
			return;
		}
		
		var destroyData = this.resolveBoard(data.cellsToFill);
		
		var alreadyDestoyed = new Set();
		var targetBlocksToDestroy = destroyData.rowsToDestroy.length * this.cols + destroyData.colsToDestroy.length * this.rows - (destroyData.rowsToDestroy.length*destroyData.colsToDestroy.length);
		
		
		var destroyBlock = function(row, col, isRow, onComplete){
			
			var delay = isRow?col *100:row*100;
			//blegh
			var delta = 0;
			if(isRow){
				var curCol = col;
				while(curCol>0){
					if(this.getCell(row, curCol).empty){
						delay-=100;
					}
					curCol--;
				}
			}else{
				var curRow = row;
				while(curRow>0){
					if(this.getCell(curRow, col).empty){
						delay-=100;
					}
					curRow--;
				}
			}
			this.getCell(row, col).destroyAnim(delay, function(){
				this.setToEmpty(row, col);
				if(onComplete){
					onComplete.call(this);
					
				}
				
			}.bind(this));
		};
		var numDestroyed = 0;
		this.iterateDestroyData(destroyData, function(cell, isRow){
			if(alreadyDestoyed.has(cell.id)){
				return;
			}
			
			cell.blockVisual.faceSM.changeState("MATCH");
			alreadyDestoyed.add(cell.id);
			var destroyTween = destroyBlock.call(this, cell.row, cell.col, isRow, function(){
				numDestroyed++;
				if(numDestroyed == targetBlocksToDestroy){
					
					this.SM.changeState("PLACING");
				}
			}.bind(this));
			
		}.bind(this));
		
		if(destroyData.rowsToDestroy.length + destroyData.colsToDestroy.length > 0){
			
			
			this.game.add.sound("goal_complete").play();
			playSound.call(this, goodSounds);
		}else{
			currentSound.fadeOut();
		}
		//this.game.add.sound("line_clear_04").play();
		if(targetBlocksToDestroy==0){
			this.SM.changeState("PLACING");
			
		};
		
		
		
		
	}, this);
	var launchObj = function(p, tweenTime){
		var dummy = {value:0};
		var dummyTween = this.game.add.tween(dummy).to({value: 1}, tweenTime, Phaser.Easing.Linear.None, true);
		var launchAngle = this.game.rnd.realInRange(Math.PI/2-0.1, Math.PI/2+0.1);
		var v0 = this.game.rnd.realInRange(500, 750);
		var t = 0;
		var startPos = p.position.clone();
		p.scaleTween = this.game.add.tween(p.scale).to({x: "1", y: "1"}, tweenTime, Phaser.Easing.Linear.None, true);
		p.alphaTween = this.game.add.tween(p).to({alpha: 0}, 200, Phaser.Easing.Linear.None, true, tweenTime-200);
		var g = 4000;

		dummyTween.onUpdateCallback(function(){
			var x = v0* Math.cos(launchAngle)*t;
			
			var y = v0*Math.sin(launchAngle)*t - (0.5)*g*Math.pow(t,2);

			t+= this.game.time.physicsElapsed;
			p.position.setTo(startPos.x + x, startPos.y-y);
			yPrev = y;
		}, this);
		
		return dummyTween;
	};
	
	this.SM.states.GAMEOVER.onEnter.add(function(data){
		currentSound.fadeOut();
		if(data.outOfMoves){
			this.changeBoardCellsFaceState("NERVOUS", {persistant: true});
			this.iterateAllCells(function(cell){
				cell.position.setTo(cell.getWorldPos().x, cell.getWorldPos().y);
				this.FXParent.add(cell);
				
				this.game.time.events.add(this.game.rnd.realInRange(500, 1000), function(){
					launchObj.call(this, cell, 5000);
				}, this);
				
			}, this);
		}else{
			this.changeBoardCellsFaceState("MATCH");
		}
		
	}, this);
}

BSBoard.prototype.toString = function(){
	var retStr = "";
	for(var row = 0; row< this.rows; row++){
		for(var col = 0; col< this.cols; col++){
			if(!this.getCell(row,col).empty){
				retStr+='■';
			}
			else{
				retStr+=" ";
			}
		}
		retStr+='\n';
	};
	return retStr;
}
//only if a new puzzle has the same board dims, if not, just make another BS Board object
//this reuses the objects we initialized in BSBoard.prototype.initialize
//all this should do is populate the board with tiles
BSBoard.prototype.renderBoard = function(_boardData, animate){
	
	var getColor = function(char){
		switch(char.toUpperCase()){
			case "Y":
				return "yellow";
			case "R":
				return "red";
			case "P":
				return "purple";
			case "O":
				return "orange";
			case "B":
				return "blue";
			default:
				return "yellow";
		};
	}.bind(this);
	
	if(_boardData.blocks.length!= this.rows || _boardData.blocks[0].length!= this.cols){
		console.log("board data does not match existing dimensions");
		console.log(_boardData.blocks.length, _boardData.blocks[0].length, this.rows, this.cols);
		return;
	}
	this.initBoardData = _boardData;
	
	for(var row = 0; row< this.rows; row++){
		
		this.initBoardData.blocks[row] = this.initBoardData.blocks[row].split("");
		for(var col = 0; col< this.cols; col++){
			var cell = this.getCell(row, col);
			cell.setColor(getColor(this.initBoardData.blocks[row][col]));
			cell.setToFull();
			cell.empty = false;
			
			if(this.initBoardData.blocks[row][col]== " "){
				this.setToEmpty(row, col);
			}else if(this.initBoardData.blocks[row][col]== "X"){
				this.setToEmpty(row, col);
				cell.blocked = true;
			}
			//this.boardArr[row].push(newCell);
			if(animate && !cell.empty){
				cell.appearAnim(0);
			}
		}
	}
	this.blocksParent.sort('y', Phaser.Group.SORT_DESCENDING);
}

BSBoard.prototype.getCell = function(row, col){
	return this.boardArr[row][col];
}

BSBoard.prototype.getNumTrayBlocks = function(){
	return this.trayBlocks.filter(function(e){
		return e!=null;
	}, this).length;
}

//kinda a twisted way to do it but I didn't wanna write this function multiple times :/
BSBoard.showGlow = function(spawnCircle, sparkleQueue, fxParent){
	if(this.isGlowing){
		return;
	}
	this.isGlowing = true;
	if(this.glowSprite.alphaTween){
		this.glowSprite.alphaTween.stop();
	}
	this.glowSprite.alphaTween = this.game.add.tween(this.glowSprite).to({alpha: 1}, 100, Phaser.Easing.Linear.None, true);
	
	var spawnGlowSparkle = function(){
		if(!this.isGlowing){
			return;
		}
		var p = sparkleQueue.popFront();
		this.game.time.events.add(this.game.rnd.realInRange(50, 75), spawnGlowSparkle.bind(this), this);
		if(!p){
			return;
		}
		fxParent.add(p);
		var pos = spawnCircle.random();
		p.position.setTo(pos.x, pos.y);
		p.alpha = 1;
		p.scale.setTo(0);
		var endScale = this.game.rnd.realInRange(0.3, 0.7);
		p.scaleTween = this.game.add.tween(p.scale).to({x: endScale, y: endScale}, 300, Phaser.Easing.Sinusoidal.InOut, true, 0, 0, true);
		p.rotTween = this.game.add.tween(p).to({angle: "360"}, 600, Phaser.Easing.Linear.None, true);
		p.scaleTween.onComplete.add(function(){
			sparkleQueue.pushBack(p);
			//spawnGlowSparkle.call(this);
		}, this);
		
		
	};
	
	spawnGlowSparkle.call(this);
	
}

BSBoard.hideGlow = function(obj){
	if(!this.isGlowing){
		return;
	}
	this.isGlowing = false;
	if(this.glowSprite.alphaTween){
		this.glowSprite.alphaTween.stop();
	}
	this.glowSprite.alphaTween = this.game.add.tween(this.glowSprite).to({alpha: 0}, 100, Phaser.Easing.Linear.None, true);
	
};

const CHUNK_COLORS = {
	red: 0xff0810,
	yellow: 0xffe226,
	orange: 0xff9d1d,
	purple: 0xd035ff
};



BSBoard.prototype.outOfMovesAnim = function(onComplete){
	this.iterateAllCells(function(cell){
		if(!cell.empty){
			cell.grayAnim(cell.row * 100);
		}
	}, this);
	this.game.time.events.add(this.rows * 100, function(){
		if(onComplete){
			onComplete.call(this);
		}
	}, this);
};



BSBoard.prototype.isFull = function(){
	var isFull = true;
	this.iterateAllCells(function(cell){
		if(!isFull){
			return;
		}
		if(!cell.blocked){
			if(cell.empty){
				isFull = false;
			}
		}
	}.bind(this));
	return isFull;
}

BSBoard.prototype.getTrayIndexLoc = function(index){
	if(index>=this.initTrayData.maxSlots){
		return;
	}
	var x = Global.orientation=="p"?Phaser.Math.linear(this.trayBacking.left, this.trayBacking.right, (index+0.5)/this.initTrayData.maxSlots): this.trayBacking.centerX;
	var y = Global.orientation=="p"?this.trayBacking.centerY:Phaser.Math.linear(this.trayBacking.top, this.trayBacking.bottom, (index+0.5)/this.initTrayData.maxSlots);
	

	return new Phaser.Point(x, y);
}
BSBoard.prototype.shiftTrayQueue = function(generateRandom, color, parent, doAnimate){
	
	doAnimate = doAnimate == undefined?true:doAnimate;
	this.piecesLoaded++;
	var trayIndex = 0;
	for(trayIndex = 0; trayIndex<this.trayBlocks.length; trayIndex++){
		if(this.trayBlocks[trayIndex] == null){
			break;
		};
	}
	if(trayIndex == this.trayBlocks.length){
		console.log("FULL!!");
		return;
	}
	var blockArr = this.trayQueue.shift();
	if(blockArr == undefined){
		if(generateRandom){
			var keys = Object.keys(BLOCKTYPE);

			blockArr = BLOCKTYPE[this.game.rnd.pick(keys)];
		}else{
			console.log("No more shapes!!");
			return;
		};
		
	}
	color = color==undefined?this.game.rnd.pick(["red", "orange", "yellow", "blue", "purple"]):color;
	var newBlock = new Block(this.game, blockArr, color, this.cellSize, 40/this.cellSize, parent);
	
	//diff if horizontal or vertical tray

	newBlock.basePos = this.game.world.worldTransform.applyInverse(this.trayParent.worldTransform.apply(this.getTrayIndexLoc(trayIndex)));

	
	newBlock.position.setTo(newBlock.basePos.x, newBlock.basePos.y);
	
	newBlock.initMouseDown(this.onBlockClick.bind(this));
	newBlock.initShowGlow(this.glowSparkleQueue);
	
	this.trayBlocks[trayIndex] = newBlock;
	newBlock.trayIndex = trayIndex;
	//anim
	newBlock.SM.changeState("SPAWNING");
	newBlock.scale.setTo(0);
	if(doAnimate){
		newBlock.spawnTween = this.game.add.tween(newBlock.scale).to({x: newBlock.trayScale.x, y: newBlock.trayScale.y}, 300, Phaser.Easing.Back.Out, true);
		newBlock.spawnTween.onComplete.add(function(){
			if(newBlock.SM.checkState("SPAWNING")){
				newBlock.SM.changeState("RESTING");
			}
		}, this);
	}else{
		newBlock.scale.setTo(newBlock.trayScale.x, newBlock.trayScale.y);
		newBlock.SM.changeState("RESTING");
	}
	
	return newBlock;
};

BSBoard.prototype.validCoord = function(row, col){
	return row>=0 && row<this.rows && col>=0 && col< this.cols;
};

BSBoard.prototype.getCellFromWorldPos = function(worldPos){
	
	var localPos = this.game.world.worldTransform.apply(this.parent.worldTransform.applyInverse(worldPos));

	var closestCol = Math.floor(Util.unlerp(this.boardBounds.left, this.boardBounds.right, localPos.x) * this.cols);
	var closestRow = Math.floor(Util.unlerp(this.boardBounds.top, this.boardBounds.bottom, localPos.y) * this.rows);
	
	
	return this.validCoord(closestRow, closestCol)?{row: closestRow, col: closestCol}: false;
}

BSBoard.prototype.getPieceFit = function(upperLeftRow, upperLeftCol, piece){
	if(!piece){
		return false;
	}
	var cellsToPopulate = [];
	for(var rowOffset = 0; rowOffset< piece.rows; rowOffset++){
		
		for(var colOffset = 0; colOffset< piece.cols; colOffset++){
			
			var coordToCheck = {row: upperLeftRow+ rowOffset, col: upperLeftCol+ colOffset};
			
			if(!this.validCoord(coordToCheck.row, coordToCheck.col)){
				return false;
			}
			if(piece.blockArr[rowOffset][colOffset]!="X"){
				continue;
			};
			
			if(!this.boardArr[coordToCheck.row][coordToCheck.col].empty){
				return false;
			}else if(this.boardArr[coordToCheck.row][coordToCheck.col].blocked){
				return false;
			}
			
			
			cellsToPopulate.push(this.boardArr[coordToCheck.row][coordToCheck.col]);
		}
	}
	return cellsToPopulate;
};


BSBoard.prototype.resetTray = function(newTrayQueue){
	this.trayBlocks.forEach(function(trayPiece){
		if(!trayPiece){
			return;
		}
		this.clearTrayOfPiece(trayPiece);
		trayPiece.destroy();
	}, this);
	this.trayQueue = newTrayQueue || [];
};

BSBoard.prototype.clearTrayOfPiece = function(piece){
	var trayIndex = this.trayBlocks.indexOf(piece);
	this.trayBlocks[trayIndex] = null;
}
BSBoard.prototype.placePiece = function(piece, cellsToFill){
	this.clearTrayOfPiece(piece);
	cellsToFill.forEach(function(cell){
		
		cell.setToFull();
		cell.setColor(piece.color);
		cell.empty = false;
	}, this);
	
};

BSBoard.prototype.setToEmpty = function(row, col){
	this.boardArr[row][col].empty = true;
	this.boardArr[row][col].setToEmpty();
}


BSBoard.prototype.resolveBoard = function(cellsFilled, notPlaced){
	
	notPlaced = notPlaced==undefined?false:notPlaced;
	var rowsToCheck = new Set();
	var colsToCheck = new Set();
	
	var propectCellIds = new Set();
	if(notPlaced){
		cellsFilled.forEach(function(cell){
			propectCellIds.add(cell.id);
		}, this);
	}
	
	cellsFilled.forEach(function(cell){
		rowsToCheck.add(cell.row);
		colsToCheck.add(cell.col);
	}, this);
		
	var rowsToDestroy = new Set();
	var colsToDestroy = new Set();
	//check rows
	
	rowsToCheck.forEach(function(row){
		for(var col = 0; col< this.cols; col++){
			if(this.getCell(row, col).blocked){
				continue;
			}
			if(this.getCell(row, col).empty && !(propectCellIds.has(this.getCell(row, col).id))){
				return false;
			};
		}
		rowsToDestroy.add(row);
	}, this);
	
	
	//check cols
	colsToCheck.forEach(function(col){
		for(var row = 0; row< this.rows; row++){
			if(this.getCell(row, col).blocked){
				continue;
			}
			if(this.getCell(row, col).empty && !(propectCellIds.has(this.getCell(row, col).id))){
				return false;
			};
		}
		colsToDestroy.add(col);
	}, this);
	
	return {
		rowsToDestroy: Array.from(rowsToDestroy).sort(),
		colsToDestroy: Array.from(colsToDestroy).sort(),
	};
};

BSBoard.prototype.iterateAllCells = function(callback){
	for(var row = 0; row < this.rows; row++){
		for(var col = 0; col < this.cols; col++){
			callback.call(this, this.getCell(row, col));
		};
	};
}

BSBoard.prototype.iterateDestroyData = function(destroyData, callback){
	var alreadyVisited = new Set();
	
	destroyData.rowsToDestroy.forEach(function(row){
		for(var col = 0; col < this.cols; col++){
			callback.call(this, this.getCell(row, col), true);
			alreadyVisited.add(Util.cantorPair(row, col));
		};
		
	}, this);
	
	destroyData.colsToDestroy.forEach(function(col){
		for(var row = 0; row < this.rows; row++){
			if(!alreadyVisited.has(Util.cantorPair(row, col))){
				callback.call(this, this.getCell(row, col), false);
			};
			
		};
	}, this);
	
}


//TODO
//make better priority score:)
BSBoard.prototype.getPieceFitCoord = function(trayIndex){
	
	var hintPrioQueue = new PriorityQueue();
	
	this.trayBlocks.forEach(function(block){
		if(!block){
			return;
		}
		if(trayIndex){
			if(block.trayIndex!=trayIndex){
				return;
			}
		}
		this.iterateAllCells(function(cell){
			var pieceFitData = this.getPieceFit(cell.row, cell.col, block);
			var score = Infinity;
			if(pieceFitData.length>0){
				var fillData = this.resolveBoard(pieceFitData, true);
				score = -1*(fillData.rowsToDestroy.length + fillData.colsToDestroy.length) * block.blockMap.size;
			}
			
			if(pieceFitData){
				hintPrioQueue.enqueue({trayBlock: block, boardCells: pieceFitData}, score);
			}
		}, this);
		if(block.endPos){
			var pieceFitData = this.getPieceFit(block.endPos.row, block.endPos.col, block);
			if(pieceFitData){
				hintPrioQueue.enqueue({trayBlock: block, boardCells: pieceFitData}, -Infinity);
			};
			
		};
		
	}, this);
	
	//
	
	
	return hintPrioQueue.dequeue();
}








