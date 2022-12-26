console.log("Global reset")
require("./constant")
global.roles = {}
global.config = require("./config")
require("./protos")
const creepLogic = require("./logic")
Channel.init()
module.exports.loop = function () {
    Game.sell={}
    runCreeps()
    runRooms()
    if (Game.time%3==0){
        countCreep()
    }
    if (Game.cpu.bucket == 10000) {
        Game.cpu.generatePixel();
    }
}
function runRooms(){
    let rooms=Game.rooms
    let r
    for (const n in rooms){
        r=Game.rooms[n]
        if (r.controller&&r.controller.my){
            if (Game.time%2){
                const hostiles = r.find(FIND_HOSTILE_CREEPS)
                if (hostiles.length){
                    let closest
                    for (const creep of hostiles) {
                        if (closest) {
                            if (creep.pos.getRangeTo(25, 25) < closest.pos.getRangeTo(25, 25)) {
                                closest = creep;
                            }
                        } else {
                            closest = creep;
                        }
                    }
                    if (closest) {
                        r.memory.enemy = closest.id;
                    }
                }
            }
            r.work()
        }
    }
}
function countCreep(){
    let creep
    const counter={}
    for (let r in Game.rooms){
        r=Game.rooms[r]
        if (r.controller&&r.controller.my){
            const c={}
            for (const role in global.roles){
                c[role]=0
            }
            counter[r.name]=c
        }
    }
    for (const c in Game.creeps){
        creep=Game.creeps[c]
        if (creep.spawning||creep.ticksToLive >= 80 || creep.memory.role === config.harvester) {
            if(counter[creep.room.name]){
                counter[creep.room.name][creep.memory.role]++
            }
        }
    }
    for (const n in counter){
        Game.rooms[n].doSpawn(counter[n])
    }
    for (const i in Memory.creeps) {
        if (!Game.creeps[i]) {
            delete Memory.creeps[i];
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
    let creeps = Game.creeps
    let creep
    for (const n in creeps) {
        creep = creeps[n]
        if (creep.spawning) {
            continue
        }
        funcs[creep.memory.role](creep)
    }
}