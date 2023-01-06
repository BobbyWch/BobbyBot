global.missionMap={
    /**
     * @param room {Room}
     * @param model {MissionModel}
     */
    disGroup(room,model){
        /**
         * @type {{
         *     target:string,
         *     groupId:string,
         *     dismantle:Id<Structure>,
         *     posFlag:string
         * }}
         */
        const data=model.data
        if (data.groupId){
            /**@type {Group}*/
            const group=Group.getGroup(data.groupId)
            if (group.isAlive()){
                if (group.boosted()){
                    group.attacker().greet("frog")
                    group.healer().greet("neo")
                    const room=group.getRoom()
                    if (room.name!=model.parent){
                        group.heal()
                    }
                    if (room.name==data.target){
                        if (!data.dismantle){
                            /**@type {Flag[]}*/
                            const flags=room.find(FIND_FLAGS)
                            if (flags.length){
                                for (const f of flags){
                                    const tgs=f.pos.lookFor(LOOK_STRUCTURES)
                                    if (tgs.length){
                                        if (tgs.length==1&&tgs[0].structureType==STRUCTURE_ROAD){
                                            f.remove()
                                        }else {
                                            data.dismantle=tgs.find(o=>o.structureType!=STRUCTURE_ROAD).id
                                            break
                                        }
                                    }else {
                                        f.remove()
                                    }
                                }
                            }
                        }
                        group.autoMass()
                        if (data.dismantle){
                            const target=Game.getObjectById(data.dismantle)
                            if (target){
                                if (group.dismantle(target)!=OK){
                                    group.moveTo(target)
                                }
                            }else {
                                delete data.dismantle
                            }
                        }
                    }else {
                        if (!data.posFlag||!Game.flags[data.posFlag]) {
                            for(const f in Game.flags){
                                if(Game.flags[f].pos.roomName==data.target){
                                    data.posFlag=f
                                    break
                                }
                            }
                        }
                        group.moveTo(Game.flags[data.posFlag])
                    }
                }else {
                    console.log("Boosting Group")
                }
            }else {
                if (Game.time-model.startTime>40){
                    console.log("Group失去活性")
                    group.suicide()
                    return -1
                }
            }
        }else {
            data.groupId=Group.init(Game.rooms[model.parent])
            return OK
        }
        return OK
    }
}
global.Mission={
    newDismantle:(fromRoomName,toRoomName,groupId)=>{
        Game.rooms[fromRoomName].addMission("disGroup",{target:toRoomName,groupId:groupId})
    }
}