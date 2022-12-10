if(!Memory.groups) {
    Memory.groups = {};
}
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
        return Memory.groups[this.id] =
            Memory.groups[this.id] || {};
    },
    set: function(value) {
        Memory.groups[this.id] = value;
    }
})

/**
 * @type {Creep}
 */
Object.defineProperty(Group.prototype,"attacker",{
    get: function() {
         return Game.creeps[this._at]
    },
    set: function(value) {}
})
/**
 * @type {Creep}
 */
Object.defineProperty(Group.prototype,"healer",{
    get: function() {
        return Game.creeps[this._h]
    },
    set: function(value) {}
})

/**
 * @param args {[{BodyPartConstant}|{number}][]}
 */
function calc(args){
    const arr=[]
    for (const pair of args){
        for (let i=0;i<pair[1];i++){
            arr.push(pair[0])
        }
    }
    return arr
}
/**
 * @param room {Room}
 */
Group.init=function (room){
    let id=Game.time%1000+"p";
    while(Memory.groups[id]){
        id+="2";
    }
    Memory.groups[id]={}
    Memory.groups[id].room=room.name
    room.addBodyTask(calc([[TOUGH,4],[WORK,36],[MOVE,10]]),{name: room.name+id+"atk"})
    room.addBodyTask(calc([[TOUGH,4],[RANGED_ATTACK,32],[HEAL,4],[MOVE,10]]),{name: room.name+id+"heal"})
    return id
}
/**
 *
 * @return {Room}
 */
Group.prototype.getRoom=function (){
    return this.attacker.room
}
Group.prototype.heal=function (){
    const hler=this.healer
    const atker=this.attacker
    const i=(hler.hitsMax-hler.hits)-(atker.hitsMax-atker.hits)
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
Group.prototype.autoMass=function (){
    if (Game.time%3==0){
        const creeps=this.healer.pos.findInRange(FIND_HOSTILE_CREEPS,3)
        if (creeps.length){
            this.memory.enemy=creeps[0].id
        }
    }
    if(this.memory.enemy){
        if(this.healer.rangedAttack(Game.getObjectById(this.memory.enemy))!=OK){
            this.healer.rangedMassAttack()
        }
    }else{
        this.healer.rangedMassAttack()
    }
    
}
Group.prototype.moveTo=function (target){
    const hler=this.healer
    const atker=this.attacker
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
    if (!this.healer.mass){
        if (this.healer.rangedAttack(target)==OK){
            this.healer.mass=true
        }
    }
    return this.attacker.dismantle(target)
}
Group.prototype.boost=function (){
    if (!this.memory.bst){
        const room=Game.rooms[this.memory.room]
        const attacker=this.attacker
        const healer=this.healer
        if (attacker&&!attacker.memory.boosted){
            if (room.boost(attacker,"XGHO2",120)+room.boost(attacker,"XZH2O",1080)+room.boost(attacker,"XZHO2",300)===OK){
                attacker.memory.boosted=true
                room.freeLab(attacker,"XGHO2")
                room.freeLab(attacker,"XZH2O")
                room.freeLab(attacker,"XZHO2")
            }
        }
        if (healer&&!healer.memory.boosted){
            if (room.boost(healer,"XGHO2",120)+room.boost(healer,"XLHO2",120)+room.boost(healer,"XKHO2",960)+room.boost(healer,"XZHO2",300)===OK){
                healer.memory.boosted=true
                room.freeLab(healer,"XGHO2")
                room.freeLab(healer,"XLHO2")
                room.freeLab(healer,"XKHO2")
                room.freeLab(healer,"XZHO2")
            }
        }
        if (attacker.memory.boosted&&healer.memory.boosted){
            this.memory.bst=true
        }
    }
    return true
    return this.memory.bst
}
Group.prototype.isAlive=function (){
    if (this.attacker&&this.healer){
        return true
    }else if (this.attacker&&this.attacker.spawning){
        return true
    }else if (this.healer&&this.healer.spawning){
        return true
    }
    return false
}
Group.prototype.suicide=function (){
    if (this.attacker){
        this.attacker.suicide()
    }
    if (this.healer){
        this.healer.suicide()
    }
    delete Memory.groups[this.id]
}
global.Group=Group
global.calc=calc