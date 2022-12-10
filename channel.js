const data={}
const ENERGY=1
const MINERAL=2
const MID=6
const MAX=7
/**
 * @type {{[{number}]:{ResourceInfo}}}
 */
const resInfo={}
resInfo[ENERGY]={
    rich:500000,
    poor:100000
}
resInfo[MINERAL]={
    rich:40000,
    poor:20000
}
/**
 * @param room {Room}
 */
function regRoom(room){
    const info={}
    const store=room.getStore()
    let state
    for (const type in store){
        state=getState(type,store[type])
        if (state){
            info[type]=state
        }
    }
    data[room.name]=info
}
global.Channel={
    init:()=>{
        let r
        for (const rn in Game.rooms){
            r=Game.rooms[rn]
            if (r.terminal&&r.terminal.my){
                regRoom(r)
            }
        }
    },
    reg:regRoom,
    show:()=>{
        console.log(JSON.stringify(data))
    },
    get:(room,type,num)=>{
        const src=getRoom(type)
        src.terminal.addSend(room.name,type,num)
    }
}

/**
 * @param type {ResourceConstant}
 * @return {Room}
 */
function getRoom(type){
    for (const rn in data){
        if (data[rn][type]==MAX){
            return Game.rooms[rn]
        }
    }
    for (const rn in data){
        if (data[rn][type]==MID){
            return Game.rooms[rn]
        }
    }
}
function getState(type,num) {
    switch (type) {
        case RESOURCE_ENERGY:
            type = resInfo[ENERGY]
            break
        case "O":
        case "H":
        case "Z":
        case "K":
        case "U":
        case "L":
        case "X":
            type = resInfo[MINERAL]
            break
        default:
            return null
    }
    if (num > type.rich) {
        return MAX
    }
    if (num > type.poor) {
        return MID
    }
}