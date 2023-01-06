const c={
    carryTaskType:{
        TAKE:0,
        GET:1
    }
}
global.util= {
    /**
     *  阉割版isEqualTo，提速
     * @param {RoomPosition} pos1
     * @param {RoomPosition} pos2
     */
    isEqual: (pos1, pos2) => {
        return pos1.x == pos2.x && pos1.y == pos2.y && pos1.roomName == pos2.roomName;
    },
    /**
     *  阉割版isNear，无视房间
     * @param {RoomPosition} pos1
     * @param {RoomPosition} pos2
     */
    fastNear: (pos1, pos2) => {
        return -1 <= pos1.x - pos2.x && pos1.x - pos2.x <= 1 && -1 <= pos1.y - pos2.y && pos1.y - pos2.y <= 1
    },
    /**
     *  阉割版inRangeTo，无视房间
     * @param {RoomPosition} pos1
     * @param {RoomPosition} pos2
     * @param {number} range
     */
    fastIn: (pos1, pos2, range) => {
        return -range <= pos1.x - pos2.x && pos1.x - pos2.x <= range && -range <= pos1.y - pos2.y && pos1.y - pos2.y <= range;
    },
    getId: (pre) => `${pre}${Game.time % 1000}_${0 | Math.random() * 10000}`,
    nextRand: (limit) => 0 | Math.random() * limit,
    min: (a, b) => a < b ? a : b,
    /**
     * 将指定位置序列化为字符串
     * 形如: 12/32/E1N2
     *
     * @param pos {RoomPosition} 要进行压缩的位置
     * @return {string}
     */
    serial: (pos) => `${pos.x}/${pos.y}/${pos.roomName}`,
    /**
     * 将位置序列化字符串转换为位置
     * 位置序列化字符串形如: 12/32/E1N2
     *
     * @param posStr {string} 要进行转换的字符串
     * @return {RoomPosition}
     */
    unSerial: (posStr) => {
        const infos = posStr.split('/')
        return infos.length == 3 ? new RoomPosition(Number(infos[0]), Number(infos[1]), infos[2]) : undefined
    }
}
global.Constant=c
require("./logger")
require("./SuperMove")
require("./tower")
require("./group")
require("./channel")
global.roles = {}
global.config = require("./config")
require("./missions")
require("./protos")
require("./creep_proto")
require("./room_proto")
global.api = {
    setProper(name){
        const prop=Game.rooms.W53S7.memory.prop
        if (prop[name]){
            delete prop[name]
        }else {
            prop[name]=1
        }
    },
    setAim(res){
        const r=Game.rooms.W53S7.factory
        r.memory.aim=res
    },
    check(){
        for (const r of Object.values(Game.rooms)){
            if (r.controller&&r.controller.my){
                let cs=r.find(FIND_MY_CREEPS)
                if (!cs.length){
                    r.addBodyTask([CARRY,CARRY,CARRY,CARRY,MOVE,MOVE],{role:config.spawner},true)
                }
                cs=cs.filter(o=>o.memory.role==config.harvester)
                for (const src of r.find(FIND_SOURCES)){
                    let has=false
                    for (const c of cs){
                        if (c.memory.target==src.id){
                            has=true
                            break
                        }
                    }
                    if (!has){
                        r.addTask({role:config.harvester,target:src.id})
                    }
                }
            }
        }
    },
    freeLabs(roomName){
        const r=Game.rooms[roomName]
        const memory=r.memory
        for (const res in memory.boost){
            memory.labs.others.push(memory.boost[res].lab)
        }
        memory.boost={}
    }
}
global.myroom=function (){
    let s=""
    for (const r of Object.values(Game.rooms)){
        if (r.controller&&r.controller.my){
            s+=Logger.roomLink(r.name)
        }
    }
    return s
}