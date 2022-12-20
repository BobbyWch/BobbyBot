console.log("Global reset")
require("./constant")
let r = Game.rooms.W53S7
global.roles = {}
const config = require("./config")
config.init(roles)
require("./protos")
require("./goals_mgr")
const creepLogic = require("./logic")
Channel.init()
module.exports.loop = function () {
    Game.sell={}
    runCreeps()
    runRooms()
    if (Game.time%3==0){
        countCreep()
    }
    global.Goal.run()
    finalize()
    runTimer()
    if (Game.cpu.bucket === 10000) {
        Game.cpu.generatePixel();
    }
}

function finalize() {
    const r=Game.rooms.W53S7
    if (r.memory.upgTime < Game.time) {
        r.addBodyTask([WORK,CARRY,MOVE],{ role: config.upgrader }, false)
        r.memory.upgTime = Game.time + 40000
    }
    if(Game.time%1400==0){
        r.addTask({role:config.repairer})
    }
}
if (!Memory.timer) {
    Memory.timer = {}
}
function runTimer() {
    for (const t in Memory.timer) {
        if (Game.time >= t) {
            r.addTask(Memory.timer[t])
            delete Memory.timer[t]
        }
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
        if (creep.spawning||creep.ticksToLive >= 80 || creep.memory.role === config.miner) {
            counter[creep.room.name][creep.memory.role]++
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
funcs[config.miner]=creepLogic.miner
funcs[config.spawner]=creepLogic.spawner
funcs[config.upgrader]=creepLogic.upgrade
funcs[config.repairer]=creepLogic.repairer
funcs[config.builder]=creepLogic.builder
funcs[config.carrier]=(creep)=>creep.runCarry()
funcs[config.cleaner]=creepLogic.manager
funcs[config.upgrader]=creepLogic.upgrader
funcs["goal"]=(creep)=>{
    Goal.callAddCreep(creep, creep.memory.goal_id);
    delete creep.memory.role;
}
function runCreeps(){
    let creeps=Game.creeps
    let creep
    for (const n in creeps){
        creep=creeps[n]
        if (creep.spawning){
            continue
        }
        funcs[creep.memory.role](creep)
    }
}