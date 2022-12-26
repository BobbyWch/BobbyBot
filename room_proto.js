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
const color=Logger.color
const RED=Colors.red
const YELLOW=Colors.yellow
const BLUE=Colors.blue
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
Room.prototype.work=function() {
    if (this.controller.level>5) {
        const property = this.memory.prop
        if (property.power) {
            this.powerSpawn.processPower()
            if (!this.powerSpawn.store[RESOURCE_ENERGY]) {
                if (this.storage.store[RESOURCE_ENERGY] >= 300000) {
                    this.centerTask(this.storage, this.powerSpawn, RESOURCE_ENERGY, 5000)
                }
            } else if (!this.powerSpawn.store[RESOURCE_POWER]) {
                if (this.storage.store[RESOURCE_POWER] >= 200) {
                    this.centerTask(this.storage, this.powerSpawn, RESOURCE_POWER, 100)
                }
            }
        }
        this.storage.balance()
        if (property.factory) {
            this.factory.work()
        }
        if (this.terminal) {
            this.terminal.work()
        }
        for (const m of this.memory.mission) {
            missionMap[m](this)
        }
        if (property.pc) {
            this.pc().work()
        }
        if (property.extStore && (!this.storage.effects.length || this.storage.effects[0].ticksRemaining < 70)) {
            this.pc().addTask(PWR_OPERATE_STORAGE, this.storage.id)
        }
        if (Game.time%2000==0) {
            if (this.controller.level==8&&this.controller.ticksToDowngrade<110000){
                this.addBodyTask([WORK, CARRY, MOVE], {role: config.upgrader}, false)
            }
            if (!CreepApi.numOf(config.miner,this.name)){
                if (this.find(FIND_MINERALS)[0].mineralAmount){
                    CreepApi.add(config.miner,this.name)
                }
            }
        }
        this.runLab()
    } else {
        if (!this.memory.tasks.length) {
            this.addTask({role: config.worker})
        }
        if (Game.time % 30 == 0) {
            let i = 0
            let c
            for (c of this.find(FIND_MY_CREEPS)) {
                if (c.memory.work == "fill") {
                    i++
                }
            }
            if (i < 2) {
                if (c) {
                    c.memory.work = "fill"
                }
            }
        }
        return
    }
    if (Game.time % 25 == 0) {
        Tower.repair(this)
    }
    if (this.memory._heal) {
        const cr = Game.getObjectById(this.memory._heal)
        if (cr.hits == cr.hitsMax) {
            delete this.memory._heal
        } else {
            Tower.heal(this, cr)
        }
    } else if (this.memory.enemy) {
        for (const event of this.getEventLog()) {
            if (event.event == EVENT_OBJECT_DESTROYED) {
                if (event.type == STRUCTURE_WALL || event.type == STRUCTURE_RAMPART) {
                    this.controller.activateSafeMode()
                }
            }
        }
        const enemy = Game.getObjectById(this.memory.enemy);
        if (enemy) {
            Tower.attack(this, enemy)
        } else {
            delete this.memory.enemy
        }
    }
    if (Game.time % 10 == 0) {
        if (this.memory.oldLevel) {
            if (this.controller.level != this.memory.oldLevel) {
                this.onUpgrade(this.controller.level)
            }
        } else {
            if (this.controller.level != 8) {
                this.memory.oldLevel = this.controller.level
            }
        }
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
        CreepApi.remove(config.builder,this.name)
        return null
    }
}
/**
 * @return {Structure} Should repair
 */
Room.prototype.callAfterBuilt=function (){
    if (this.memory._build.type==STRUCTURE_SPAWN){
        const info=this.memory._build
        const s=new RoomPosition(info.x,info.y,this.name).lookFor(LOOK_STRUCTURES).find(o=>o.structureType==info.type)
        this.memory.spawns.push(s.id)
    }else if (this.memory._build.type==STRUCTURE_WALL||this.memory._build.type==STRUCTURE_RAMPART){
        if (!CreepApi.numOf(config.repairer,this.name)){
            CreepApi.add(config.repairer,this.name)
        }
        const info=this.memory._build
        return new RoomPosition(info.x,info.y,this.name).lookFor(LOOK_STRUCTURES).find(o=>o.structureType==info.type)
    }else if (this.memory._build.type==STRUCTURE_LAB){
        if (this.find(FIND_MY_STRUCTURES,{filter:o=>o.structureType==STRUCTURE_LAB}).length==10){
            this.initLab()
        }
    }else if (this.memory._build.type==STRUCTURE_TOWER){
        const info=this.memory._build
        Tower.addTower(this,new RoomPosition(info.x,info.y,this.name).lookFor(LOOK_STRUCTURES).find(o=>o.structureType==info.type))
    }
    return null
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
Object.defineProperty(Room.prototype, 'upLink', {get: function() {
        if (!this._ul){
            if (this.memory.ids._ul){
                this._ul=Game.getObjectById(this.memory.ids._ul)
            }else {
                this._ul=this.controller.pos.findInRange(FIND_MY_STRUCTURES,3).find(o=>o.structureType===STRUCTURE_LINK)
                this.memory.ids._ul=this._ul.id
            }
        }
        return this._ul
    }, set: noModify});
/**
 * @type {StructureFactory}
 */
Object.defineProperty(Room.prototype, 'factory', {get: function() {
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
    }, set: noModify});
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
        this.memory.tasks.splice(0,0,{ _role: mem.role, _mem: mem });
    } else {
        this.memory.tasks.push({ _role: mem.role, _mem: mem });
    }
}
const spawnIgnore=[config.harvester]
const rand=Math.random
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
                    if (counter[index] < CreepApi.numOf(index,this.name) && this.energyAvailable >= global.roles[index].cost) {
                        spawn.spawnCreep(global.roles[index].parts, `c${Game.time%10000}_${0|rand()*1000}`, {
                            memory: {
                                role: index,
                                belong: this.name
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
                        newCreep._mem.belong=this.name
                        spawn.spawnCreep(global.roles[newCreep._role].parts, name, {memory: newCreep._mem});
                        counter[newCreep._role]++
                        this.memory.tasks.shift()
                    }
                } else {
                    if (this.energyAvailable >= global.getCost(newCreep._body)) {
                        newCreep._mem.belong=this.name
                        spawn.spawnCreep(newCreep._body, name, {memory: newCreep._mem});
                        this.memory.tasks.shift()
                    }
                }
            }
        }
    }
}
Room.prototype.getSource = function () {
    return this.find(FIND_SOURCES)[Math.round(Math.random())];
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
    console.log(`${this.name} CarryTask:${struct.structureType} ${res}  ${num}`)
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
Room.prototype.runLab=function (){
    const mem=this.memory.labs
    if (!mem.state) {
        this.planLab()
    }
    switch (mem.state){
        case "prepare":
            /**@type {StructureLab}*/
            const lab1=Game.getObjectById(mem.main1)
            if (lab1.store[lab1.mineralType]){
                if (lab1.mineralType==mem.src1){
                    if (lab1.store[mem.src1]<700){
                        lab1.getS(mem.src1)
                        return;
                    }
                }else {
                    lab1.takeS(lab1.mineralType)
                    return;
                }
            }else {
                lab1.getS(mem.src1)
                return;
            }
            /**@type {StructureLab}*/
            const lab2=Game.getObjectById(mem.main2)
            if (lab2.store[lab2.mineralType]){
                if (lab2.mineralType==mem.src2){
                    if (lab2.store[mem.src2]<700){
                        lab2.getS(lab2.mineralType)
                        return;
                    }
                }else {
                    lab2.takeS(lab2.mineralType)
                    return;
                }
            }else {
                lab2.getS(mem.src2)
                return;
            }
            mem.state="react"
            break
        case "react":
            if (Game.time<mem.cooldown){
                return
            }
            const lab11=Game.getObjectById(mem.main1)
            const lab22=Game.getObjectById(mem.main2)
            let result
            for (const id of mem.others){
                result=Game.getObjectById(id).runReaction(lab11,lab22)
                if (result!=OK){
                    if (result==ERR_TIRED){
                        mem.cooldown=Game.time+Game.getObjectById(id).cooldown
                    }else if (result==ERR_NOT_ENOUGH_RESOURCES){
                        mem.state="collect"
                    }
                    return;
                }
            }
            break
        case "collect":
            let lab
            for (const id of mem.others){
                lab=Game.getObjectById(id)
                if (lab.store[lab.mineralType]){
                    lab.takeS(lab.mineralType,lab.store[lab.mineralType])
                    return;
                }
            }
            delete mem.state
            break
    }
}
Room.prototype.react=function (src1,src2){
    const mem=this.memory.labs
    mem.src1=src1
    mem.src2=src2
    mem.state="prepare"
}
const labMap={}
for (const key in REACTIONS){
    const child=REACTIONS[key]
    for (const k2 in child){
        if (!labMap[child[k2]]){
            labMap[child[k2]]=[]
        }
        labMap[child[k2]].push(key)
    }
}
const labInfo=[
    ["OH",2000],
    ["ZK",2000],
    ["UL",2000],
    ["G",10000],
    ["GO",2000],
    ["GHO2",2000],
    ["KO",2000],
    ["KHO2",2000],
    ["ZO",2000],
    ["ZHO2",2000],
    ["ZH",2000],
    ["ZH2O",2000]]
Room.prototype.planLab=function (){
    const mem=this.memory.labs
    const st=this.getStore()
    for (const k of labInfo){
        if (!st[k[0]]||st[k[0]]<k[1]){
            mem.src1=labMap[k[0]][0]
            mem.src2=labMap[k[0]][1]
            break
        }
    }
    console.log(`${this.name} lab plan: ${mem.src1} ${mem.src2}`)
    mem.state="prepare"
}
Room.prototype.initLab=function(){
    this.memory.labs={}
    let mainLabs=[]
    const allLabs=this.find(FIND_MY_STRUCTURES,{filter:o=>o.structureType==STRUCTURE_LAB})
    const maxNum=allLabs.length-1
    for (const lab of allLabs){
        let i=0
        let p=lab.pos
        for (const lab2 of allLabs){
            if (lab2.id==lab.id){
                continue
            }
            if (p.getRangeTo(lab2)<=2){
                i++
            }
        }
        if (i==maxNum){
            mainLabs.push(lab.id)
        }
    }
    this.memory.labs.others=[]
    for (const lab of allLabs){
        if (!mainLabs.includes(lab.id)){
            this.memory.labs.others.push(lab.id)
        }
    }
    for (let i=0;i<mainLabs.length;i++){
        this.memory.labs[`main${i+1}`]=mainLabs[i]
    }
    this.memory.labs.cooldown=1
}
Room.prototype.centerTask=function (from,to,res,num){
    if (this.memory.centerTasks[from.id]){
        return
    }
    this.memory.centerTasks[from.id]={
        target:to.id,
        res:res,
        num:num
    }
    console.log(`${color(this.name,BLUE)} CenterTask:${color(res,YELLOW)}  ${num}`);
}
Room.prototype.onUpgrade=function (newLevel){
    if (newLevel==8){
        delete this.memory.oldLevel
        CreepApi.remove(config.upgrader,this.name)
    }
}