
// -- user code here --

/* --- start generated code --- */

// Generated by  1.5.4 (Phaser v2.6.2)


/**
 * ZumaBall.
 * @param {Phaser.Game} aGame A reference to the currently running game.
 * @param {Phaser.Group} aParent The parent Group (or other {@link DisplayObject}) that this group will be added to.    If undefined/unspecified the Group will be added to the {@link Phaser.Game#world Game World}; if null the Group will not be added to any parent.
 * @param {string} aName A name for this group. Not used internally but useful for debugging.
 * @param {boolean} aAddToStage If true this group will be added directly to the Game.Stage instead of Game.World.
 * @param {boolean} aEnableBody If true all Sprites created with {@link #create} or {@link #createMulitple} will have a physics body created on them. Change the body type with {@link #physicsBodyType}.
 * @param {number} aPhysicsBodyType The physics body type to use when physics bodies are automatically added. See {@link #physicsBodyType} for values.
 */
function ZumaBall(aGame, aParent, aName, aAddToStage, aEnableBody, aPhysicsBodyType) {
	
	Phaser.Group.call(this, aGame, aParent, aName, aAddToStage, aEnableBody, aPhysicsBodyType);
	var __bottleParent = this.game.add.group(this);
	
	var __baseVisual = this.game.add.sprite(-4.0, -4.0, 'helperClassAtlas', 'ball_blue.png', __bottleParent);
	__baseVisual.anchor.set(0.5, 0.5);
	
	var __glowVisual = this.game.add.sprite(-4.0, -4.0, 'helperClassAtlas', 'ball_blue_high.png', __bottleParent);
	__glowVisual.anchor.set(0.5, 0.5);
	
	var __overlay = this.game.add.sprite(-4.0, -4.0, 'helperClassAtlas', 'ball_white.png', __bottleParent);
	__overlay.anchor.set(0.5, 0.5);
	
	var __debugText = new webfontGEOText(this.game, 0.0, 0.0);
	this.add(__debugText);
	
	
	
	// fields
	
	this.f_bottleParent = __bottleParent;
	this.f_baseVisual = __baseVisual;
	this.f_glowVisual = __glowVisual;
	this.f_overlay = __overlay;
	this.f_debugText = __debugText;
	
	this.afterCreate();
	
}

/** @type Phaser.Group */
var ZumaBall_proto = Object.create(Phaser.Group.prototype);
ZumaBall.prototype = ZumaBall_proto;
ZumaBall.prototype.constructor = ZumaBall;

/* --- end generated code --- */
// -- user code here --


ZumaBall.prototype.afterCreate = function(){
	
	this.collider = new Phaser.Circle(0,0, 100);
	this.f_overlay.alpha = 0;
	this.f_glowVisual.alpha = 0;
	this.f_debugText.alpha = 0;
};

ZumaBall.prototype.initialize = function(_letter, _number){
	
	var createShadowText = function(text, fontSize){
		var letterParent = this.game.add.group(this.f_bottleParent);
		var letterText = this.game.add.bitmapText(0, 0, "GROBOLD", text, fontSize, letterParent);
		letterText.shadow = this.game.add.bitmapText(1, 1, "GROBOLD", text, fontSize*1.1, letterParent);
		letterText.anchor.setTo(0.5);
		letterText.shadow.anchor.setTo(0.5);
		letterParent.bringToTop(letterText);
		letterText.shadow.tint = 0x000000;
		return letterParent;
	};
	this.letter = _letter;
	this.number = _number;
	if(!Global.onlyColors){
		this.letterParent = createShadowText.call(this, this.letter, 42);
		this.letterParent.y-=20;
		this.numberParent = createShadowText.call(this, this.number, 42);
		this.numberParent.y+=20;
	}else{
		this.numberParent = createShadowText.call(this, this.number, 42);
	}
	this.f_bottleParent.bringToTop(this.f_overlay);
	//change how you want the balls to look, given the arguments here
	return;
	switch(this.letter){
		case "B":
			this.f_baseVisual.loadTexture("ball_blue");
			this.f_glowVisual.loadTexture("ball_blue_high");
			break;
		case "I":
			this.f_baseVisual.loadTexture("ball_red");
			this.f_glowVisual.loadTexture("ball_red_high");
			break;
		case "N":
			this.f_baseVisual.loadTexture("ball_yellow");
			this.f_glowVisual.loadTexture("ball_yellow_high");
			break;
		case "G":
			this.f_baseVisual.loadTexture("ball_green");
			this.f_glowVisual.loadTexture("ball_green_high");
			break;
		case "O":
			this.f_baseVisual.loadTexture("ball_purple");
			this.f_glowVisual.loadTexture("ball_purple_high");
			break;
		default:
			break;
	}
	
	
	
}

ZumaBall.prototype.setClickCallback = function(callback){
	
	this.game.input.onDown.add(function(){
		if(this.game){
			var mousePos = ZumaBoard.prototype.getMousePos.call(this);
			if(this.collider.contains(mousePos.x, mousePos.y)){
				callback.call(this);
			}
		}
	}, this);
};


ZumaBall.prototype.destroyAnim = function(callback){
	var tweenTime = 200;
	this.f_overlay.alphaTween = this.game.add.tween(this.f_overlay).to({alpha: 1}, tweenTime, Phaser.Easing.Linear.None, true);
	this.f_bottleParent.scaleTween = this.game.add.tween(this.f_bottleParent.scale).to({x: ".5", y: ".5"}, tweenTime, Phaser.Easing.Quadratic.Out, true);
	
	this.f_overlay.alphaTween.onComplete.add(function(){
		if(callback){
			callback.call(this);
		}
	}, this);
};

















