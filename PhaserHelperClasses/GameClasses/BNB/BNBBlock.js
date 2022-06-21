
// -- user code here --

/* --- start generated code --- */

// Generated by  1.5.4 (Phaser v2.6.2)


/**
 * BNBBlock.
 * @param {Phaser.Game} aGame A reference to the currently running game.
 * @param {Phaser.Group} aParent The parent Group (or other {@link DisplayObject}) that this group will be added to.
 * @param {string} aName A name for this group. Not used internally but useful for debugging.
 * @param {boolean} aAddToStage If true this group will be added directly to the Game.Stage instead of Game.World.
 * @param {boolean} aEnableBody If true all Sprites created with {@link #create} or {@link #createMulitple} will have a physics body created on them. Change the body type with {@link #physicsBodyType}.
 * @param {number} aPhysicsBodyType The physics body type to use when physics bodies are automatically added. See {@link #physicsBodyType} for values.
 */
function BNBBlock(aGame, aParent, aName, aAddToStage, aEnableBody, aPhysicsBodyType) {
	
	Phaser.Group.call(this, aGame, aParent, aName, aAddToStage, aEnableBody, aPhysicsBodyType);
	var __visualParent = this.game.add.group(this);
	
	var __shadow = this.game.add.sprite(0.0, 5.0, 'square', null, __visualParent);
	__shadow.scale.set(0.0, 0.0);
	__shadow.anchor.set(0.5, 0.5);
	
	var __visual = this.game.add.sprite(0.0, 0.0, 'Sand Block White 3', null, __visualParent);
	__visual.anchor.set(0.5, 0.5);
	
	var __flash = this.game.add.sprite(0.0, 0.0, 'square', null, __visualParent);
	__flash.scale.set(0.0, 0.0);
	__flash.anchor.set(0.5, 0.5);
	
	var __highlight = this.game.add.sprite(0.0, 0.0, 'Highlighted Block', null, __visualParent);
	__highlight.anchor.set(0.5, 0.5);
	
	var __anim = this.game.add.sprite(0.0, 25.0, 'sandBlockAtlas2', 'Sand Melt Animation (Grayscale)/Sand Melt 1.png', __visualParent);
	__anim.scale.set(0.6, 0.6);
	__anim.anchor.set(0.5, 0.5);
	__anim.animations.add('destroy', [], 24, false);
	
	
	
	// fields
	
	this.f_visualParent = __visualParent;
	this.f_shadow = __shadow;
	this.f_visual = __visual;
	this.f_flash = __flash;
	this.f_highlight = __highlight;
	this.f_anim = __anim;
	
	this.afterCreate();
	
}

/** @type Phaser.Group */
var BNBBlock_proto = Object.create(Phaser.Group.prototype);
BNBBlock.prototype = BNBBlock_proto;
BNBBlock.prototype.constructor = BNBBlock;

/* --- end generated code --- */
// -- user code here --


BNBBlock.prototype.afterCreate = function(){
	this.f_flash.alpha = 0;
	this.f_flash.baseScale = this.f_flash.scale.clone();
	this.onHitSignal = new Phaser.Signal();
	this.onHitSignal.add(this.onHit, this);
	
	this.onDestroySignal = new Phaser.Signal();
	this.onDestroySignal.add(this.onBlockDestroy, this);
	this.f_highlight.alpha = 0;
	this.health = 999;
	this.healthText = new Phaser.BitmapText(this.game, 0,0, "Futura", this.health.toString(), 64);
	this.healthText.anchor.setTo(0.5);
	this.row = -1;
	this.col = -1;
	this.add(this.healthText);
	
	
};


BNBBlock.prototype.initialize = function(assocBoard, colliderBounds, visualBounds, colorData, particleQueue){
	this.empty = colorData ==null;
	colorData = colorData==null?{color:"#000000"}:colorData;
	this.particleQueue = particleQueue;
	this.assocBoard = assocBoard;
	this.collider = colliderBounds;
	this.visualBounds = visualBounds;
	
	
	this.position.setTo(this.visualBounds.centerX, this.visualBounds.centerY);
	
	
	
	if(this.empty){
		this.alpha =0;
	}
	var lum = Phaser.Color.hexToColor(colorData.color);
	lum = Util.getLuminance(lum.r, lum.g, lum.b);
	this.baseColor = colorData.color.replace("#", "0x");
	this.highlightColor = 0xf92ef3;
	//this.f_visual.tint = this.baseColor;
	if(this.baseColor == "0xf3dcb7"){
		this.setHealth(Global.moreHealth?80:20);
	}else{
		
		this.setHealth(Global.moreHealth?15:5);
		if(this.row>6){
			if(this.col<6){
				if(Global.moreHealth){
					this.setHealth(50);
				}
				
			}
		}
	}
	
	this.healthText.alpha = 0;
	if(lum>200){
		this.healthText.tint =0x000000;
	}
	
//	if(this.baseColor == 0xd3b891){
//		this.initBlockVisual("Sand Block Normal");
//		this.f_visual.loadTexture("Sand Block Normal 1");
//	}
	
	this.f_shadow.alpha = 0;
	this.worldPosition = this.parent.worldTransform.apply(this.position);
	this.healthText.resizeInRect(this.visualBounds.clone().scale(0.8,0.8));
};

BNBBlock.prototype.initColorVisuals = function(prefix){

	this.f_visual.tint = "0x" + Util.LightenDarkenColor(this.baseColor.toString(), this.game.rnd.realInRange(-30, 30));
	this.f_anim.tint = this.f_visual.tint;
	this.f_visualParent.resizeWithWidth(this.visualBounds.width*2.8);
	
	var frames = Phaser.Animation.generateFrameNames("Sand Melt Animation (Grayscale)/Sand Melt ", 1, 27, ".png");
	this.f_anim.animations.add("destroy", frames, 24);
	this.f_anim.alpha = 0;
};

BNBBlock.prototype.setHealth = function(newHealth){
	this.health = newHealth;
	this.healthText.setText(this.health.toString());
};

BNBBlock.prototype.initShadow = function(visualBounds, parent){
	this.f_shadow.alpha = 1;
	this.f_shadow.position.setTo(visualBounds.centerX, visualBounds.centerY);
	this.f_shadow.width = visualBounds.width;
	this.f_shadow.height = visualBounds.height;
	this.baseShadowColor = "0x"+ Util.LightenDarkenColor(this.baseColor.toString(), -50);
	this.highlightShadowColor = "0x"+ Util.LightenDarkenColor(this.highlightColor.toString(), -50);
	this.f_shadow.tint = this.baseShadowColor;
	if(this.empty){
		this.f_shadow.alpha= 0;
	}
	parent.add(this.f_shadow);
}


BNBBlock.prototype.onHit = function(){
	this.health--;
	this.healthText.setText(this.health.toString());
	
	if(this.f_flash.scaleTween){
		this.f_flash.scaleTween.stop();
		this.f_flash.scale.setTo(this.f_flash.baseScale.x, this.f_flash.baseScale.y);
		
	}
	if(this.f_flash.alphaTween){
		this.f_flash.alphaTween.stop();
		this.f_flash.alpha = 0;
	}
	if(this.f_highlight && this.f_highlight.alphaTween){
		this.f_highlight.alphaTween.stop();
		this.f_highlight.alpha = 0;
		
	}
	
//	for(var i = 0; i< 1; i++){
//		var p = this.particleQueue.popFront();
//		if(!p){
//			continue;
//		}
//		var centerPos = new Phaser.Point(this.worldPosition.x+Global.cameraOffsetX, this.worldPosition.y+Global.cameraOffsetY);
//		p.alpha = 1;
//		p.position.setTo(centerPos.x, centerPos.y);
//		p.scale.setTo(0.5);
//		var endPos = new Phaser.Point(centerPos.x+this.game.rnd.realInRange(10, 20), centerPos.y).rotate(centerPos.x, centerPos.y, this.game.rnd.realInRange(0, Math.PI*2));
//		p.posTween = this.game.add.tween(p).to({x: endPos.x, y: endPos.y}, 300, Phaser.Easing.Quadratic.Out, true);
//		p.alphaTween = this.game.add.tween(p).to({alpha: 0}, 100, Phaser.Easing.Linear.None, true,200);
//		p.angle = this.game.rnd.realInRange(0, 360);
//		p.angleTween = this.game.add.tween(p).to({angle: "90"}, 300, Phaser.Easing.Linear.None, true);
//		p.posTween.onComplete.add(function(){
//			this.particleQueue.pushBack(p);
//		}, this);
//	}
	
//	this.f_flash.scaleTween = this.game.add.tween(this.f_flash.scale).from({x: "-0.5", y: "-0.5"}, 200, Phaser.Easing.Quadratic.Out, true);
//	this.f_flash.alphaTween = this.game.add.tween(this.f_flash).from({alpha: 1}, 200, Phaser.Easing.Linear.None, true);
	
	if(this.f_highlight){
//		this.f_visual.tint = this.highlightColor;
//		this.f_shadow.tint = this.highlightShadowColor;
//		this.game.time.events.add(100, function(){
//			this.f_visual.tint = this.baseColor;
//			this.f_shadow.tint = this.baseShadowColor;
//
//		}, this);
		this.f_highlight.alphaTween = this.game.add.tween(this.f_highlight).from({alpha: 1}, 200, Phaser.Easing.Linear.None, true);

	}

	
	if(this.health<=0){
		this.onDestroySignal.dispatch();
	}
	
};

BNBBlock.prototype.introAnim = function(){
	this.f_visual.alpha = 0;
	this.f_anim.alpha = 1;
	this.f_anim.play("destroy");
	this.f_anim.animations.currentAnim.onComplete.addOnce(function(){
		this.f_visual.alphaTween = this.game.add.tween(this.f_visual).to({alpha: 1}, 200, Phaser.Easing.Linear.None, true);
	}, this);
}

BNBBlock.prototype.onBlockDestroy = function(){
	if(this.empty){
		return;
	}
	this.parent.bringToTop(this);
	this.empty = true;
	this.f_shadow.alpha = 0;
	this.f_visual.alphaTween = this.game.add.tween(this.f_visual).to({alpha: 0}, 200, Phaser.Easing.Linear.None, true);
	this.f_anim.alphaTween = this.game.add.tween(this.f_anim).to({alpha: 1}, 200, Phaser.Easing.Linear.None, true);
	//this.f_anim.alpha = 1;
	this.f_anim.play("destroy");
	this.f_anim.animations.currentAnim.onComplete.addOnce(function(){
		this.f_anim.alpha = 0;
	}, this);
	var animLength = this.f_anim.animations.currentAnim.delay * this.f_anim.animations.currentAnim.frameTotal;
	var sound = this.game.add.sound("Sand Deteriorate");
	sound.play();
//	this.game.add.tween(sound).to({volume:0}, 100, Phaser.Easing.Linear.None, animLength);
	
	
	
};






