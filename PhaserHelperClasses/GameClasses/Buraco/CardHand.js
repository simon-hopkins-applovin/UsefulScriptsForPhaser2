/**
 *
 */
function CardHand (_game, _key, _playArea, _isHidden) {
	
	CardPile.call(this, _game, _key, _playArea, _isHidden);
	
};

CardHand.prototype = Object.create(CardPile.prototype);
CardHand.prototype.constructor = CardHand;



CardHand.prototype.addCardToHand = function(card, index, sourcePile, onComplete){
	
	var startPos = card.getWorldPos();
	startPos = this.game.world.worldTransform.apply(startPos);
	startPos = this.worldTransform.applyInverse(startPos);
	
	
	this.addCard(card);
	
	var startPositions = new Map();
	
	
	for(var i = index; i>=1; i--){
		startPositions.set( this.cards[i], this.cards[i].position.clone());
	}
	for(var i = index; i>=1; i--){

		this.bringToTopOfDeck(this.cards[index]);
	}
	for(var i = index-1; i>=0; i--){
		var endPos = this.cards[i].position.clone();
		console.log(startPositions.get(this.cards[i]));
		this.cards[i].position.setTo(startPositions.get(this.cards[i]).x, startPositions.get(this.cards[i]).y);
		this.cards[i].moveTween = this.game.add.tween(this.cards[i]).to({x: endPos.x, y: endPos.y}, 300, Phaser.Easing.Sinusoidal.InOut, true);
	}
	var endPos = card.position.clone();
	
	//this.game.world.add(card);

	card.position.setTo(startPos.x, startPos.y);
	var cardMoveTween = this.game.add.tween(card).to({x: endPos.x, y: endPos.y}, 400, Phaser.Easing.Sinusoidal.InOut, true);
	cardMoveTween.onComplete.add(function(){
		if(onComplete){
			onComplete.call(this);
		}
	}, this);
	
	
};