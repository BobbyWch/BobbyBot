const upgrader = "r$u";
const builder = "r$b";
const repairer = "r$r";
const harvester = "r$m";
const carrier = "r$c";
const spawner = "r$s";
const cleaner = "r$cl";
const outMiner = "r$ot";
const claimer= "r$cm";
const transfer="r$rt"
const starter="r$sa"
const worker="r$w"
const remote="r$rm"
const attacker="r$at"
const miner="r$h"
global.getCost=function(parts) {
    let s = 0;
    for (let ind = 0; ind < parts.length; ind++) {
        s += BODYPART_COST[parts[ind]];
    }
    return s;
}
module.exports = {
    upgrader: upgrader,
    builder: builder,
    repairer: repairer,
    harvester: harvester,
    carrier: carrier,
    spawner: spawner,
    cleaner: cleaner,
    outMiner: outMiner,
    claimer: claimer,
    transfer:transfer,
    starter:starter,
    worker:worker,
    remote:remote,
    attacker:attacker,
    miner: miner
}
roles[spawner] = {
    parts: calc([[CARRY,16],[MOVE,8]])
}
roles[carrier] = {
    parts: calc([[CARRY,16],[MOVE,8]])
}
roles[harvester] = {
    parts: calc([[WORK,15],[MOVE,4],[CARRY,3]])
}
roles[repairer] = {
    parts: calc([[CARRY,20],[MOVE,15],[WORK,10]])
}
roles[upgrader] = {
    parts: calc([[CARRY,3],[MOVE,15],[WORK,30]])
}
roles[cleaner] = {
    parts: calc([[CARRY,30],[MOVE,4]])
}
roles[builder] = {
    parts: calc([[CARRY,21],[MOVE,13],[WORK,5]])
}
roles[outMiner] = {
    parts: calc([[WORK,10],[CARRY,22],[MOVE,16]])
}
roles[claimer]={
    parts: [CLAIM,MOVE]
}
roles[transfer]={
    parts:calc([[CARRY,25],[MOVE,25]])
}
roles[starter]={
    parts:calc([[WORK,5],[CARRY,20],[MOVE,25]])
}
roles[worker]={
    parts:[WORK,WORK,MOVE,CARRY,CARRY,MOVE]
}
roles[remote]={
    parts:calc([[WORK,10],[CARRY,10],[MOVE,10]])
}
roles[attacker]={
    parts:calc([[ATTACK,2],[MOVE,2]])
}
roles[miner]={
    parts:calc([[WORK,16],[MOVE,4]])
}
for (const i in roles) {
    roles[i].cost = global.getCost(roles[i].parts)
}
if (!Memory.creepConfigs) Memory.creepConfigs = {}
/**
 * creep 发布 api
 * 所有 creep 的增删改查都由该模块封装
 */
global.CreepApi = {
    /**
     * 新增 creep
     * 该方法会自动给对应的房间推送 creep 孵化任务
     *
     * @param role creep 的角色名称
     * @param roomName 要孵化到的房间
     * @returns ERR_NOT_FOUND 未找到对应的 creepWork
     * @returns ERR_NOT_OWNER 孵化房间不是自己的或者无法进行孵化
     */
    add(role, roomName) {
        if (!roles[role]) return ERR_NOT_FOUND
        if (!Memory.creepConfigs[roomName]){
            Memory.creepConfigs[roomName]={}
        }
        let config=Memory.creepConfigs[roomName]
        if (config[role]){
            config[role]++
        }else {
            config[role]=1
        }
        return OK
    },
    numOf(role,roomName) {
        return Memory.creepConfigs[roomName][role]
    },
    remove(role,roomName) {
        const config=Memory.creepConfigs[roomName]
        if (config[role]){
            config[role]--
        }else {
            return ERR_INVALID_ARGS
        }
        if (!config[role]){
            delete config[role]
        }
        return OK
    }
}