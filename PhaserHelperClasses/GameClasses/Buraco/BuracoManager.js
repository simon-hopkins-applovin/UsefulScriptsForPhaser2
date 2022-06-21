/**
 *
 */
function BuracoManager (_game, _boundsConfig) {
	
	Phaser.Group.call(this, _game);
	this.boundsDC = this.game.add.graphics(0,0);
	this.boundsConfig = _boundsConfig;
	
	
	
	this.SM = new StateMachine({
		DRAW : new State(),
		DECIDE : new State(),
		PLAY_MELD : new State(),
		DISCARD: new State(),
	});
	this.isPlayerTurn = true;

	//PA = Play area
	this.drawPA = new PlayArea(this.game, this.boundsConfig.draw, 0);
	this.playerHandPA = new PlayArea(this.game, this.boundsConfig.playerHand, 50);
	this.opponentHandPA = new PlayArea(this.game, this.boundsConfig.opponentHand, 50);
	this.playerPlayPA = new PlayArea(this.game, this.boundsConfig.playerPlay, 50);
	this.opponentPlayPA = new PlayArea(this.game, this.boundsConfig.opponentPlay, 50);
	this.discardPA = new PlayArea(this.game, this.boundsConfig.discard, 50);
	
	//card piles
	this.mainDeck = new CardDeck(this.game, "deck", this.drawPA, true, 2);
	this.playerHand = new CardHand(this.game, "playerHand", this.playerHandPA);
	this.opponentHand = new CardHand(this.game, "oppHand", this.opponentHandPA, true);
	this.discardPile = new CardPile(this.game, "discard", this.discardPA);
	
	this.opponentHand.addCard = function(card){
		CardPile.prototype.addCard.call(this, card);
		card.f_backVisual.loadTexture("Red Card Back");
	};
	
	var initPlayerMeld = new CardPile(this.game, "meld1", this.playerPlayPA);
	var initOpponentMeld = new CardPile(this.game, "meld1", this.opponentPlayPA);
	
	var playerMeldArr = ["14_H", "2_H", "3_H", "4_H", "5_H", "6_H"];
	var playerHandArr = ["J_S", "Q_S", "8_D", "9_D", "6_C"];
	
	var oppMeldArr = ["3_C", "4_C", "5_C"];
	var oppHandArr = ["2_D", "3_D", "K_S", "K_S"];
	
	var dealArr = function(arr, pile){
		arr.forEach(function(c){
			var cardData = c.split("_");
			pile.addCard(this.mainDeck.removeCard(Card.numFromChar(cardData[0]), Card.enumFromChar(cardData[1])));
		}, this);
	}.bind(this);
	
	dealArr(playerMeldArr, initPlayerMeld);
	dealArr(playerHandArr, this.playerHand);
	dealArr(oppMeldArr, initOpponentMeld);
	dealArr(oppHandArr, this.opponentHand);
	
	this.opponentHandPA.angle = 180;
	
	this.mainDeck.bringToTopOfDeck(9, SUITS.HEARTS);
	this.mainDeck.bringToTopOfDeck(8, SUITS.HEARTS);
	this.mainDeck.bringToTopOfDeck(7, SUITS.HEARTS);
	
	
	
	this.initSM();
		
	
}

BuracoManager.prototype = Object.create(Phaser.Group.prototype);

BuracoManager.prototype.constructor = BuracoManager;

BuracoManager.prototype.initSM = function(){
	
	var drawnCard = null;
	
	//deck functionality
	this.mainDeck.onClickSignal.add(function(card){
		//draw card logic
		if(this.SM.checkState("DRAW")){
			drawnCard = this.mainDeck.drawTop();
			var targetPile = this.isPlayerTurn?this.playerHandPA.getCardPile("playerHand"):this.opponentHandPA.getCardPile("oppHand");
			console.log(targetPile.cards.length);
			drawnCard.flip(function(){
				this.moveCard(this.mainDeck, targetPile, drawnCard, function(){this.SM.changeState("PLAY_MELD");}.bind(this));

			}.bind(this));
			this.mainDeck.setCanInteract(false);

		}
//		else if(this.SM.checkState("DECIDE")){
//			this.moveCard(this.playerHandPA.getCardPile("playerHand"), this.discardPA.getCardPile("discard"), drawnCard, function(){this.SM.changeState("PLAY_MELD");}.bind(this));
//			this.moveCard(this.mainDeck, this.playerHandPA.getCardPile("playerHand"));
//		}
	}, this);
	
	var initHandFunctionality = function(targetHand, targetPlayArea){
		targetHand.onClickSignal.add(function(card){
			//decide to discard logic
			if(this.SM.checkState("DECIDE")){
				if(card.equals(drawnCard)){
					this.SM.changeState("PLAY_MELD");
				}
			}else if(this.SM.checkState("PLAY_MELD")){
				if(this.canAddToMeld(card, targetPlayArea.getCardPile("meld1"))){
					this.moveCard(targetHand, targetPlayArea.getCardPile("meld1"), targetHand.removeCard(card.number, card.suit), function(){this.SM.changeState("DISCARD");}.bind(this));
					
					targetHand.setCanInteract(false);
				}
			}else if(this.SM.checkState("DISCARD")){
				targetHand.setCanInteract(false);
				this.moveCard(targetHand, this.discardPA.getCardPile("discard"), targetHand.removeCard(card.number, card.suit), 
						function(){
							this.isPlayerTurn = !this.isPlayerTurn;
							this.SM.changeState("DRAW");	
						}.bind(this));
			}
			
			targetHand.updateCardPositions();
			
		}, this);
	}.bind(this);
	
	initHandFunctionality(this.playerHandPA.getCardPile("playerHand"), this.playerPlayPA);
	initHandFunctionality(this.opponentHandPA.getCardPile("oppHand"), this.opponentPlayPA);
	
	this.discardPA.getCardPile("discard").onClickSignal.add(function(card){
		//draw card logic
		if(this.SM.checkState("DRAW")){
			if(this.discardPA.getCardPile("discard").cards.length == 0){
				return;
			}
			var targetPile = this.isPlayerTurn?this.playerHandPA.getCardPile("playerHand"):this.opponentHandPA.getCardPile("oppHand");
			var mod = 0;
			while(this.discardPA.getCardPile("discard").cards.length>0){
				this.moveCard(this.discardPA.getCardPile("discard"), targetPile, this.discardPA.getCardPile("discard").drawBottom(), null, mod);
				mod++;
			}
			this.game.time.events.add(1000, function(){
				this.SM.changeState("PLAY_MELD");
			}, this);

		}
	}, this);

	
	
	this.SM.states.DRAW.onEnter.add(function(data){
		this.mainDeck.setCanInteract(true);
		
		this.playerHandPA.getCardPile("playerHand").setCanInteract(this.isPlayerTurn);
		if(!this.isPlayerTurn){
		
			if(this.discardPA.getCardPile("discard").cards.length>0){
				this.game.time.events.add(700, function(){
					
					this.discardPA.getCardPile("discard").onClickSignal.dispatch();
				}, this);
				
			}else{
				this.mainDeck.onClickSignal.dispatch();
			}
			
		}
	}, this);
	this.SM.states.PLAY_MELD.onEnter.add(function(data){
		this.playerHandPA.getCardPile("playerHand").setCanInteract(this.isPlayerTurn);
		var targetPile = this.isPlayerTurn?this.playerHandPA.getCardPile("playerHand"):this.opponentHandPA.getCardPile("oppHand");
		var targetPlayArea = this.isPlayerTurn?this.playerPlayPA:this.opponentPlayPA;
		var validCard = null;
		
		for(var i = 0; i< targetPile.cards.length; i++){
			
			if(this.canAddToMeld(targetPile.cards[i], targetPlayArea.getCardPile("meld1"))){
				validCard = targetPile.cards[i];
				break;
			}
		}
		if(!validCard){
			console.log("no valid card");
			return this.SM.changeState("DISCARD");
		}
		if(!this.isPlayerTurn){
			this.game.time.events.add(700, function(){
				targetPile.onClickSignal.dispatch(validCard);
			}, this);
			
		}
	}, this);
	this.SM.states.DISCARD.onEnter.add(function(data){
		this.playerHandPA.getCardPile("playerHand").setCanInteract(this.isPlayerTurn);
		if(!this.isPlayerTurn){
			this.game.time.events.add(700, function(){
				this.opponentHandPA.getCardPile("oppHand").onClickSignal.dispatch(this.opponentHandPA.getCardPile("oppHand").peekTop());
			}, this);
			
		}
	}, this, 100);
}

BuracoManager.prototype.moveCard = function(sourcePile, targetPile, targetCard, onComplete, index){
	this.game.add.sound("Whoosh").play();
	if(targetPile.addCardToHand ){
		return targetPile.addCardToHand(targetCard, targetCard.equals(13, SUITS.SPADES)?2:0, sourcePile, onComplete);
	}

	index = index==undefined?targetPile.cards.length:index;
	var cardToAdd = targetCard || sourcePile.drawTop();
	//cardToAdd.setHidden(false);
	var startWorldPos = cardToAdd.getWorldPos();
	var endWorldPos = targetPile.getTargetSpeadPosition(targetPile.cards.length, true);
	this.game.world.add(cardToAdd);
	cardToAdd.position.setTo(startWorldPos.x, startWorldPos.y);
	cardToAdd.moveTween = this.game.add.tween(cardToAdd).to({x: endWorldPos.x, y: endWorldPos.y}, 400, Phaser.Easing.Sinusoidal.InOut, true);
	cardToAdd.moveTween.onComplete.add(function(){
		
		targetCard.flip(function(){
			targetPile.addCard(cardToAdd);
			if(onComplete){
				console.log(targetPile.key);
				if(targetPile.key == "meld1"){
					this.game.add.sound("Card Place").play();
				}
				onComplete.call(this);
			}
		}.bind(this));
		
	}, this);
	
};


BuracoManager.prototype.canAddToMeld = function(card, cardPile){
	if(cardPile.cards.length == 0){
		return true;
	}
	if(!cardPile.peekTop()){
		return false;
	}
	return card.suit == cardPile.peekTop().suit && card.number == cardPile.peekTop().number+1;
};


















