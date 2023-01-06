module.exports= {
    /**
     * @param creep {Creep}
     */
    harvester(creep) {
        const cm = creep.memory
        /**@type {Source|Mineral}*/
        const source = Game.getObjectById(cm.target)
        /**@type {StructureLink|StructureContainer}*/
        let target = Game.getObjectById(cm.store)
        if (cm.ready) {
            cm.dontPullMe = true
            if (creep.ticksToLive <= 2) {
                if (creep.store.getUsedCapacity()) {
                    creep.transferAny(target)
                } else {
                    creep.suicide()
                }
                return;
            }
            //采集
            if (cm.state == "link") {
                if (creep.store.getFreeCapacity() < 35) {
                    if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target)
                    }
                    if (target.store[RESOURCE_ENERGY] >= 650) {
                        if (!target.cooldown) {
                            creep.harvest(source)
                            if (creep.room.memory.wantUpg) {
                                target.transferEnergy(creep.room.upLink)
                                delete creep.room.memory.wantUpg
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
            } else if (cm.state == "con") {
                if (source.energy) {
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
                } else if (target.hits < 240000 && creep.store[RESOURCE_ENERGY]) {
                    creep.repair(target)
                }
            }
            //是source
            if (creep.room.memory.prop.regen && !(source.effects && source.effects.length && source.effects[0].ticksRemaining >= 80)) {
                creep.room.pc().addTask(PWR_REGEN_SOURCE, source.id)
            }
            creep.autoRe(10)
        } else {
            if (!cm.target) {
                creep.say("Need target!");
                return
            }
            delete cm.dontPullMe
            //寻找目标
            if (!target) {
                const sm = source.memory
                if (sm.link) {
                    target = Game.getObjectById(sm.link)
                } else {
                    target = source.pos.findInRange(FIND_MY_STRUCTURES, 2).find(o => o.structureType == STRUCTURE_LINK)
                    if (target) {
                        sm.link = target.id
                        delete sm.con
                    }
                }
                if (target) {
                    cm.store = sm.link
                    cm.state = "link"
                } else {
                    if (sm.con) {
                        target = Game.getObjectById(sm.con)
                    } else {
                        target = source.pos.findInRange(FIND_STRUCTURES, 1).find(o => o.structureType == STRUCTURE_CONTAINER)
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
                    }
                }
            }
            //移动
            if (cm.state == "link") {
                if (creep.pos.inRangeTo(source, 1)) {
                    cm.ready = true
                } else {
                    creep.moveTo(source)
                }
            } else if (cm.state == "con") {
                if (creep.forceMove(target)) {
                    cm.ready = true
                }
            }
        }
    },
    /**
     * @param creep {Creep}
     */
    miner(creep) {
        const cm = creep.memory
        /**@type {Mineral}*/
        let source = Game.getObjectById(cm.target)
        /**@type {StructureContainer}*/
        let target = Game.getObjectById(cm.store)
        if (cm.ready) {
            cm.dontPullMe = true
            let result
            //采集
            if (target.store.getUsedCapacity() > 1100) {
                if (target.store.getUsedCapacity() > 1950) {
                    creep.say("Full")
                    return;
                } else {
                    result=creep.harvest(source)
                }
                target.takeS(target.findMost())
            } else {
                result=creep.harvest(source)
            }
            if (result==ERR_NOT_ENOUGH_RESOURCES){
                CreepApi.remove(config.miner,creep.room.name)
                creep.suicide()
            }
        } else {
            if (!cm.target) {
                source=creep.room.find(FIND_MINERALS)[0]
                cm.target = source.id
            }
            delete cm.dontPullMe
            //寻找目标
            if (!target) {
                const sm = source.memory
                if (!sm) return
                if (sm.con) {
                    target = Game.getObjectById(sm.con)
                } else {
                    target = source.pos.findInRange(FIND_STRUCTURES, 1).find(o => o.structureType == STRUCTURE_CONTAINER)
                    if (target) {
                        sm.con = target.id
                    }
                }
                if (target) {
                    cm.store = sm.con
                } else {
                    delete sm.con
                    creep.say("没有容器！")
                }
            }
            //移动
            if (creep.forceMove(target)) {
                cm.ready = true
            }
        }
    },
    /**
     * @param creep {Creep}
     */
    spawner(creep) {
        if (creep.memory.working) {
            creep.withdrawFromStore()
        } else {
            let tar
            if (creep.room.energyAvailable < creep.room.energyCapacityAvailable) {
                if (creep.memory.target) {
                    tar = Game.structures[creep.memory.target]
                } else {
                    const pos = creep.pos
                    let r, Mr
                    for (const s of creep.room.find(FIND_MY_STRUCTURES)) {
                        if ((s.structureType == STRUCTURE_SPAWN || s.structureType == STRUCTURE_EXTENSION)
                            && s.store.getFreeCapacity(RESOURCE_ENERGY)) {
                            if (tar) {
                                r = pos.getRangeTo(s)
                                if (r < Mr) {
                                    tar = s
                                    Mr = r
                                    if (r == 1) {
                                        break
                                    }
                                }
                            } else {
                                tar = s
                                Mr = pos.getRangeTo(s)
                            }
                        }
                    }
                    if (!tar) return
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
    repairer(creep) {
        const memory = creep.memory
        if (memory.working) {
            if (memory.endTime) {
                if (Game.time > memory.endTime) {
                    delete memory._repair
                    memory.endTime = 0
                }
            }
            creep.withdrawFromStore()
            delete creep.memory.ready
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
                if (!tar) {
                    return
                }
                memory.endTime = Game.time + 350
                memory._repair = tar.id
            }
            if (!tar || tar.hits == tar.hitsMax) {
                delete memory._repair
                delete memory.endTime
                return
            }
            if (memory.ready){
                if (creep.repair(tar)==ERR_NOT_IN_RANGE){
                    delete memory.ready
                    creep.moveTo(tar)
                }
            }else {
                const range=creep.pos.getRangeTo(tar)
                if (range<=3){
                    creep.repair(tar)
                }
                if (range>2){
                    creep.moveTo(tar)
                }else {
                    memory.ready=true
                }
            }
            creep.workIfEmpty()
        }
    },
    /**
     * @param creep {Creep}
     */
    builder(creep) {
        const memory=creep.memory
        if (memory.working) {
            if (creep.room.storage){
                creep.withdrawFromStore()
            }else {
                getEnergy(creep)
            }
        } else {
            let tar
            if (memory.state == "repair") {
                tar = Game.getObjectById(memory.target)
            } else {
                if (creep.room.memory._build) {
                    tar = Game.getObjectById(creep.room.memory._build.id)
                    if (!tar) {
                        const result = creep.room.callAfterBuilt()
                        if (result) {
                            memory.state = "repair"
                            memory.target = result.id
                            creep.room.flushSite()
                        } else {
                            tar = creep.room.flushSite()
                        }
                    }
                } else {
                    tar = creep.room.flushSite()
                }
            }

            if (tar) {
                if (memory.state == "repair") {
                    creep.repair(tar)
                    if (tar.hits > 85000) {
                        delete memory.state
                        delete memory.target
                    }
                } else {
                    creep.build(tar)
                }
                if (!creep.pos.inRangeTo(tar, 2)) {
                    creep.moveTo(tar)
                }
                creep.workIfEmpty()
            }
        }
    },
    /**
     * @param creep {Creep}
     */
    manager(creep) {
        creep.greet("sherlock")
        if (creep.memory.taskId) {
            creep.centerCarry()
        } else {
            if (creep.memory.working) {
                if (creep.room.centerLink.store[RESOURCE_ENERGY]>650) {
                    if (creep.room.memory.wantUpg) {
                        creep.room.centerLink.transferEnergy(creep.room.upLink)
                        delete creep.room.memory.wantUpg
                        return
                    }
                    if (creep.withdraw(creep.room.centerLink, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.centerLink)
                    } else {
                        delete creep.memory.working
                    }
                } else {
                    if (creep.room.memory.wantUpg) {
                        creep.room.centerTask(creep.room.storage, creep.room.centerLink, RESOURCE_ENERGY)
                    }
                    creep.centerCarry()
                }
            } else {
                const result = creep.transfer(creep.room.storage, RESOURCE_ENERGY)
                if (result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.storage)
                } else {
                    creep.memory.working = true
                }
            }
        }
    },
    /**@param creep {Creep}*/
    upgrader(creep) {
        const info = creep.room.memory.upgInfo
        if (info) {
            if (creep.store[RESOURCE_ENERGY] < 40) {
                let store
                if (info.link) {
                    store = Game.getObjectById(info.link)
                    if (Game.time%3==0){
                        if (store[RESOURCE_ENERGY]<160){
                            creep.room.memory.wantUpg=true
                        }
                    }

                } else if (info.con) {
                    store = Game.getObjectById(info.con)
                    if (!store){
                        store=creep.room.storage
                    }
                    if (store.store[RESOURCE_ENERGY] < 1400) {
                        creep.room.addCarryTask(store,1,RESOURCE_ENERGY,null,"control")
                    }
                } else {
                    store = creep.room.storage
                }
                if (creep.pos.isNearTo(store)) {
                    if (creep.withdraw(store, RESOURCE_ENERGY) == OK) {
                        delete creep.memory.working
                    }
                } else {
                    creep.moveTo(store)
                    return;
                }
            }
            if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller)
            } else {
                creep.memory.dontPullMe=true
                if (creep.room.controller.level != info.level) {
                    creep.room.onUpgrade(creep.room.controller.level)
                }
            }
        }else if (creep.room.controller.level==8){
            if (creep.memory.working){
                if (creep.withdraw(creep.room.storage,RESOURCE_ENERGY)==ERR_NOT_IN_RANGE){
                    creep.moveTo(creep.room.storage)
                }
                if (!creep.store.getFreeCapacity()){
                    delete creep.memory.working
                }
            }else {
                if (creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller)
                }
                creep.workIfEmpty()
            }
        }
    },
    /**@param creep {Creep}*/
    remoteTransfer(creep) {
        if (!creep.memory.target) {
            creep.say("需要type target")
            return;
        }
        if (creep.memory.state) {
            const r = Game.rooms[creep.memory.belong]
            if (creep.pos.isNearTo(r.storage)) {
                creep.transferAny(r.storage)
            } else {
                creep.moveTo(r.storage)
            }
            if (!creep.store.getUsedCapacity()) {
                if (creep.ticksToLive > 750) {
                    delete creep.memory.state
                } else {
                    creep.suicide()
                }
            }
        } else {
            if (creep.room.name != creep.memory.target) {
                creep.moveTo(new RoomPosition(25, 25, creep.memory.target))
                return;
            }
            if (!creep.memory.type) {
                for (const s of creep.room.find(FIND_STRUCTURES)) {
                    if (s.store) {
                        for (const key in s.store) {
                            if (key != RESOURCE_ENERGY) {
                                creep.memory.type = key
                                creep.memory.store = s.id
                            }
                        }
                    }
                }
            }
            let target
            target = Game.getObjectById(creep.memory.store)
            if (creep.withdraw(target, creep.memory.type) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target)
            } else {
                if (!creep.store.getFreeCapacity()) {
                    creep.memory.state = 1
                } else {
                    delete creep.memory.type
                    delete creep.memory.store
                }
            }
        }
    },
    /**@param creep {Creep}*/
    claimer(creep) {
        if (!creep.memory.target) {
            creep.say("需要target")
            return
        }
        if (creep.room.name != creep.memory.target) {
            creep.moveTo(new RoomPosition(25, 25, creep.memory.target))
            return;
        }
        if (creep.room.controller.my) {
            const pattern = `${creep.room.name}Spawn`
            for (const f in Game.flags) {
                if (f == pattern) {
                    Game.flags[f].pos.createConstructionSite(STRUCTURE_SPAWN)
                    Game.flags[f].remove()
                }
            }
            Game.rooms[creep.memory.belong].addTask({role: config.starter, target: creep.memory.target})
            Game.rooms[creep.memory.belong].addTask({role: config.starter, target: creep.memory.target})
            creep.suicide()
            return;
        }
        if (creep.room.controller.reservation) {
            if (creep.attackController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller)
            }
        } else {
            const result = creep.claimController(creep.room.controller)
            if (result == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller)
            }
        }
    },
    /**@param creep {Creep}*/
    starter(creep) {
        if (!creep.memory.target) {
            creep.say("需要target")
            return
        }
        if (creep.room.name != creep.memory.target) {
            creep.memory.working = true
            creep.moveTo(new RoomPosition(25, 25, creep.memory.target))
            return;
        }
        if (!creep.memory.site) {
            creep.memory.site=creep.room.find(FIND_CONSTRUCTION_SITES).find(o=>o.structureType==STRUCTURE_SPAWN).id
        }
        if (!creep.memory.src) {
            creep.memory.src = Game.getObjectById(creep.memory.site).pos.findClosestByPath(FIND_SOURCES).id
        }
        if (creep.memory.working) {
            const source = Game.getObjectById(creep.memory.src)
            if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
                creep.moveTo(source)
            }
            if (!creep.store.getFreeCapacity()) {
                delete creep.memory.working
            }
        } else {
            const site = Game.getObjectById(creep.memory.site)
            if (!site) {
                creep.memory.role = config.upgrader
            }
            if (creep.build(site) == ERR_NOT_IN_RANGE) {
                creep.moveTo(site)
            }
            creep.workIfEmpty()
        }
    },
    /**@param creep {Creep}*/
    worker(creep) {
        delete creep.memory.dontPullMe
        if (creep.memory.working) {
            getEnergy(creep)
            if (!creep.store.getFreeCapacity()) {
                delete creep.memory.working
            }
        } else {
            switch (creep.memory.work) {
                case "fill":
                    creep.fillExt()
                    break
                default:
                    const sites = creep.room.find(FIND_CONSTRUCTION_SITES)
                    if (sites.length) {
                        if (creep.build(sites[0]) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(sites[0], {ignoreCreeps: false})
                        }
                    } else {
                        if (!creep.room.ups) {
                            creep.room.ups = creep.room.controller.pos.findInRange(FIND_MY_CREEPS, 3)
                        }
                        if (creep.pos.getRangeTo(creep.room.controller) > 3) {
                            if (creep.room.ups.length < 5) {
                                creep.moveTo(creep.room.controller, {ignoreCreeps: false})
                            } else {
                                const c = creep.room.ups.find(o => o.store.getFreeCapacity() > 10)
                                if (c) {
                                    if (creep.transfer(c, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                                        creep.moveTo(c, {ignoreCreeps: false})
                                    }
                                }
                            }
                        } else {
                            creep.upgradeController(creep.room.controller)
                        }
                    }
                    creep.workIfEmpty()
            }
        }
    },
    /**@param creep {Creep}*/
    remote(creep){
        if (creep.room.name==creep.memory.target){
            creep.memory.role=creep.memory.newRole
            delete creep.memory.newRole
        }else {
            creep.moveTo(new RoomPosition(25,25,creep.memory.target))
        }
    },
    /**@param creep {Creep}*/
    attacker(creep){
        creep.moveTo(creep.room.find(FIND_HOSTILE_CREEPS)[0])
        creep.attack(creep.room.find(FIND_HOSTILE_CREEPS)[0])
    },
}
/**@param creep {Creep}*/
function getEnergy(creep){
    if (!creep.memory.src){
        creep.memory.src=creep.room.getSource().id
    }
    const src=Game.getObjectById(creep.memory.src)
    if (creep.harvest(src)==ERR_NOT_IN_RANGE){
        creep.moveTo(src)
    }else{
        creep.memory.dontPullMe=true
    }
}