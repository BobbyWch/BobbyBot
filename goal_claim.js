const goal_name="claim";
module.exports={
    /*
    context={
        roomName: string
        (flag: string)
    }
    */
    run(memory,context,id){
        if (!memory.creep) {
            const r=Game.rooms[context.roomName];
            if (r) {
                r.addBodyTask([MOVE,CLAIM],{role: "goal",goal_id: id},false);
            } else {
                console.log("未找到Room！");
                return global.END_GOAL;
            }
            memory.creep="spawning";
            return OK;
        }else if (memory.creep=="spawning") {
            return OK;
        }
        const creep=Game.getObjectById(memory.creep);
        if (!creep){
            console.log("Claimer died!"+Game.time)
        }
        if (creep.room.name===context.roomName) {
            let result=creep.claimController(creep.room.controller);
            if (result===ERR_NOT_IN_RANGE) {
                if (creep.room.controller) {
                    creep.moveTo(creep.room.controller);
                    return OK;
                } else {
                    console.log("该房间没有controller！");
                    creep.suicide();
                    return global.END_GOAL;
                }
            }else if (result==OK) {
                creep.suicide();
                return global.END_GOAL;
            }
        }else{
            if (context.flag){
                if (creep.forceMove(Game.flags[context.flag])){
                    context.flag=null;
                }
            }else {
                creep.moveTo(new RoomPosition(25, 25, context.roomName));
            }
            return OK;
        }
    },
    addCreep(memory,creep){
        delete creep.memory.id;
        memory.creep=creep.id;
    }
}