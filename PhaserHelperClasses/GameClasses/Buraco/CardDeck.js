/**
 *
 */

const SUITS = {
	SPADES: 0,
	CLUBS: 1,
	HEARTS: 2,
	DIAMONDS: 3,
};
function CardDeck (_game, _key, _playArea, _isHidden, _numDecks) {

	CardPile.call(this, _game, _key, _playArea, _isHidden);
	
	this.numDecks = _numDecks;
	this.inputEnableChildren = true;
	for(var i = 0; i< this.numDecks; i++){
		for(var j=2; j<15; j++){
			
			for(var suit in SUITS){
				var newCard = new Card(this.game, this);
				newCard.initialize(j, SUITS[suit]);
				this.addCard(newCard);
				
			};
		};
	}
	
	
	this.shuffle();
	
	
	
};


CardDeck.prototype = Object.create(CardPile.prototype);

CardDeck.prototype.constructor = CardDeck;
