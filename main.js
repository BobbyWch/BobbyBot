console.log("Global reset")
require("./constant")
const creepLogic = require("./logic")
Channel.init()
let _cache
module.exports.loop = function () {
    if (_cache) {
        delete global.Memory
        global.Memory = _cache
    } else {
        _cache = Memory
    }
    Game.sell={}
    if (Game.time%3==0){
        countCreep()
    }
    runRooms()
    runCreeps()
    if (Game.cpu.bucket == 10000) {
        Game.cpu.generatePixel();
    }
    RawMemory._parsed = global.Memory
}

function runRooms(){
    let rooms=Game.rooms,r,n
    for (n in rooms){
        r=Game.rooms[n]
        if (r.controller&&r.controller.my){
            r.work()
        }
    }
}
function countCreep(){
    let creep,c,r,role
    const counter={},rooms=Game.rooms,creeps=Game.creeps
    for (r in rooms){
        r=rooms[r]
        if (r.controller&&r.controller.my){
            c={}
            for (role in global.roles){
                c[role]=0
            }
            counter[r.name]=c
        }
    }
    for (c in creeps){
        creep=creeps[c]
        if (creep.spawning||creep.ticksToLive >= 3.2*creep.body.length) {
            if(counter[creep.memory.belong]){
                counter[creep.memory.belong][creep.memory.role]++
            }
        }
    }
    doSpawn(counter)
    for (c in Memory.creeps) {
        if (!creeps[c]) {
            delete Memory.creeps[c]
            delete Buff[c]
        }
    }
}
const funcs={}
funcs[config.harvester]=creepLogic.harvester
funcs[config.spawner]=creepLogic.spawner
funcs[config.repairer]=creepLogic.repairer
funcs[config.builder]=creepLogic.builder
funcs[config.carrier]=(creep)=>creep.runCarry()
funcs[config.cleaner]=creepLogic.manager
funcs[config.upgrader]=creepLogic.upgrader
funcs[config.transfer]=creepLogic.remoteTransfer
funcs[config.claimer]=creepLogic.claimer
funcs[config.starter]=creepLogic.starter
funcs[config.worker]=creepLogic.worker
funcs[config.remote]=creepLogic.remote
funcs[config.attacker]=creepLogic.attacker
funcs[config.miner]=creepLogic.miner
function runCreeps() {
    let creep,n,creeps = Game.creeps
    const cs=[]
    for (n in creeps) {
        creep = creeps[n]
        if (creep.memory.needBoost){
            if(creep.room.prepareBoost(creep)){
                creep.room.boost(creep)
            }
        }
        if (creep.spawning) {
            continue
        }
        if (creep.memory.role){
            if (creep.memory.role==config.carrier){
                cs.push(creep)
            }else {
                funcs[creep.memory.role](creep)
            }
        }
    }
    //carrier后置执行
    n=funcs[config.carrier]
    for (creep of cs){
        n(creep)
    }
}

const spawnIgnore=[config.harvester]
const rand=Math.random
function getBody(role,level){
    if (global.roles[role].adapt){
        return global.roles[role].adapt(level)
    }else {
        return global.roles[role].parts
    }
}
function doSpawn(counts){
    let sn,spawn,counter,room,name,cConfig,result,cost
    const sps=Game.spawns
    for (sn in sps){
        spawn=sps[sn]
        if (!spawn.spawning) {
            room=spawn.room
            counter=counts[room.name]
            if (room.memory.tasks.length) {
                const newCreep = room.memory.tasks[0];
                if (newCreep._mem.name){
                    name=newCreep._mem.name
                    delete newCreep._mem.name
                }else {
                    name=`c${Game.time%10000}_${0|Math.random()*1000}`
                }
                if (newCreep._role && global.roles[newCreep._role]) {
                    cost=getCost(getBody(newCreep._role,room.controller.level))
                    if (room.energyAvailable >= cost) {
                        newCreep._mem.belong=room.name
                        if(spawn.spawnCreep(getBody(newCreep._role,room.controller.level), name, {memory: newCreep._mem})==OK){
                            room.memory.tasks.shift()
                            room.energyAvailable-=cost
                        }
                        counter[newCreep._role]++
                    }
                } else {
                    cost=getCost(newCreep._body)
                    if (room.energyAvailable >= cost) {
                        newCreep._mem.belong=room.name
                        if(spawn.spawnCreep(newCreep._body, name, {memory: newCreep._mem})==OK){
                            room.memory.tasks.shift()
                            room.energyAvailable-=cost
                        }
                    }
                }
            } else {
                cConfig=Memory.creepConfigs[room.name]
                for (const index in global.roles) {
                    if (spawnIgnore.includes(index)) {
                        continue;
                    }
                    cost=getCost(getBody(index,room.controller.level))
                    if (counter[index] < CreepApi.numOf(index,room.name) && room.energyAvailable >= cost) {
                        result=spawn.spawnCreep(getBody(index,room.controller.level), `c${Game.time%10000}_${0|rand()*1000}`, {
                            memory: {
                                role: index,
                                belong: room.name
                            }
                        })
                        if (result==OK){
                            room.energyAvailable-=cost
                            counter[index]++
                        }
                        break;
                    }
                }
            }
        }
    }
}
const Buff={}
Object.defineProperty(Creep.prototype,"buff",{
    get: function() {
        return Buff[this.name] =Buff[this.name] || {};
    },
    set: function(value) {Buff[this.name] = value;}
})