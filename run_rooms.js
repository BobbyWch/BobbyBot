const config = require("./config");
const creepLogic = require("./logic");
module.exports=function (){
    run("W52S7")
    // run("W51S4")
}
const body=[CARRY,CARRY,MOVE,CARRY,CARRY,MOVE,WORK,WORK,WORK,WORK,MOVE,CARRY,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE]
/**
 *
 * @param name {string}
 */
function run(name) {
    const room = Game.rooms[name];
    const sp=Game.getObjectById(room.memory.spawns[0])
    const creeps=room.find(FIND_MY_CREEPS)
    if(creeps.length<6&&!sp.cooldown){
            sp.spawnCreep(body,Game.time+"C")
    }
    
    /**
     *
     * @type {ConstructionSite[]}
     */
    const sites = room.find(FIND_CONSTRUCTION_SITES)
    if(creeps.length<=1){
        sp.spawnCreep([WORK,CARRY,CARRY,MOVE,MOVE],Game.time+"C")
    }
    for (const creep of creeps) {
        if (!creep.memory.role) {
            if (creep.memory.working) {
                creep.memory.busy=false
                if (!creep.memory.src) {
                    creep.memory.src = "5bbcaa3e9099fc012e6310e8"
                }
                const s = Game.getObjectById(creep.memory.src)
                if (creep.harvest(s) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(s)
                    creep.memory.dontPullMe = false
                } else {
                    creep.memory.dontPullMe = true
                }
                if (creep.store.getFreeCapacity() == 0) {
                    creep.memory.working = false;
                    creep.memory.dontPullMe=false
                }
            } else {
                if(!room.hasFill&&!creep.memory.busy){
                    room.hasFill=true
                    if(room.energyAvailable<room.energyCapacityAvailable){
                        creep.fillExt()
                        creep.workIfEmpty()
                        continue
                    }
                }
                if (sites.length === 0) {
                    creep.memory.busy=true
                    if (!creep.pos.inRangeTo(room.controller, 3)) {
                        creep.moveTo(room.controller)
                    }
                    if (creep.upgradeController(room.controller) === OK) {
                        creep.memory.dontPullMe = true
                    }

                } else {
                    if (creep.build(sites[0]) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(sites[0])
                    } else {
                        creep.memory.dontPullMe = true
                    }
                }
                creep.workIfEmpty()
            }
        }
    }
}
/**
 * @param r {Room}
 */
function test(r){
    const control = r.controller;
    const allCreeps = r.find(FIND_CREEPS)
    const counter={}
    r.work()
    let tar, result, closest;
    //find不包括正在生成的creep
    for (const creep of allCreeps) {
        if (creep.my) {
            if (creep.ticksToLive >= 120 || creep.memory.role === config.miner || creep.memory.role == config.carrier) {
                counter[creep.memory.role]++;
            }
            switch (creep.memory.role) {
                case config.miner:
                    creepLogic.miner(creep)
                    break;
                case config.spawner:
                    if (creep.memory.working) {
                        creep.withdrawFromStore();
                    } else {
                        if (r.energyAvailable < r.energyCapacityAvailable) {
                            if (creep.memory.target) {
                                tar = Game.getObjectById(creep.memory.target)
                            } else {
                                tar = getTarget(creep.pos)
                                creep.memory.target = tar.id
                            }
                            if(!tar){
                                break
                            }
                        }
                        if (tar) {
                            if (creep.transfer(tar, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                creep.moveTo(tar);
                            } else if (!tar.store||!tar.store.getFreeCapacity(RESOURCE_ENERGY)) {
                                delete creep.memory.target
                            }
                            creep.workIfEmpty();
                        }
                    }
                    break;
                case config.upgrader:
                    if (creep.memory.working) {
                        creep.withdrawFromStore()
                    } else {
                        if (creep.upgradeController(control) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(controlPos);
                            creep.memory.dontPullMe = false
                        } else {
                            creep.memory.dontPullMe = true
                            creep.workIfEmpty()
                        }
                    }
                    break;
                case config.repairer:
                    if (creep.memory.working) {
                        if (creep.memory.endTime) {
                            if (Game.time > creep.memory.endTime) {
                                creep.memory._repair = null
                                creep.memory.endTime = 0
                            }
                        }
                        creep.withdrawFromStore();
                    } else {
                        if (!creep.memory._repair) {
                            let minWall = null
                            for (i of r.find(FIND_STRUCTURES)) {
                                if (i.structureType === STRUCTURE_WALL || i.structureType === STRUCTURE_RAMPART) {
                                    if (minWall) {
                                        if (i.hits < minWall.hits) {
                                            minWall = i
                                        }
                                    } else {
                                        minWall = i
                                    }
                                }
                            }
                            tar = minWall
                            creep.memory.endTime = Game.time + 500
                            creep.memory._repair = tar.id
                        } else {
                            tar = Game.getObjectById(creep.memory._repair);
                        }
                        if (!tar || tar.hits === tar.hitsMax) {
                            creep.memory._repair = null
                            creep.memory.endTime = 0
                            break
                        }
                        creep.repair(tar)
                        if (!creep.pos.inRangeTo(tar, 2)) {
                            creep.moveTo(tar)
                        }
                        creep.workIfEmpty();
                    }
                    break;
                case config.builder:
                    const sites=r.find(FIND_MY_CONSTRUCTION_SITES)
                    if (sites.length === 0) {
                        creep.memory.role = config.repairer;
                        break;
                    }
                    if (creep.memory.working) {
                        creep.memory.dontPullMe = false
                        creep.withdrawFromStore();
                    } else {
                        tar = sites[0];
                        creep.build(tar)
                        if (!creep.pos.inRangeTo(tar, 2)) {
                            creep.moveTo(tar)
                        }
                        creep.workIfEmpty()
                    }
                    break;
                case config.carrier:
                    creep.runCarry();
                    break;
                case config.cleaner:
                    if (creep.memory.working) {
                        if (r.centerLink.store.getUsedCapacity(RESOURCE_ENERGY)) {
                            if (creep.withdraw(r.centerLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                                //reep.moveTo(28,33)
                            } else {
                                creep.memory.working = false;
                            }
                        }
                    } else {
                        result = creep.transfer(r.storage, RESOURCE_ENERGY)
                        if (result === ERR_NOT_IN_RANGE) {
                            //creep.moveTo(r.storage)
                        } else {
                            creep.memory.working = true
                        }
                    }
                    if (!creep.pos.isEqualTo(28, 33)) {
                        creep.moveTo(28, 33)
                    }
                    break;
                case "goal":
                    Goal.callAddCreep(creep, creep.memory.goal_id);
                    delete creep.memory.role;
                    break;
            }
        } else {
            counter["enemy"]++;
            if (closest) {
                if (creep.pos.getRangeTo(25, 25) < closest.pos.getRangeTo(25, 25)) {
                    closest = creep;
                }
            } else {
                closest = creep;
            }
        }
    }
    if (closest) {
        r.memory.enemy = closest.id;
    }
    let creep
    for (const n in r.memory.out_workers) {
        creep = Game.creeps[r.memory.out_workers[n]]
        if (creep) {
            counter[creep.memory.role]++
            switch (creep.memory.role) {
                case config.outMiner:
                    if (creep.memory.working) {
                        if (creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
                            tar = Game.getObjectById("5bbcaa3e9099fc012e6310e7")
                            if (tar) {
                                if (Game.time % 30 == 0) {
                                    if (creep.room.find(FIND_HOSTILE_CREEPS).length > 0) {
                                        roles[config.outMiner].min = 0;
                                        creep.memory.working = false;
                                        break;
                                    }
                                }
                                if (creep.harvest(tar) == ERR_NOT_IN_RANGE) {
                                    creep.moveTo(posRes);
                                }
                            } else {
                                creep.moveTo(posRes);
                            }
                        } else {
                            creep.memory.working = false;
                        }
                    } else {
                        if (creep.transfer(r.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(r.storage);
                        }
                        if (creep.store.getUsedCapacity() === 0) {
                            if (creep.ticksToLive < 150) {
                                creep.suicide()
                            }
                        }
                        creep.workIfEmpty();
                    }
                    break;
                case config.outBuilder:
                    if (creep.memory.roomName) {
                        if (creep.room.name === creep.memory.roomName) {
                            if (creep.memory.working) {
                                if (!creep.memory.src) {
                                    creep.memory.src = creep.room.getSource().id;
                                }
                                const src = Game.getObjectById(creep.memory.src);
                                if (creep.harvest(src) === ERR_NOT_IN_RANGE) {
                                    creep.moveTo(src);
                                }
                                if (creep.store.getFreeCapacity() == 0) {
                                    creep.memory.working = false;
                                }
                            } else {
                                if (!creep.memory.target) {
                                    creep.memory.target = creep.room.find(FIND_CONSTRUCTION_SITES)[0].id;
                                }
                                const c = Game.getObjectById(creep.memory.target);
                                if (creep.build(c) === ERR_NOT_IN_RANGE) {
                                    creep.moveTo(c);
                                }
                                creep.workIfEmpty();
                            }
                        } else {
                            creep.moveTo(new RoomPosition(25, 25, creep.memory.roomName));
                        }
                    } else {
                        creep.say("Need roomName");
                    }
                    break;
            }
        } else {
            delete r.memory.out_workers[n];
        }
    }
    rooms()
    global.Goal.run();
    if (r.memory._heal) {
        /**@type {AnyCreep}*/
        const cr = Game.getObjectById(r.memory._heal)
        if (cr.hits === cr.hitsMax) {
            delete r.memory._heal
        } else {
            Tower.heal(r, cr)
        }
    } else if (r.memory.enemy) {
        for (const event of r.getEventLog()) {
            if (event.event === EVENT_OBJECT_DESTROYED) {
                if (event.type === STRUCTURE_WALL || event.type === STRUCTURE_RAMPART) {
                    r.controller.activateSafeMode()
                }
            }
        }
        tar = Game.getObjectById(r.memory.enemy);
        if (tar) {
            Tower.attack(r, tar)
        } else {
            delete r.memory.enemy
        }
    }
    if (Game.time % 30 == 0) {
        Tower.repair(r)
    }
    finalize();
}
function getTarget(pos) {
    const exts = r.find(FIND_MY_STRUCTURES).filter(e => (e.structureType === STRUCTURE_SPAWN
        || e.structureType === STRUCTURE_EXTENSION) && e.store.getFreeCapacity(RESOURCE_ENERGY))
    if (exts.length === 0) {
        return null
    } else {
        return pos.findClosestByRange(exts)
    }
}