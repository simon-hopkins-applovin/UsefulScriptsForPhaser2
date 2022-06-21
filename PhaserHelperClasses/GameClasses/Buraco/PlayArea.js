/**
 *
 */
function PlayArea (_game, _bounds, _spreadOffset) {
	
	Phaser.Group.call(this, _game);
	this.bounds = _bounds;
	this.position.setTo(this.bounds.centerX, this.bounds.centerY);
	this.bounds.centerOn(0,0);
	this.pileMap = new Map();
	this.dc = this.game.add.graphics(0,0);
	this.add(this.dc);
	this.spreadOffset = _spreadOffset;
	this.updateTransform();
}


PlayArea.prototype = Object.create(Phaser.Group.prototype);
PlayArea.prototype.constructor = PlayArea;


//add a pile to a play area at the right most point
PlayArea.prototype.addCardPile = function(key, cardPile){

	//find a space for it
	var furthestRightX = this.bounds.left;
	var pileArr = Array.from(this.pileMap.values()).sort(function(a, b){
		return b.right - a.right;
	}, this);
	
	furthestRightX = pileArr.length>0?pileArr[0].right:furthestRightX;
	this.pileMap.set(key, cardPile);
	this.add(cardPile);
	cardPile.playArea = this;
	cardPile.position.setTo(furthestRightX + cardPile.cardBounds.width/2, this.bounds.centerY);
	
	var cardCopy = cardPile.cards.map(function(c){return c.clone();}, this);
	cardPile.clear();
	cardCopy.forEach(function(c){
		cardPile.addCard(c);
	}, this);
	
};

PlayArea.prototype.getCardPile = function(key){
	return this.pileMap.get(key);
}