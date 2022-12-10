const upgrader = "r$u";
const builder = "r$b";
const repairer = "r$r";
const miner = "r$m";
const carrier = "r$c";
const spawner = "r$s";
const cleaner = "r$cl";
const outMiner = "r$ot";
const claimer= "r$cm";
const outBuilder="r$ob";
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
    miner: miner,
    carrier: carrier,
    spawner: spawner,
    cleaner: cleaner,
    outMiner: outMiner,
    claimer: claimer,
    outBuilder: outBuilder,
    init: function (r) {
        r[spawner] = {
            parts: calc([[CARRY,16],[MOVE,8]]),
            min: 1
        }
        r[carrier] = {
            parts: calc([[CARRY,16],[MOVE,8]]),
            min: 1
        }
        r[miner] = {
            parts: calc([[WORK,15],[MOVE,4],[CARRY,3]]),
            min: 0
        }
        r[repairer] = {
            parts: calc([[CARRY,14],[MOVE,12],[WORK,10]]),
            min: 0,
            boost: false
        }
        r[upgrader] = {
            parts: calc([[CARRY,3],[MOVE,15],[WORK,30]]),
            min: 0,
            boost: false
        }
        r[cleaner] = {
            parts: calc([[CARRY,30],[MOVE,4]]),
            min: 1
        }
        r[builder] = {
            parts: calc([[CARRY,21],[MOVE,13],[WORK,5]]),
            min: 0,
            boost: false
        }
        r[outMiner] = {
            parts: calc([[WORK,10],[CARRY,22],[MOVE,16]]),
            min: 0,
            out: true
        }
        r[claimer]={
            parts: [CLAIM,MOVE],
            min: 0,
            out: true
        }
        r[outBuilder]={
            parts: [CARRY, CARRY, CARRY,CARRY, CARRY, CARRY, MOVE, MOVE, MOVE,MOVE, MOVE, MOVE,MOVE, MOVE, MOVE,MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK],
            min: 0,
            out: true
        }
        for (const i in r) {
            r[i].cost = global.getCost(r[i].parts);
        }
    }
}