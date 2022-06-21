/**
 *
 */
function CardPile (_game, _key, _playArea, _isHidden) {
	
	this.game = _game;
	Phaser.Group.call(this, this.game);
	this.cards = [];
	this.isHidden = _isHidden;
	this.baseSprite = this.game.add.sprite(0,0, "Blue Card Back", null, this).setAnchor(0.5, 0.5);
	this.baseSprite.alpha= 0.0;
	//this.baseSprite.alpha = 0;
	this.cardBounds = new Phaser.Rectangle().copyFrom(this.baseSprite, true);
	this.key = _key;
	this.playArea = _playArea;
	if(this.playArea){
		this.playArea.addCardPile(this.key, this);
	}
	
	this.canInteract = true;
	this.onClickSignal = new Phaser.Signal();
	
}

CardPile.prototype = Object.create(Phaser.Group.prototype);
CardPile.prototype.constructor = CardPile;


CardPile.prototype.toString = function(){
	var retString = "TOP|";
	
	this.cards.forEach(function(c){
		retString+= " " + c.toString() + "";
	}, this);
	retString+="|BOTTOM";
	return retString;
}

CardPile.prototype.addCard = function(card){
	if(!card){
		return false;
	}
	if(this.playArea){
		var pos = this.getTargetSpeadPosition(this.cards.length);
		card.position.setTo(pos.x, pos.y);
	}
	card.setClickCallback(function(){
		if(!this.canInteract){
			return;
		}
		this.onClickSignal.dispatch(card);
	}.bind(this));
	this.cards.unshift(card);
	this.add(card);
	card.setHidden(this.isHidden);
	return this.cards;
};

CardPile.prototype.setCanInteract = function(_canInteract){
	this.canInteract = _canInteract;
}

CardPile.prototype.drawTop = function(){
	if(this.cards.length==0){
		return false;
	}
	return this.cards.shift();
};


CardPile.prototype.drawBottom = function(){
	if(this.cards.length==0){
		return false;
	}
	return this.cards.pop();
};

CardPile.prototype.peekTop = function(){
	return this.cards[0];
};

CardPile.prototype.getTargetSpeadPosition = function(index, asWorld){
	
	var pos =  new Phaser.Point(this.playArea.spreadOffset * index, 0);
	if(asWorld){
		pos = this.worldTransform.apply(pos);
		pos = this.game.world.worldTransform.applyInverse(pos);
	}
	return pos;
}

CardPile.prototype.removeCard = function(_num, _suit){
	var foundCard = null;
	for(var i = 0; i< this.cards.length; i++){
		if(this.cards[i].equals(_num, _suit)){
			foundCard = this.cards.splice(i, 1)[0];
			break;
		}
	};
	
	return foundCard;
};

CardPile.prototype.getCard = function(_num, _suit){
	var foundCard = null;
	for(var i = 0; i< this.cards.length; i++){
		if(this.cards[i].equals(_num, _suit)){
			foundCard = this.cards[i];
			break;
		}
	}
	return foundCard;
}

CardPile.prototype.bringToTopOfDeck = function(_num, _suit){
	
	for(var i = 0; i< this.cards.length; i++){
		if(this.cards[i].equals(_num, _suit)){
			var targetCard = this.cards.splice(i, 1)[0];
			this.cards.unshift(targetCard);
			break;
		}
	};
	this.updateCardPositions();
	this.orderCards();
	return i!=this.cards.length;
};

CardPile.prototype.clear = function(){
	this.cards.forEach(function(c){
		c.destroy();
	}, this);
	this.cards = [];
}

CardPile.prototype.shuffle = function(){
	 this.cards = Phaser.ArrayUtils.shuffle(this.cards);
	 this.orderCards(true);
	 return this.cards;
};

CardPile.prototype.updateCardPositions = function(){
	for(var i = 0; i< this.cards.length; i++){
		var pos = this.getTargetSpeadPosition(this.cards.length-i -1);
		this.cards[i].position.setTo(pos.x, pos.y);
	};
}

//adjusts order they render
CardPile.prototype.orderCards = function(reverse){
	reverse = reverse==undefined?false:reverse;
	
	this.customSort(function(a, b){
		return (reverse?-1:1) * (this.cards.indexOf(b) - this.cards.indexOf(a));
	}, this);
	
	this.sendToBack(this.baseSprite);
};


















