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
    get:(roomName,type,num)=>{
        const src=getRoom(type)
        if (src){
            src.terminal.addSend(roomName,type,num)
            return true
        }else {
            return false
        }
    },
    send:(roomName,type,num)=>{
        let room
        for (const rn in data){
            room=Game.rooms[rn]
            if (room.getStore()[type]>=num){
                room.terminal.addSend(roomName,type,num)
                return true
            }
        }
        return false
    },
    /**
     * @param terminal {StructureTerminal}
     * @param type {ResourceConstant}
     * @param price {number}
     */
    sell:(terminal,type,price)=>{
        if (!Game.sell[type]){
            Game.sell[type]=Game.market.getAllOrders({resourceType: type,type:ORDER_BUY})
        }
        const o=highestOf(Game.sell[type])
        if (o&&o.price>=price){
            terminal.deal(o.id,min(o.amount, terminal.store[type]))
            o.remainingAmount-=min(o.amount, terminal.store[type])
        }
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
/**
 * @param orders {Order[]}
 * @returns {Order}
 */
function highestOf(orders){
    let h
    for (const o of orders){
        if (h){
            if (o.price>h.price&&o.remainingAmount>0){
                h=o
            }
        }else {
            if (o.remainingAmount){
                h=o
            }
        }
    }
    return h
}
/**
 * @param orders {Order[]}
 * @returns {Order}
 */
function lowestOf(orders){
    let h
    for (const o of orders){
        if (h){
            if (o.price<h.price&&o.remainingAmount>0){
                h=o
            }
        }else {
            if (o.remainingAmount){
                h=o
            }
        }
    }
    return h
}
function min(a,b){
    return a<b?a:b;
}