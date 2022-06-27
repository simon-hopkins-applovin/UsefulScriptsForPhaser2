//State Machine
//	(つ . •́ _ʖ •̀ .)つ
function StateMachine(_states){
	this.states = {};
	for(var i = 0; i< arguments.length; i++){
		this.states[arguments[i]] = new State();
		this.states[arguments[i]].enterFired = false;
		this.states[arguments[i]].name = arguments[i];
	}
	this.onUpdateSignal = new Phaser.Signal();
	this.currentState = null;
};

StateMachine.prototype.runInit = function(){
	for(entry in this.states){
		this.states[entry].onInit.dispatch();
	}
};

StateMachine.prototype.initState = function(stateKey, onInit, onEnter, onExit, onUpdate){
	if(!this.states[stateKey]){
		return console.error("State Machine does not have: ", stateKey);
	}
	
	if(onInit){
		this.states[stateKey].onInit.add(onInit, this);
	}
	if(onEnter){
		this.states[stateKey].onEnter.add(onEnter, this);
	}
	if(onExit){
		this.states[stateKey].onExit.add(onExit, this);
	}
	if(onUpdate){
		this.states[stateKey].onUpdate.add(onUpdate, this);
	}
	
};

StateMachine.prototype.changeState = function(stateKey, data){	
	
	data = data==undefined?{}:data;
	data.prevState = this.currentState;
	if(this.currentState && !this.currentState.isTransition){
		this.currentState.onExit.dispatch(data);
		this.currentState.enterFired = false;

	}
	this.currentState = this.states[stateKey];
	if(!this.currentState){
		console.error("UNKNOWN STATE: ", stateKey);
	}
	if(this.currentState.name != stateKey){
		
		this.currentState.onExit.addOnce(function(){
			this.changeState(stateKey, data);
		}, this);
	}
	this.currentState.onEnter.dispatch(data, this.currentState);
	this.currentState.enterFired = true;
	
};

StateMachine.prototype.onUpdate = function(){
	if(this.currentState){
		if(this.currentState.enterFired){
			this.currentState.onUpdate.dispatch();
		}
	}
	this.onUpdateSignal.dispatch();
};
StateMachine.prototype.getTransKey = function(inState, outState){
	return "TRANS_"+outState+"_"+inState;
}
StateMachine.prototype.checkState = function(stateToCheck){
	return this.currentState == this.states[stateToCheck];
};

StateMachine.prototype.addTransitionState = function(outState, inState, callback){
	
	if(!this.states[outState]){
		return console.error("State Machine does not have: ", outState);
		
	}
	if(!this.states[inState]){
		return console.error("State Machine does not have: ", inState);
	};
	var transState = new State();
	transState.enterFired = false;
	transState.name = this.getTransKey(outState, inState);

	transState.onEnter.add(callback, this);
	transState.isTransition = true;
	this.states[transState.name] = transState;
	return transState;
};

function State(){
	this.name = "";
	this.onInit = new Phaser.Signal();
	this.onEnter= new Phaser.Signal();
	this.onExit = new Phaser.Signal();
	this.onUpdate = new Phaser.Signal();
	this.enterFired = false;
	
	this.data = {};
	this.isTransition = false;
};