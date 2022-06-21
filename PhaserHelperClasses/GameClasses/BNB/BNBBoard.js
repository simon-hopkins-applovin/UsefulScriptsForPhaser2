

//BNB Board

function BNBBoard(_game, _scene, _backingSprite, _blockParent, _shadowParent, _fxParent, _is3D, _ballBounceBounds){
	
	this.game = _game;
	this.scene =_scene;
	this.backingSprite = _backingSprite;
	this.blockParent = _blockParent;
	this.shadowParent = _shadowParent;
	this.fxParent = _fxParent;
	this.boundsRect = new Phaser.Rectangle().copyFrom(this.backingSprite);
	this.dc = this.game.add.graphics(0,0);
	
	this.boundsRect.centerOn(this.backingSprite.centerX, this.backingSprite.centerY);
	this.stringArr = [];
	this.blockArr = [];
	this.rows = 0;
	this.cols = 0;
	this.backingSprite.alpha = 0;
	this.dc.lineStyle(5, Util.vibesColor());
	
	this.maxPoints = 0;
	this.is3D = _is3D;
	this.ballBounceBounds = _ballBounceBounds;
	this.dc.lineStyle(3, 0xff0000);
	this.sandBlocks = [];
}

BNBBoard.prototype.getBlock = function(row, col){
	if(row>=this.rows || row<0 || col>=this.cols ||col<0){
		return false;
	}
	return this.blockArr[row][col];
};

//_stringArr can also be a key of an image that is a pixel version of the board
BNBBoard.prototype.initializeBoard = function(_stringArr, _smoothEdgeTexture, onComplete){
	this.stringArr = [];
	
	var blockFeedbackQueue = new ParticleQueue(this.game, this.fxParent);
	blockFeedbackQueue.initParticles([], 50);
	
	if(typeof(_stringArr) == 'string'){
		this.stringArr = Util.processImage.call(this, _stringArr, this.pixelCallBack.bind(this));
		
	}else{
		this.stringArr = _stringArr;
	}
	
	this.smoothEdgeArr = Util.processImage.call(this, _smoothEdgeTexture, function(data){
		if(data.r + data.g + data.b ==0){
			return 0;
		}
		return 1;
	}.bind(this));
	
	var topPadding = [];
	var botPadding = [];
	for(var i = 0; i< this.stringArr[0].length; i++){
		topPadding.push(null);
		botPadding.push(null);
	}
		
	this.rows = this.stringArr.length;
	this.cols = this.stringArr[0].length;
		
	var blockWidth = this.boundsRect.width/this.cols;
	var blockHeight = this.boundsRect.height/this.rows;
	blockWidth = Math.min(blockWidth, blockHeight);
	blockHeight = blockWidth;
	this.blockWidth = blockWidth;
	this.blockHeight= blockHeight;
	this.boundsRect.setTo(0,0,blockWidth*this.cols, blockHeight*this.rows);
	this.boundsRect.centerOn(this.backingSprite.centerX, this.backingSprite.centerY);
	
	
	
	this.leftBound = new Phaser.Line(this.boundsRect.bottomLeft.x, this.boundsRect.bottomLeft.y, this.boundsRect.topLeft.x, this.boundsRect.topLeft.y);
	this.rightBound = new Phaser.Line(this.boundsRect.bottomRight.x, this.boundsRect.bottomRight.y, this.boundsRect.topRight.x, this.boundsRect.topRight.y);
	var perspectiveAngle = 15;
	var perspectiveSizeMod = 0.6;
	var prevLCenter = this.leftBound.midPoint();
	var prevRCenter = this.rightBound.midPoint();
	this.leftBound = this.leftBound.rotateAround(this.leftBound.start.x, this.leftBound.start.y, perspectiveAngle, true);
	this.leftBound = new Phaser.Line().fromAngle(this.leftBound.start.x, this.leftBound.start.y, this.leftBound.angle, this.leftBound.length*perspectiveSizeMod);
	//this.leftBound.centerOn(prevLCenter.x, prevLCenter.y);
	this.rightBound = this.rightBound.rotateAround(this.rightBound.start.x, this.rightBound.start.y, -perspectiveAngle, true);
	this.rightBound = new Phaser.Line().fromAngle( this.rightBound.start.x, this.rightBound.start.y, this.rightBound.angle, this.rightBound.length*perspectiveSizeMod);
	//this.rightBound.centerOn(prevRCenter.x, prevRCenter.y);
	
	var sourceRect = this.boundsRect;
	var destPoly = new Phaser.Polygon(this.leftBound.end, this.rightBound.end, this.rightBound.start, this.leftBound.start);
	this.boundsPoly = destPoly;
	this.OOPT = new OPPTransformer(this.game, sourceRect, destPoly);
	
	
	
	this.renderBoard(this.boundsRect, this.stringArr, blockFeedbackQueue);
	
	if(onComplete){
		onComplete.call(this);
	}
	
};

BNBBoard.prototype.renderBoard = function(boundsRect, blocksArray, blockFeedbackParticleQueue){

	for(var row = 0; row< this.rows; row++){
		var rowArr = this.stringArr[row];
		this.blockArr.push([]);
		for(var col = 0; col< this.cols; col++){
			var xPos = Phaser.Math.linear(this.boundsRect.left, this.boundsRect.right, col/this.cols) + this.blockWidth/2;
			var yPos = Phaser.Math.linear(this.boundsRect.top, this.boundsRect.bottom, row/this.rows) + this.blockHeight/2;
			
			var leftNeighbor = (col<=0?null:rowArr[col-1] && !this.smoothEdgeArr[row][col-1])?1:0;
			var rightNeighbor = (col>=this.cols-1?null:rowArr[col+1]&& !this.smoothEdgeArr[row][col+1])?1:0;
			var topNeighbor = (row<=0?null:this.stringArr[row-1][col] && !this.smoothEdgeArr[row-1][col])?1:0;
			var bottomNeighbor = (row>=this.rows-1?null:this.stringArr[row+1][col]&& !this.smoothEdgeArr[row+1][col])?1:0;
			
			var useTriangle = false;
			var angle = 0;
			if(leftNeighbor + rightNeighbor == 1 && topNeighbor+bottomNeighbor == 1){
				
			}
			useTriangle = this.smoothEdgeArr[row][col]==1;
			if(leftNeighbor+bottomNeighbor == 2){
				angle = 0;
			}else if(leftNeighbor + topNeighbor == 2){
				angle = 90;
			}else if(topNeighbor + rightNeighbor == 2){
				angle = 180;
			}else if(rightNeighbor + bottomNeighbor == 2){
				angle = 270;
			}
			else{
				if(leftNeighbor == 1){
					angle = 0;
				}else if(rightNeighbor == 1){
					angle = 270
				}
				
			}
			
			var newBlock = useTriangle?new BNBBlock_Triangle(this.game, this.blockParent):new BNBBlock(this.game, this.blockParent);
			
			var colliderBounds = new Phaser.Rectangle(0,0,this.blockWidth, this.blockHeight).centerOn(xPos, yPos);
			var visualBounds = colliderBounds.clone();
			if(this.is3D){
				
				
				var perspTop = this.OOPT.transform(xPos, yPos - this.blockHeight/2);
				var perspBot = this.OOPT.transform(xPos, yPos + this.blockHeight/2);
				var perspLeft = this.OOPT.transform(xPos - this.blockWidth/2, yPos);
				var perspRight = this.OOPT.transform(xPos + this.blockWidth/2, yPos);
				var perspPos = this.OOPT.transform(xPos, yPos);
				
				visualBounds.setTo(0,0,perspRight.x - perspLeft.x, perspBot.y - perspTop.y).centerOn(perspPos.x, perspPos.y);
				
				
			}
			newBlock.row = row;
			newBlock.col = col;
			newBlock.initialize(this, colliderBounds ,visualBounds, rowArr[col], blockFeedbackParticleQueue, angle);
			if(this.is3D){
				var shadowPos = this.OOPT.transform(xPos, yPos+ 10);
				newBlock.initShadow(visualBounds.clone().centerOn(shadowPos.x, shadowPos.y), this.shadowParent);
			}
			
			this.maxPoints += newBlock.health;
			this.blockArr[row].push(newBlock);
			
		}
	}
	
};

BNBBoard.prototype.getClosestBlock = function(xPos, yPos){

	var closestCol = Math.floor(Util.unlerp(this.boundsRect.left, this.boundsRect.right, xPos) * this.cols);
	var closestRow = Math.floor(Util.unlerp(this.boundsRect.top, this.boundsRect.bottom, yPos) * this.rows);
	closestCol = Phaser.Math.clamp(closestCol, 0, this.cols-1);
	closestRow = Phaser.Math.clamp(closestRow, 0, this.rows-1);
	return {row: closestRow, col: closestCol, block: this.getBlock(closestRow, closestCol)};
};

BNBBoard.prototype.getBoardIntersection = function(line){
	
	if(this.is3D){
		return Util.getLinePolyIntersection(line, this.boundsPoly);
	}
	return Util.getLineRectIntersection(line, this.boundsRect);
};

BNBBoard.prototype.boardContainsPoint = function(xPos, yPos){
	if(this.is3D){
		return this.boundsPoly.contains(xPos, yPos);
	}
	return this.boundsRect.contains(xPos, yPos);
};



BNBBoard.prototype.getBlockIntersection = function(moveLine, lastBlock){
	this.dc.lineStyle(2, 0x00ff00);
	var numItrs = Math.ceil(moveLine.length/(this.blockWidth/2));
	numItrs = Math.max(2, numItrs);
	
	//this.dc.drawLine(moveLine);

	//this variable is reserved for edge case collisions, we should see if we get a valid collision before resulting to this though.
	//this.dc.drawLine(moveLine);
	
	
	var getBlockIntersectionHelper = function(currentBlock){
		if(currentBlock.empty){
			return false;
		};
		if(lastBlock && lastBlock.row == currentBlock.row &&  lastBlock.col == currentBlock.col){
			return false;
		}
		
		var collision = Util.getLinePolyIntersection(moveLine, currentBlock.collider);
		if(collision){
			
			collision.assocBlock = currentBlock;
			
			return collision;
		}
	};
	
	
	
	for(var i = 0; i< numItrs; i++){
		var pointToCheck = moveLine.interpolate(i/(numItrs-1));
		var centerCoord = this.getClosestBlock(pointToCheck.x, pointToCheck.y);
		//this.dc.drawCircle(pointToCheck.x, pointToCheck.y, 10);

		
		var intersections = [];
		for(var dRow=-1; dRow<=1; dRow++){
			//checks all the surrounding squares too in case of a rounding error
			for(var dCol = -1; dCol<=1; dCol++){
				var coordToCheck = {row: centerCoord.row+dRow, col: centerCoord.col+dCol};
				coordToCheck.row = Phaser.Math.clamp(coordToCheck.row, 0, this.rows-1);
				coordToCheck.col = Phaser.Math.clamp(coordToCheck.col, 0, this.cols-1);
				var currentBlock = this.getBlock(coordToCheck.row, coordToCheck.col);
				var intersection = getBlockIntersectionHelper.call(this, currentBlock);
				if(intersection){
					intersections.push(intersection);

				}

			}
		}
		intersections = intersections.sort(function(a, b){
			return Phaser.Point.distance(pointToCheck,a.i1.point) - Phaser.Point.distance(pointToCheck,b.i1.point);
		}, this);
		if(intersections.length>0){
			return intersections[0];
		}
		
	}
	
	return null;
	
};

//TODO: make it work with a negative speed
BNBBoard.prototype.moveBall = function(ball, nextMoveLine, maxDist, distSoFar, retArr, lastCollision){
	
	if(ball.velocity.getMagnitude() == 0){
		return;
	}
	if(retArr){
		retArr.push(this.is3D?this.OOPT.transform(nextMoveLine.start):nextMoveLine.start);

	}
	var closestCoord = this.getClosestBlock(nextMoveLine.start.x, nextMoveLine.start.y);
	var closestCol = closestCoord.col;
	var closestRow = closestCoord.row;
	var closestBlock = this.getBlock(closestRow, closestCol);
	if(closestBlock.empty){
		ball.lastValidBlockPos = closestBlock;
	}
	
	var foundCollision = this.getBlockIntersection(nextMoveLine, lastCollision?lastCollision.assocBlock:null);
		
	var hitWall = false;
	if(!foundCollision){
		
		if(this.is3D){
			if(!this.ballBounceBounds.contains(ball.position.x, ball.position.y)){
				foundCollision = this.getGameBoundsIntersection(nextMoveLine);
			}
			//recreate the move line in 3D perspective to see if it intersects the 2D wall
			var perspStart = this.OOPT.transform(nextMoveLine.start);
			var perspEnd = this.OOPT.transform(nextMoveLine.end);
			var wallCheckLine = new Phaser.Line(perspStart.x, perspStart.y, perspEnd.x, perspEnd.y);
			var perspectiveCollision = this.getGameBoundsIntersection(wallCheckLine);
			//idealy, we wouldn't do this since we actually do want the walls to be treated in perspective as well, but oh well
			if(perspectiveCollision){
				//if it does, make a fake wall for the 2D collision to happen, where the collision happened in 3D space
				var _2DWallPos = this.OOPT.transformInverse(perspectiveCollision.i1.point);
				var fakeWall = perspectiveCollision.i1.side.clone();
				fakeWall.name = perspectiveCollision.i1.side.name;
				fakeWall.centerOn(_2DWallPos.x, _2DWallPos.y);
				foundCollision = {
						i1: {point: nextMoveLine.intersects(fakeWall), side: fakeWall}
				} || foundCollision;
				

			}
		}else{
			foundCollision = this.getGameBoundsIntersection(nextMoveLine, lastCollision);
		}
		
		//foundCollision = foundCollision||this.getGameBoundsIntersection(nextMoveLine);
		if(foundCollision){
			hitWall = true;
		}
		
	}
	
	if(foundCollision){
		if(foundCollision.assocBlock && !ball.isDummy){
			foundCollision.assocBlock.onHitSignal.dispatch();
		}
		var reflectedRad = Phaser.Line.reflect(nextMoveLine, foundCollision.i1.side);
		
		ball.velocity = new Phaser.Point(Math.cos(reflectedRad) * ball.speed, Math.sin(reflectedRad) * ball.speed);
		var startPos = nextMoveLine.start;
		var wallPointForBall = new Phaser.Point(foundCollision.i1.point.x, foundCollision.i1.point.y);
		if(hitWall){
			wallPointForBall.x += Math.cos(foundCollision.i1.side.normalAngle + Math.PI);
			wallPointForBall.y += Math.sin(foundCollision.i1.side.normalAngle+ Math.PI);
		}
		//this.dc.drawLine(new Phaser.Line(foundCollision.i1.point.x, foundCollision.i1.point.y, foundCollision.i1.point.x + foundCollision.i1.side.normalX*20, foundCollision.i1.point.y+ foundCollision.i1.side.normalY*20))
		distSoFar += Phaser.Point.distance(startPos, wallPointForBall);
		ball.updatePosition(wallPointForBall.x, wallPointForBall.y);
		var moveLength = maxDist - distSoFar;
		var newVelVector = ball.velocity.clone().normalize().multiply(moveLength, moveLength);
		var newMoveLine = new Phaser.Line(wallPointForBall.x, wallPointForBall.y, wallPointForBall.x + newVelVector.x, wallPointForBall.y + newVelVector.y);
		return this.moveBall(ball, newMoveLine, maxDist, distSoFar, retArr, foundCollision);
	
	}
	//just move the ball along the line
	//don't need to recurse because the ball has already moved it's max distance
	var visualPosition = this.is3D?this.OOPT.transform(nextMoveLine.end.x, nextMoveLine.end.y):nextMoveLine.end.clone();
//	if(this.boardContainsPoint(nextMoveLine.end.x, nextMoveLine.end.y) && endBlock.empty){
//		
//		visualPosition.clampX(endBlock.collider.left + ball.collider.radius, endBlock.collider.right-ball.collider.radius);
//		visualPosition.clampY(endBlock.collider.top + ball.collider.radius, endBlock.collider.bottom-ball.collider.radius);
//	}

	ball.updatePosition(nextMoveLine.end.x, nextMoveLine.end.y, visualPosition.x ,visualPosition.y);
	if(retArr){
		retArr.push(this.is3D?this.OOPT.transform(nextMoveLine.end):nextMoveLine.end);
	}

	return retArr;
	
};


BNBBoard.prototype.getGameBoundsIntersection = function(line, lastCollision){
	if(this.ballBounceBounds instanceof Phaser.Rectangle){
		var collision = Util.getLineRectIntersection(line, this.ballBounceBounds);
		if(!collision){
			return collision;
		}

		return collision;
	}
	else if(this.ballBounceBounds instanceof Phaser.Polygon){
		return Util.getLinePolyIntersection(line, this.ballBounceBounds);
	};
	return null;
};


BNBBoard.prototype.pixelCallBack = function(data){
	var compareRGB = function(_r, _g, _b){
		return data.r == _r && data.g == _g && data.b == _b;
	};
	if(data.r == 0 && data.g == 0 && data.b == 0){
		return null;
	}
	return {
		color: Phaser.Color.RGBtoString(data.r, data.g, data.b),
		
	};
};




BNBBoard.prototype.forEachCircle = function(circle, callback){
	var numLoops = circle.circumference() / (this.blockWidth/2);
	numLoops = Math.ceil(numLoops);
	
	for(var i = 0; i<numLoops; i++){
		var angle = Phaser.Math.linear(0, Math.PI * 2, i/numLoops);
		var pointToCheck = new Phaser.Point(circle.x + Math.cos(angle)*circle.radius, circle.y + Math.sin(angle)*circle.radius);
		var blockCoord = this.getClosestBlock(pointToCheck.x, pointToCheck.y);
		var block = blockCoord.block;
		if(block.empty){
			continue;
		}
		callback.call(this, block);
		
	}
}










