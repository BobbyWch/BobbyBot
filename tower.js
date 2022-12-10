const buff = {}

global.Tower = {
    /**
     * 
     * @param {Room} room 
     * @param {AnyCreep} creep 
     */
    attack(room, creep) {
        if (buff[room.name] && Game.time % 5000) {
            for (const id of buff[room.name]) {
                Game.getObjectById(id).attack(creep)
            }
        } else {
            const towers = room.find(FIND_MY_STRUCTURES).filter(o => o.structureType == STRUCTURE_TOWER)
            buff[room.name] = []
            for (const t of towers) {
                buff[room.name].push(t.id)
                t.attack(creep)
            }
        }
    },
    heal(room, creep) {
        if (buff[room.name] && Game.time % 5000) {
            for (const id of buff[room.name]) {
                Game.getObjectById(id).heal(creep)
            }
        } else {
            const towers = room.find(FIND_MY_STRUCTURES).filter(o => o.structureType == STRUCTURE_TOWER)
            buff[room.name] = []
            for (const t of towers) {
                buff[room.name].push(t.id)
                t.heal(creep)
            }
        }
    },
    repair(room) {
        /**
         * @type {StructureTower[]}
         */
        let towers = []
        if (buff[room.name] && Game.time % 5000) {
            for (const id of buff[room.name]) {
                towers.push(Game.getObjectById(id))
            }
        } else {
            towers = room.find(FIND_MY_STRUCTURES).filter(o => o.structureType == STRUCTURE_TOWER)
            buff[room.name] = []
            for (const t of towers) {
                buff[room.name].push(t.id)
            }
        }
        let i = 0
        for (const struct of room.find(FIND_STRUCTURES)) {
            if (struct.structureType == STRUCTURE_ROAD) {
                if(struct.hits<struct.hitsMax*0.8){
                    towers[i++].repair(struct)
                    if (i >= towers.length) {
                        break
                    }
                }
            }else if(struct.structureType==STRUCTURE_CONTAINER){
                if(struct.hits<180000){
                    for(;i<towers.length;i++){
                        towers[i].repair(struct)
                    }
                    return
                }
            }
        }
        for(const t of towers){
            if(!t.store[RESOURCE_ENERGY]||t.store[RESOURCE_ENERGY]<400){
                t.getS(RESOURCE_ENERGY)
                break
            }
        }
    }
}