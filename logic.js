module.exports= {
    /**
     * @param creep {Creep}
     */
    miner(creep) {
        const cm = creep.memory
        /**@type {Source|Mineral}*/
        const source = Game.getObjectById(cm.target)
        /**@type {StructureLink|StructureContainer}*/
        let target = Game.getObjectById(cm.store)
        cm.dontPullMe = false
        if (cm.ready){
            cm.dontPullMe=true
            if (creep.ticksToLive<=2){
                if (creep.store.getUsedCapacity()){
                    for (const key in creep.store){
                        creep.transfer(target,key)
                    }
                }else {
                    creep.suicide()
                }
                return;
            }
            //采集
            if (cm.state === "link") {
                if (creep.store.getFreeCapacity() < 35) {
                    if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target)
                    }
                    if (target.store[RESOURCE_ENERGY] >= 600) {
                        if (!target.cooldown) {
                            creep.harvest(source)
                            if (creep.room.upLink.store[RESOURCE_ENERGY] < 500) {
                                target.transferEnergy(creep.room.upLink)
                            } else {
                                target.transferEnergy(creep.room.centerLink)
                            }
                        }
                    } else {
                        creep.harvest(source)
                    }
                } else {
                    creep.harvest(source)
                }
            } else if (cm.state === "con") {
                if (target.store.getUsedCapacity() > 1100) {
                    if (target.store.getUsedCapacity() > 1900) {
                        creep.say("Full");
                    } else {
                        creep.harvest(source);
                    }
                    target.takeS(target.findMost())
                } else {
                    creep.harvest(source);
                }
            }
            if (source.mineralType) {
                //如果是mineral
                if (source.ticksToRegeneration) {
                    addTimer(Game.time + 49980, creep.memory)
                    delete Memory.creeps[creep.name]
                    creep.suicide()
                }
            } else {
                //是source
                if (creep.room.memory.prop.pc&&!(source.effects.length > 0 && source.effects[0].ticksRemaining >= 80)) {
                    creep.room.pc().addTask(PWR_REGEN_SOURCE, source.id)
                }
            }
            creep.autoRe(10)
        }else {
            if (!cm.target) {
                creep.say("Need target!");
                return
            }
            //寻找目标
            if (!target) {
                const sm = source.memory
                if(!sm) return
                if (creep.getActiveBodyparts(CARRY)) {
                    if (sm.link) {
                        target = Game.getObjectById(sm.link)
                    } else {
                        target = source.pos.findInRange(FIND_MY_STRUCTURES, 2).find(o => o.structureType === STRUCTURE_LINK)
                        if (target) {
                            sm.link = target.id
                        }
                    }
                }
                if (target) {
                    cm.store = sm.link
                    cm.state = "link"
                } else {
                    if (sm.con) {
                        target = Game.getObjectById(sm.con)
                    } else {
                        target = source.pos.findInRange(FIND_STRUCTURES, 1).find(o => o.structureType === STRUCTURE_CONTAINER)
                        if (target) {
                            sm.con = target.id
                        }
                    }
                    if (target) {
                        cm.store = sm.con
                        cm.state = "con"
                    } else {
                        delete sm.con
                        delete sm.link
                        creep.say("没有容器！")
                        return;
                    }
                }
            }
            //移动
            if (cm.state === "link") {
                if (creep.pos.inRangeTo(source,1)) {
                    cm.ready=true
                    return;
                }else {
                    creep.moveTo(source)
                    return;
                }
            } else if (cm.state === "con") {
                if (creep.forceMove(target)) {
                    cm.ready=true
                    return;
                }
            }
        }
    },
    /**
     * @param creep {Creep}
     */
    spawner(creep){
        if (creep.memory.working) {
            creep.withdrawFromStore();
        } else {
            let tar
            if (creep.room.energyAvailable < creep.room.energyCapacityAvailable) {
                if (creep.memory.target) {
                    tar = Game.getObjectById(creep.memory.target)
                } else {
                    const pos=creep.pos
                    let r,Mr
                    for (const s of creep.room.find(FIND_MY_STRUCTURES)){
                        if ((s.structureType==STRUCTURE_SPAWN||s.structureType==STRUCTURE_EXTENSION)
                        &&s.store.getFreeCapacity(RESOURCE_ENERGY)){
                            if (tar){
                                r=pos.getRangeTo(s)
                                if (r<Mr){
                                    tar=s
                                    Mr=r
                                    if (r==1){
                                        break
                                    }
                                }
                            }else {
                                tar=s
                                Mr=pos.getRangeTo(s)
                            }
                        }
                    }
                    creep.memory.target = tar.id
                }
                if (tar) {
                    if (creep.transfer(tar, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(tar);
                    } else {
                        delete creep.memory.target
                    }
                    creep.workIfEmpty();
                }
            }
        }
    },
    /**
     * @param creep {Creep}
     */
    upgrade(creep){
        if (creep.memory.working) {
            creep.withdrawFromStore()
            delete creep.memory.dontPullMe
        } else {
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller)
                delete creep.memory.dontPullMe
            } else {
                creep.memory.dontPullMe = true
                creep.workIfEmpty()
            }
        }
    },
    /**
     * @param creep {Creep}
     */
    repairer(creep){
        const memory=creep.memory
        if (memory.working) {
            if (memory.endTime) {
                if (Game.time > memory.endTime) {
                    delete memory._repair
                    memory.endTime = 0
                }
            }
            creep.withdrawFromStore();
        } else {
            let tar
            if (memory._repair) {
                tar = Game.getObjectById(memory._repair);
            } else {
                for (const i of creep.room.find(FIND_STRUCTURES)) {
                    if (i.structureType == STRUCTURE_WALL || i.structureType == STRUCTURE_RAMPART) {
                        if (tar) {
                            if (i.hits < tar.hits) {
                                tar = i
                            }
                        } else {
                            tar = i
                        }
                    }
                }
                if(!tar){
                    return
                }
                memory.endTime = Game.time + 500
                memory._repair = tar.id
            }
            if (!tar || tar.hits == tar.hitsMax) {
                delete memory._repair
                delete memory.endTime
                return
            }
            creep.repair(tar)
            if (!creep.pos.inRangeTo(tar, 2)) {
                creep.moveTo(tar)
            }
            creep.workIfEmpty()
        }
    },
    /**
     * @param creep {Creep}
     */
    builder(creep){
        if (creep.memory.working) {
            creep.withdrawFromStore();
        } else {
            let tar
            if (creep.room.memory._build){
                tar=Game.getObjectById(creep.room.memory._build.id)
                if (!tar){
                    creep.room.callAfterBuilt()
                    tar=creep.room.flushSite()
                }
            }else {
                tar=creep.room.flushSite()
            }
            if (tar){
                creep.build(tar)
                if (!creep.pos.inRangeTo(tar, 2)) {
                    creep.moveTo(tar)
                }
                creep.workIfEmpty()
            }else{
                creep.memory.role="r$r"
            }
        }
    },
    /**
     * @param creep {Creep}
     */
    manager(creep){
        if (creep.memory.taskId){
            creep.centerCarry()
        }else {
            if (creep.memory.working) {
                if (creep.room.centerLink.store[RESOURCE_ENERGY]) {
                    if (creep.room.upLink.store[RESOURCE_ENERGY]<500){
                        creep.room.centerLink.transferEnergy(creep.room.upLink)
                        return
                    }
                    if (creep.withdraw(creep.room.centerLink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.centerLink)
                    } else {
                        creep.memory.working = false;
                    }
                }else {
                    if (creep.room.upLink.store[RESOURCE_ENERGY]<350){
                        creep.room.centerTask(creep.room.storage,creep.room.centerLink,RESOURCE_ENERGY,800)
                    }
                    creep.centerCarry()
                }
            } else {
                const result = creep.transfer(creep.room.storage, RESOURCE_ENERGY)
                if (result === ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.storage)
                } else {
                    creep.memory.working = true
                }
            }
        }
    },
    /**
     * @param creep {Creep}
     */
    upgrader(creep) {
        if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller)
            return
        }
        if (creep.store[RESOURCE_ENERGY] < 50) {
            if (creep.withdraw(creep.room.upLink, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.upLink)
            }
        }
    }
}
function addTimer(time,mem){
    Memory.timer[time]=mem
}