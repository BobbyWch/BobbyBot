const config = require("./config");
const Const=global.Constant.carryTaskType
for (const n in Game.rooms) {
    const r = Game.rooms[n];
    let mem
    if (r.controller&&r.controller.my) {
        mem=r.memory
        notNull(mem,"carryTasks",{})
        notNull(mem,"centerTasks",{})
        notNull(mem,"structs",{})
        notNull(mem,"tasks",[])
        notNull(mem,"mission",[])
        notNull(mem,"ids",{})
        notNull(mem,"prop",{})
        r.memory.spawns=[]
        for (const s of r.find(FIND_MY_SPAWNS)){
            r.memory.spawns.push(s.id)
        }
        if (r.terminal){
            mem=r.terminal.memory
            notNull(mem,"deals",[])
            notNull(mem,"sends",[])
        }
    }
}
function notNull(mem,name,value){
    if (!mem[name]){
        mem[name]=value
    }
}
missionMap={
    clearLab(room){
        for (const id of room.memory.labs.others){
            if (Game.getObjectById(id).clear()){
                return
            }
        }
        room.deleteMission("clearLab")
        console.log("任务结束")
    }
}
Room.prototype.work=function(){
    const property=this.memory.prop
    if(property.power){
        this.powerSpawn.processPower()
        if (!this.powerSpawn.store[RESOURCE_ENERGY]){
            if (this.storage.store[RESOURCE_ENERGY] >= 300000){
                this.centerTask(this.storage.id,this.powerSpawn.id,RESOURCE_ENERGY,5000)
            }
        }else if (!this.powerSpawn.store[RESOURCE_POWER]){
            if (this.storage.store[RESOURCE_POWER] >= 200){
                this.centerTask(this.storage.id,this.powerSpawn.id,RESOURCE_POWER,100)
            }
        }
    }
    if (property.upgrade){
        if (Game.time%1500==0){
            this.addTask({role:config.upgrader})
        }
    }
    this.storage.balance()
    if(property.factory){
        this.factory.work()
    }
    this.terminal.work()
    for (const m of this.memory.mission){
        missionMap[m](this)
    }
    if (this.memory._heal) {
        const cr = Game.getObjectById(this.memory._heal)
        if (cr.hits === cr.hitsMax) {
            delete this.memory._heal
        } else {
            Tower.heal(this, cr)
        }
    }
    else if (this.memory.enemy) {
        for (const event of this.getEventLog()) {
            if (event.event === EVENT_OBJECT_DESTROYED) {
                if (event.type === STRUCTURE_WALL || event.type === STRUCTURE_RAMPART) {
                    this.controller.activateSafeMode()
                }
            }
        }
        const enemy = Game.getObjectById(this.memory.enemy);
        if (enemy) {
            Tower.attack(this,enemy)
        } else {
            delete this.memory.enemy
        }
    }
    if (Game.time % 25 == 0) {
        Tower.repair(this)
    }
    if (property.pc){
        this.pc().work()
        if (Game.time % 900 == 0) {
            this.pc().addTask(PWR_OPERATE_STORAGE, this.storage.id)
        }
    }
}
/**
 * @return {Structure}
 */
Room.prototype.getSite=function (){
    let info=this.memory._repair
    if (info){
        // if ()
    }
    const sites=this.find(FIND_MY_CONSTRUCTION_SITES)
    if (sites.length){
        let site
        for (const s of sites){
            if (s.structureType==STRUCTURE_ROAD){
                site=s
                break
            }
        }
        if (!site){
            site=sites[0]
        }
        this.memory._build={
            id:site.id,
            x:site.pos.x,
            y:site.pos.y,
            type:site.structureType
        }
        return site
    }else {
        delete this.memory._build
        return null
    }
}
/**
 * @return {null|ConstructionSite<BuildableStructureConstant>}
 */
Room.prototype.flushSite=function (){
    const sites=this.find(FIND_MY_CONSTRUCTION_SITES)
    if (sites.length){
        let site
        for (const s of sites){
            if (s.structureType==STRUCTURE_ROAD){
                site=s
                break
            }
        }
        if (!site){
            site=sites[0]
        }
        this.memory._build={
            id:site.id,
            x:site.pos.x,
            y:site.pos.y,
            type:site.structureType
        }
        return site
    }else {
        delete this.memory._build
        return null
    }
}
//this.memory._build
Room.prototype.callAfterBuilt=function (){
    if (this.memory._build.type==STRUCTURE_SPAWN){
        const info=this.memory._build
        const s=new RoomPosition(info.x,info.y,this.name).lookFor(LOOK_STRUCTURES).find(o=>o.structureType==info.type)
        this.memory.spawns.push(s.id)
    }
}
Room.prototype.addMission=function (name){
    this.memory.mission.push(name)
}
Room.prototype.deleteMission=function (name){
    this.memory.mission=this.memory.mission.filter(o=>o!=name)
}
const noModify=function (value){}
/**
 * @type {StructureLink}
 */
Object.defineProperty(Room.prototype, 'centerLink', {
    get: function() {
        if (!this._cl){
            if (this.memory.ids._cl){
                this._cl=Game.getObjectById(this.memory.ids._cl)
            }else {
                this._cl=this.storage.pos.findInRange(FIND_MY_STRUCTURES,2).find(o=>o.structureType===STRUCTURE_LINK)
                this.memory.ids._cl=this._cl.id
            }
        }
        return this._cl
    },
    set: noModify
});
/**
 * @type {StructureLink}
 */
Object.defineProperty(Room.prototype, 'upLink', {
    get: function() {
        if (!this._ul){
            if (this.memory.ids._ul){
                this._ul=Game.getObjectById(this.memory.ids._ul)
            }else {
                this._ul=this.controller.pos.findInRange(FIND_MY_STRUCTURES,3).find(o=>o.structureType===STRUCTURE_LINK)
                this.memory.ids._ul=this._ul.id
            }
        }
        return this._ul
    },
    set: noModify
});
/**
 * @type {StructureFactory}
 */
Object.defineProperty(Room.prototype, 'factory', {
    get: function() {
        if (!this._fa) {
            if (!this.memory.ids._fa) {
                if (this.memory.prop.factory) {
                    this.memory.ids._fa = this.find(FIND_MY_STRUCTURES).find(o => o.structureType === STRUCTURE_FACTORY).id
                } else {
                    return null
                }
            }
            this._fa = Game.getObjectById(this.memory.ids._fa)
        }
        return this._fa
    },
    set: noModify
});
/**
 * @type {StructurePowerSpawn}
 */
Object.defineProperty(Room.prototype, 'powerSpawn', {
    get: function() {
        if (!this._pcs){
            if (!this.memory.ids._pcs){
                this.memory.ids._pcs=this.find(FIND_MY_STRUCTURES).find(o=>o.structureType===STRUCTURE_POWER_SPAWN).id
            }
            this._pcs=Game.getObjectById(this.memory.ids._pcs)
        }
        return this._pcs
    },
    set: noModify
});
/**
 * @type {StructureNuker}
 */
Object.defineProperty(Room.prototype, 'nuker', {
    get: function() {
        if (!this._nu){
            if (!this.memory.ids._nu){
                this.memory.ids._nu=this.find(FIND_MY_STRUCTURES).find(o=>o.structureType===STRUCTURE_NUKER).id
            }
            this._nu=Game.getObjectById(this.memory.ids._nu)
        }
        return this._nu
    },
    set: noModify
});
Room.prototype.addBodyTask = function (body,mem,addToFirst) {
    if (addToFirst) {
        this.memory.tasks.unshift({ _body: body, _mem: mem });
    } else {
        this.memory.tasks.push({ _body: body, _mem: mem });
    }
}
/**
 * @param ac {AnyCreep}
 */
Room.prototype.heal=function (ac){
    this.memory._heal=ac.id
}
/**
 *
 * @param c {Creep}
 * @param type {ResourceConstant}
 * @param num {number}
 * @return {ScreepsReturnCode}
 */
Room.prototype.boost=function (c,type,num){
    const mem=this.memory
    if (!mem.boost){
        mem.boost={}
    }
    const labId=mem.boost[c.name+type]
    if (labId){
        /**@type {StructureLab}*/
        const lab=Game.getObjectById(labId)
        if (!c.spawning){
            if (c.boosts().includes(type)){
                return OK
            }
            if (c.pos.isNearTo(lab)){
                if (lab.store.getUsedCapacity(type)>=num){
                    return lab.boostCreep(c)
                }else {
                    return ERR_NOT_ENOUGH_RESOURCES
                }
            }else {
                c.moveTo(lab)
                return ERR_NOT_IN_RANGE
            }
        }
    }else {
        /**
         * @type {StructureLab}
         */
        let lab
        for (const id of mem.labs.others){
            lab=Game.getObjectById(id)
            if (!lab.memory.boosting){
                lab.memory.boosting=true
                mem.boost[c.name+type]=id
                if (lab.mineralType){
                    if (lab.mineralType==type){
                        if (lab.store.getUsedCapacity(type)>=num){
                            return ERR_BUSY
                        }
                    }else {
                        lab.clear()
                    }
                }
                lab.getS(type,num)
                return ERR_NOT_ENOUGH_RESOURCES
            }
        }
        return ERR_BUSY
    }
}
Room.prototype.getStore=function (){
    if (!this._ast){
        const store={}
        const list=[]
        if (this.storage){
            list.push(this.storage.store)
        }
        if (this.terminal){
            list.push(this.terminal.store)
        }
        if (this.factory){
            list.push(this.factory.store)
        }
        for (const child of list){
            for (const ele in child){
                if (store[ele]){
                    store[ele]+=child[ele]
                }else {
                    store[ele]=child[ele]
                }
            }
        }
        this._ast=store
    }
    return this._ast
}
/**
 * @param c {Creep}
 */
Room.prototype.freeLab=function (c,type){
    const mem=this.memory
    if (mem.boost[c.name+type]){
        /** @type {StructureLab}*/
        const lab=Game.getObjectById(mem.boost[c.name+type])
        delete lab.memory.boosting
        delete mem.boost[c.name+type]
    }
}
/**
 * @returns {PowerCreep}
 */
Room.prototype.pc=function (){
    if (!this.memory.ids.pc){
        let p
        for (const pn in Game.powerCreeps){
            p=Game.powerCreeps[pn]
            if (p.memory.parent===this.name){
                this.memory.ids.pc=pn
            }
        }
        if (!this.memory.ids.pc){
            return null
        }
    }
    if (!this._pc){
        this._pc=Game.powerCreeps[this.memory.ids.pc]
    }
    return this._pc
}
Room.prototype.addTask = function (mem,addToFirst) {
    if (addToFirst) {
        this.memory.tasks.unshift({ _role: mem.role, _mem: mem });
    } else {
        this.memory.tasks.push({ _role: mem.role, _mem: mem });
    }
}
const spawnIgnore=[config.miner]
Room.prototype.doSpawn=function (counter){
    /**@type {StructureSpawn[]}*/
    const spawns=[]
    for (const sid of this.memory.spawns){
        spawns.push(Game.getObjectById(sid))
    }
    for (const spawn of spawns) {
        if (!spawn.spawning) {
            if (this.memory.tasks.length === 0) {
                for (const index in global.roles) {
                    if (spawnIgnore.includes(index)) {
                        continue;
                    }
                    if (counter[index] < global.roles[index].min && this.energyAvailable >= global.roles[index].cost) {
                        spawn.spawnCreep(global.roles[index].parts, `c${Game.time%10000}_${0|Math.random()*1000}`, {
                            memory: {
                                role: index
                            }
                        });
                        counter[index]++
                        break;
                    }
                }
            } else {
                const newCreep = this.memory.tasks[0];
                let name
                if (newCreep._mem.name){
                    name=newCreep._mem.name
                    delete newCreep._mem.name
                }else {
                    name=`c${Game.time%10000}_${0|Math.random()*1000}`
                }
                if (newCreep._role && global.roles[newCreep._role]) {
                    if (this.energyAvailable >= global.roles[newCreep._role].cost) {
                        spawn.spawnCreep(global.roles[newCreep._role].parts, name, {memory: newCreep._mem});
                        counter[newCreep._role]++
                        this.memory.tasks.shift();
                    }
                } else {
                    if (this.energyAvailable >= global.getCost(newCreep._body)) {
                        spawn.spawnCreep(newCreep._body, name, {memory: newCreep._mem});
                        this.memory.tasks.shift();
                    }
                }
            }
        }
    }
}
Room.prototype.getSource = function () {
    return this.find(FIND_SOURCES)[Game.time % 2];
}
/**
 *
 * @param type {ResourceConstant}
 * @param num {number}
 */
Room.prototype.findRes=function (type,num){
    if (!num){
        num=1
    }
    if (this.storage.store.getUsedCapacity(type)>=num){
        return this.storage
    }
    if (this.terminal.store.getUsedCapacity(type)>=num){
        return this.terminal
    }
    if (this.factory&&this.factory.store.getUsedCapacity(type)>=num){
        return this.factory
    }
    if (type==RESOURCE_ENERGY){
        return this.find(FIND_STRUCTURES).find(o=>o.store&&o.store.getUsedCapacity(RESOURCE_ENERGY))
    }else {
        return null
    }
}
/**
 * @param struct {Structure}
 * @param type {number}
 * @param res {ResourceConstant}
 * @param num {number}
 */
Room.prototype.addCarryTask=function(struct,type,res,num){
    if (this.memory.carryTasks[struct.structureType]){
        return;
    }
    this.memory.carryTasks[struct.structureType]={
        type: type,
        target: struct.id,
        res: res,
        num: num
    }
    console.log(`CarryTask:${struct.structureType} ${res}  ${num}`)
}
Room.prototype.deleteTask=function (owner){
    delete this.memory.carryTasks[owner]
}
Room.prototype.deleteCenter=function (id){
    delete this.memory.centerTasks[id]
}
Room.prototype.clearLabs=function () {
    this.addMission("clearLab")
}

Room.prototype.make=function (type,count,autoRefill){
    let n,mod;
    n=Math.floor(count/3000)
    mod=count-3000*n;
    if (type.startsWith("X")){
        if (n){
            for (i=0;i<n;i++){
                Goal.addGoal("react",{roomName:this.name,src1:"X",src2:type.substring(1),count:3000});
            }
            if (mod){
                Goal.addGoal("react",{roomName:this.name,src1:"X",src2:type.substring(1),count:mod});
            }
        }else {
            Goal.addGoal("react",{roomName:this.name,src1:"X",src2:type.substring(1),count:count});
        }
        console.log(n);
        console.log(mod);
        return OK;
    }
    if (type.length===2){
        if (n){
            for (i=0;i<n;i++){
                Goal.addGoal("react",{roomName:this.name,src1:type.charAt(0),src2:type.charAt(1),count:3000});
            }
            if (mod){
                Goal.addGoal("react",{roomName:this.name,src1:type.charAt(0),src2:type.charAt(1),count:mod});
            }
        }else {
            Goal.addGoal("react",{roomName:this.name,src1:type.charAt(0),src2:type.charAt(1),count:count});
        }
        console.log(n);
        console.log(mod);
        return OK
    }
    console.log("unknown type");
}
Room.prototype.stopReact=function (){
    Goal.getGoal("react").stop(this.memory.reacting,this);
}

Room.prototype.setMainLab=function(lab1,lab2){
    if (!this.memory.labs) {
        this.memory.labs={};
    }
    if (lab1&&Game.getObjectById(lab1)) {
        this.memory.labs.main1=lab1;
    }else{
        console.log("第一个参数错误");
    }
    if (lab2&&Game.getObjectById(lab2)) {
        this.memory.labs.main2=lab2;
    }else{
        console.log("第一个参数错误");
    }
}
Room.prototype.addLab=function(id){
    if (!this.memory.labs) {
        this.memory.labs={};
    }
    if (id&&Game.getObjectById(id)) {
        if (!this.memory.labs.others) {
            this.memory.labs.others=[];
        }
        this.memory.labs.others.push(id);
    }else{
        console.log("参数错误");
    }
}
Room.prototype.centerTask=function (from,to,res,num){
    if (this.memory.centerTasks[from]){
        return
    }
    this.memory.centerTasks[from]={
        target:to,
        res:res,
        num:num
    }
    console.log(`CenterTask:${res}  ${num}`);
}