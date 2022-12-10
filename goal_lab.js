const goal_name="react";
module.exports= {
    /*
    context={
        roomName: string,
        src1: string,
        src2: string,
        count: number,
        refill: boolean
    }
    */
    /**
     *
     * @param memory {Memory}
     * @param context {{roomName: string,
     *     src1: ResourceConstant,
     *     src2: ResourceConstant,
     *     count: number,
     *     refill: boolean
     * }}
     * @param id {string}
     * @returns {OK|number|*}
     */
    run(memory, context, id) {
        if (memory.ready) {
            const room = Game.rooms[context.roomName];
            const roomMem = room.memory;
            /**@type {StructureLab}*/
            const lab1 = Game.getObjectById(roomMem.labs.main1), lab2 = Game.getObjectById(roomMem.labs.main2)
            //如果有1个lab空了
            if (!(lab1.mineralType &&lab2.mineralType)) {
                delete roomMem.reacting
                return global.END_GOAL;
            }
            /**@type {ScreepsReturnCode}*/
            let result
            /**@type {StructureLab}*/
            let lab
            for (const ID of roomMem.labs.others) {
                lab = Game.getObjectById(ID);
                if (!lab.cooldown) {
                    result = lab.runReaction(lab1, lab2);
                    if (result === ERR_FULL) {
                        lab.clear()
                    }
                }
            }
            return OK;
        } else {
            const room = Game.rooms[context.roomName];
            if (!room) {
                console.log("未找到房间");
                return global.END_GOAL;
            }
            const roomMem = room.memory;
            if (!roomMem.reacting) {
                /**@type {StructureLab}*/
                const lab1 = Game.getObjectById(roomMem.labs.main1), lab2 = Game.getObjectById(roomMem.labs.main2);
                /**@type {ScreepsReturnCode}*/
                const result = runLab(lab1, context.src1, context.count, room) + runLab(lab2, context.src2, context.count, room);
                if (result !== OK) {
                    return result;
                }
                roomMem.reacting = id;
                return OK;
            } else if (roomMem.reacting === id) {
                if (Game.getObjectById(roomMem.labs.main1).store.getUsedCapacity(context.src1) && Game.getObjectById(roomMem.labs.main2).store.getUsedCapacity(context.src2)) {
                    memory.ready = true;
                    room.clearLabs();
                    return OK;
                }
            }
        }
    },
    /**
     *
     * @param id {string}
     * @param room {Room}
     */
    stop(id, room) {
        room.memory.reacting = null;
        Goal.removeGoal(id);
    }
}
/**
 *
 * @param lab {StructureLab}
 * @param src {String}
 * @param count {number}
 * @param room {Room}
 * @returns {OK|number}
 **/
function runLab(lab,src,count,room){
    if (lab.mineralType===src) {
        const cap=lab.store.getUsedCapacity(src);
        if (cap<count) {
            if (room.findRes(src,count-cap)) {
                lab.getS(src,count-cap)
            }else{
                console.log("资源不足！");
                return global.END_GOAL;
            }
        }
    }else {
        if (lab.mineralType) {//如果有其他mineral
            //移除mineral
            lab.takeS(lab.mineralType,lab.store.getUsedCapacity(lab.mineralType))
        }
        //获取新的mineral
        if (room.findRes(src,count)) {
            lab.getS(src,count)
        } else {
            console.log("资源不足！");
            return global.END_GOAL;
        }
    }
    return OK;
}