const groupMap={}
module.exports={
    /**
     *
     * @param memory {{
     *     groupId: string
     * }}
     * @param context {{
     *     from: string,
     *     to: string
     * }}
     * @param id
     */
    run(memory,context,id){
        if (memory.groupId){
            /**
             * @type {Group}
             */
            let group=groupMap[id]
            if (!group){
                group=new Group(memory.groupId)
                groupMap[id]=group
            }
            if (group.isAlive()){
                if (group.boost()){
                    const room=group.getRoom()
                    if (room.name!=context.from){
                        group.heal()
                    }
                    if (room.name==context.to){
                        if (!memory.target||Game.time%7==0){
                            /**@type {Flag[]}*/
                            const flags=room.find(FIND_FLAGS)
                            if (flags.length){
                                for (const f of flags){
                                    const tgs=f.pos.lookFor(LOOK_STRUCTURES)
                                    if (tgs.length){
                                        if (tgs.length===1&&tgs[0].structureType===STRUCTURE_ROAD){
                                            f.remove()
                                        }else {
                                            memory.target=tgs.find(o=>o.structureType!=STRUCTURE_ROAD).id
                                            break
                                        }
                                    }else {
                                        f.remove()
                                    }
                                }
                            }
                        }
                        if (memory.target){
                            const target=Game.getObjectById(memory.target)
                            if (target){
                                if (group.dismantle(target)!=OK){
                                    group.moveTo(target)
                                    group.autoMass()
                                }
                            }else {
                                group.autoMass()
                                delete memory.target
                            }
                        }else{
                            group.autoMass()
                        }
                        return OK
                    }else {
                        if (!memory.posFlag||!Game.flags[memory.posFlag]) {
                            for(const f in Game.flags){
                                if(Game.flags[f].pos.roomName==context.to){
                                    memory.posFlag=f
                                    break
                                }
                            }
                        }
                        group.moveTo(Game.flags[memory.posFlag])
                    }
                    return OK
                }else {
                    console.log("Boosting Group")
                }
            }else {
                console.log("Group失去活性")
                delete groupMap[id]
                group.suicide()
                return END_GOAL
            }
        }else {
            if (!Game.rooms[context.from]){
                console.log("无效room")
                return END_GOAL
            }
            memory.groupId=Group.init(Game.rooms[context.from])
            return OK
        }
    }
}