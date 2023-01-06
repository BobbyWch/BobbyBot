if(!Memory.groups) {
    Memory.groups = {};
}
const groupMap={}
function Group(id){
    if (id&&Memory.groups[id]){
        this.id=id
        this._at=this.memory.room+id+"atk"
        this._h=this.memory.room+id+"heal"
    }else {
        console.log("无效group id")
    }
}
Object.defineProperty(Group.prototype,"memory",{
    get: function() {
        return Memory.groups[this.id] = Memory.groups[this.id] || {};
    },
    set: function(value) {
        Memory.groups[this.id] = value;
    }
})

/**
 * @return {Creep}
 */
Group.prototype.attacker=function (){
    return Game.creeps[this._at]
}
/**
 * @return {Creep}
 */
Group.prototype.healer=function (){
    return Game.creeps[this._h]
}
/**
 * @param room {Room}
 */
Group.init=function (room){
    let id=util.getId("g")
    Memory.groups[id]={}
    Memory.groups[id].room=room.name
    room.addBodyTask(calc([[WORK,3],[TOUGH,7],[WORK,30],[MOVE,10]]),{name: room.name+id+"atk",needBoost:["XGHO2","XZH2O","XZHO2"]})
    room.addBodyTask(calc([[RANGED_ATTACK,3],[TOUGH,7],[RANGED_ATTACK,16],[HEAL,14],[MOVE,10]]),{name: room.name+id+"heal",needBoost:["XGHO2","XLHO2","XKHO2","XZHO2"]})
    return id
}
/**
 *
 * @return {Room}
 */
Group.prototype.getRoom=function (){
    return this.attacker().room
}
Group.prototype.heal=function (){
    const hler=this.healer()
    const atker=this.attacker()
    const i=hler.hitsMax-hler.hits-atker.hitsMax+atker.hits//(hler.hitsMax-hler.hits)-(atker.hitsMax-atker.hits)
    if (i>0){
        hler.heal(hler)
        this.lastHeal=hler.name
    }else if (i==0){
        if (!this.lastHeal){
            this.lastHeal=this.healer.name
        }
        hler.heal(Game.creeps[this.lastHeal])
    }else {
        hler.heal(atker)
        this.lastHeal=atker.name
    }
}
Group.prototype.autoMass=function () {
    const creeps = this.healer().pos.findInRange(FIND_HOSTILE_CREEPS, 3)
    if (creeps.length) {
        const hler=this.healer()
        for (const c of creeps){
            if (hler.pos.isNearTo(c)){
                hler.rangedMassAttack()
                return
            }
        }
        hler.rangedAttack(creeps[0])
        hler.hasMassed=true
    }
}

Group.prototype.moveTo=function (target){
    const hler=this.healer()
    const atker=this.attacker()
    if (atker.room.name!=this.memory.room){
        atker.memory.dontPullMe=true
    }
    if (hler.fatigue||atker.fatigue){
        return
    }
    if (atker.room.name!=hler.room.name||atker.pos.isNearTo(hler)){
        atker.moveTo(target)
    }
    hler.moveTo(atker)
}
Group.prototype.dismantle=function (target){
    const hler=this.healer()
    if (!hler.hasMassed){
        if (hler.rangedAttack(target)==OK){
            hler.hasMassed=true
        }
    }
    return this.attacker().dismantle(target)
}
Group.prototype.boosted=function (){
    if (!this.memory.bst){
        const attacker=this.attacker()
        const healer=this.healer()
        if (attacker&&healer&&attacker.memory.boosted&&healer.memory.boosted){
            this.memory.bst=true
        }
    }
    return this.memory.bst
}
Group.prototype.isAlive=function (){
    if (this.attacker()&&this.healer()){
        return true
    }else if (this.attacker()&&this.attacker().spawning){
        return true
    }else if (this.healer()&&this.healer().spawning){
        return true
    }
    return false
}
Group.prototype.suicide=function (){
    if (this.attacker()){
        this.attacker().suicide()
    }
    if (this.healer()){
        this.healer().suicide()
    }
    delete Memory.groups[this.id]
    delete groupMap[this.id]
}
/**
 *
 * @param id {string}
 * @return {Group}
 */
Group.getGroup=(id)=>groupMap[id]||(groupMap[id]=new Group(id))
global.Group=Group