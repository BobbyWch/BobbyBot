const config = require("./config");
initMem()
assignMem()

Structure.prototype.getS=function (type,num){
    this.room.addCarryTask(this,1,type,num)
}
Structure.prototype.takeS=function (type,num){
    this.room.addCarryTask(this,0,type,num)
}
Structure.prototype.findMost=function () {
    let type
    const store = this.store
    for (const k in store) {
        if (!type || store[k] > store[type]) {
            type = k
        }
    }
    return type
}
global.api = {
    buy(a, price, num) {
        Game.market.createOrder({
            type: ORDER_BUY,
            resourceType: a,
            price: price,
            totalAmount: num,
            roomName: "W53S7"
        })
    },
    attack() {
        const r=Game.rooms.W53S7
        Goal.addGoal("attack", { from: "W53S7", to: Game.flags.attack.pos.roomName })
        r.pc().addTask(PWR_OPERATE_EXTENSION,r.storage.id)
    },
    freeLabs() {
        for (const lab in Memory.labs) {
            delete Memory.labs[lab].boosting
        }
    },
    react(res1, res2) {
        Goal.addGoal("react", { roomName: "W53S7", src1: res1, src2: res2, count: 3000 })
    },
    reactO(res1) {
        Goal.addGoal("react", { roomName: "W53S7", src1: res1, src2: "OH", count: 3000 })
    },
    spawnMiner(r){
        //const r=Game.rooms.W53S7
        for (const s of r.find(FIND_SOURCES)){
            r.addTask({role:config.miner,target:s.id})
        }
    },
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
    send(res,mount){
        Game.rooms.W53S7.terminal.send(res,mount,"W52S7")
    }
}
assignStorage()
assignFactory()
assignTerminal()
assignLab()
assignPowerCreep()
require("./creep_proto")
require("./room_proto")
function initMem(){
    const keys=["towers","sources","factorys","terminals","labs"]
    for (const k of keys){
        if (!Memory[k]){
            Memory[k]={}
        }
    }
}
function assignMem(){
    Object.defineProperty(StructureTower.prototype,"memory",{
        get: function() {
            return Memory.towers[this.id] =Memory.towers[this.id] || {};
        },
        set: function(value) {Memory.towers[this.id] = value;}
    })
    Object.defineProperty(Source.prototype,"memory",{
        get: function() {
            return Memory.sources[this.id] = Memory.sources[this.id] || {};
        },
        set: function(value) {Memory.sources[this.id] = value;}
    })
    Object.defineProperty(Mineral.prototype,"memory",{
        get: function(){
            return Memory.sources[this.id]= Memory.sources[this.id] || {}
        },
        set: function(value){Memory.sources[this.id]=value}
    })
    Object.defineProperty(StructureFactory.prototype, 'memory', {
        get: function() {
            return Memory.factorys[this.id] = Memory.factorys[this.id] || {};
        },
        set: function(value) {Memory.factorys[this.id] = value;}
    })
    Object.defineProperty(StructureTerminal.prototype, 'memory', {
        get: function() {
            return Memory.terminals[this.id] = Memory.terminals[this.id] || {};
        },
        set: function(value) {Memory.terminals[this.id] = value;}
    })
    Object.defineProperty(StructureLab.prototype, 'memory', {
        get: function() {
            return Memory.labs[this.id] = Memory.labs[this.id] || {};
        },
        set: function(value) {Memory.labs[this.id] = value;}
    });
}
const factoryInfo={}
factoryInfo[RESOURCE_CONCENTRATE]={
    level1:pack(RESOURCE_ENERGY,300,RESOURCE_CONDENSATE,30,RESOURCE_HYDROGEN,1000),
    level2:pack(RESOURCE_REDUCTANT,54),
    power:true
}
factoryInfo[RESOURCE_ALLOY]={
    level1:pack(RESOURCE_ENERGY,1000,RESOURCE_ZYNTHIUM,500,RESOURCE_METAL,100),
    level2:pack(RESOURCE_ZYNTHIUM_BAR,100),
}
factoryInfo[RESOURCE_OXIDANT]={
    level1:pack(RESOURCE_ENERGY,300,RESOURCE_OXYGEN,800)
}
function pack(){
    let last=null
    const r={}
    for (const a of arguments){
        if (last){
            r[last]=a
            last=null
        }else {
            last=a
        }
    }
    return r
}
function assignFactory(){
    StructureFactory.prototype.work=function (){
        if (this.memory.aim){
            const info=factoryInfo[this.memory.aim]
            if (this.store[this.memory.aim]>1000){
                this.room.centerTask(this,this.room.terminal,this.memory.aim)
            }
            for (const k in info.level1){
                if (this.store.getUsedCapacity(k)<info.level1[k]){
                    if (this.room.storage.store[k]){
                        this.room.centerTask(this.room.storage,this,k)
                    }else if (this.room.terminal.store[k]){
                        this.room.centerTask(this.room.terminal,this,k)
                    }else {
                        delete this.memory.aim
                    }
                    return;
                }
            }
            if (this.cooldown){
                return;
            }
            if (info.level2){
                for (const k in info.level2){
                    if (this.store.getUsedCapacity(k)<info.level2[k]){
                        this.produce(k)
                        return;
                    }
                }
            }
            if (info.power){
                if (this.effects&&this.effects.length){
                    this.produce(this.memory.aim)
                }else {
                    this.room.pc().addTask(PWR_OPERATE_FACTORY,this.id)
                }
            }else {
                this.produce(this.memory.aim)
            }
        }
    }
}
function assignStorage(){
    StructureStorage.prototype.balance=function (){
        const room=this.room
        const factory=room.factory
        const terminal=room.terminal
        // const prop=this.room.memory.prop
        const store=this.store
        const sT=terminal.store
        if (store[RESOURCE_OPS]>10000&&sT[RESOURCE_OPS]<10000){
            room.centerTask(this,terminal,RESOURCE_OPS)
        }
        if(store["energy"]<100000&&Game.time%290==0){
            Channel.get(this.room.name,"energy",60000)
        }
        if (!factory){
            return
        }
        const sF=factory.store
        if (sT[RESOURCE_CONDENSATE]||sF[RESOURCE_CONDENSATE]>30){
            factory.memory.aim=RESOURCE_CONCENTRATE
        }else if (sT[RESOURCE_METAL]){
            factory.memory.aim=RESOURCE_ALLOY
        } else if (store[RESOURCE_OXYGEN]>120000) {
            factory.memory.aim=RESOURCE_OXIDANT
        }else {
            delete factory.memory.aim
        }
    }
}
function assignTerminal(){
    /**
     * @param orderId {string}
     * @param amount {number}
     */
    StructureTerminal.prototype.deal=function (orderId,amount){
        for (const o of this.memory.deals){
            if (o.id==orderId){
                return
            }
        }
        this.memory.deals.push({id: orderId,amount: amount})
    }
    StructureTerminal.prototype.addSend=function (roomName,type,num){
        for (const o of this.memory.sends){
            if (o.target==roomName){
                return
            }
        }
        this.memory.sends.push({target: roomName,type: type,num:num})
    }
    StructureTerminal.prototype.work=function () {
        if (Game.time%70==0){
            Channel.reg(this.room)
        }
        const room = this.room
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) <= 95000) {
            if (this.store.getFreeCapacity() && room.storage.store[RESOURCE_ENERGY] > 5000) {
                room.centerTask(room.storage,this,RESOURCE_ENERGY)
            }
        } else if (this.store.getUsedCapacity(RESOURCE_ENERGY) >= 120000) {
            room.centerTask(this,room.storage,RESOURCE_ENERGY)
        }
        if (this.store.getUsedCapacity(RESOURCE_POWER)) {
            room.centerTask(this,room.storage,RESOURCE_POWER)
        } else if (Game.time % 1598 === 0) {
            if (room.storage.store.getUsedCapacity(RESOURCE_POWER) <= 3000000) {
                const orders = Game.market.getAllOrders({resourceType: RESOURCE_POWER, type: ORDER_SELL})
                let low = lowestOf(orders)
                if (low && low.price <= 141 || room.storage.store.getUsedCapacity(RESOURCE_POWER) <= 10000) {
                    this.deal(low.id, min(low.amount, 50000))
                }
            }
        }
        if (Game.time % 9837 == 0 && this.store[RESOURCE_OPS]) {
            Channel.sell(this,RESOURCE_OPS,25)
        }
        if (Game.time % 690 == 0 && this.room.storage.store.getUsedCapacity("energy") > 2000000) {
            console.log("sell")
            Channel.sell(this,RESOURCE_ENERGY,10)
        }
        if (Game.time % 10000 == 0 && this.store[RESOURCE_OXIDANT]) {
            const orders = Game.market.getAllOrders({resourceType: RESOURCE_OXIDANT, type: ORDER_BUY})
            let highOrder = highestOf(orders)
            if (highOrder && highOrder.price >= 50) {
                this.deal(highOrder.id, min(this.store.getUsedCapacity(RESOURCE_OXIDANT), highOrder.amount))
            }
        }
        buy(this, "K", 15000)
        buy(this, "U", 15000)
        buy(this, "L", 15000)
        buy(this, "H", 15000)
        buy(this, "Z", 15000)
        if(Game.time%100==0&&this.room.storage.store["energy"]<200000){
            api.send("energy",50000)
        }
        //buy(this,RESOURCE_ENERGY,60000)
        //传送资源
        if (this.cooldown) {
            return
        }
        //完成队列里的交易
        if (this.memory.deals.length) {
            const d = this.memory.deals[0]
            const result = Game.market.deal(d.id, d.amount, this.room.name)
            if (result === OK) {
                this.memory.deals.shift()
            } else if (result === ERR_INVALID_ARGS) {
                this.memory.deals.shift()
            }
            return;
        }
        if (this.memory.sends.length) {
            const d = this.memory.sends[0]
            if (d.type==RESOURCE_ENERGY){
                if (this.store[d.type]<d.num+Game.market.calcTransactionCost(d.num,this.room.name,d.target)){
                    this.getS(d.type)
                    return;
                }
            }else {
                if (this.store[d.type]<d.num){
                    this.getS(d.type)
                    return;
                }
            }
            const result = this.send(d.type,d.num,d.target)
            if (result === OK) {
                this.memory.sends.shift()
            } else if (result === ERR_INVALID_ARGS) {
                this.memory.sends.shift()
                console.log("无效参数")
            }
        }
    }
}

function buy(terminal,type,num){
    if(terminal.store[type]<num){
        if (terminal.room.storage.store[type]){
            terminal.room.centerTask(terminal.room.storage,terminal,type)
            return
        }
        switch(type){
            case "H":
            case "L":
            case "Z":
                if(Game.time%200==0){
                    const orders=Game.market.getAllOrders({resourceType: type,type:ORDER_SELL})
                    if(orders.length){
                        const o=lowestOf(orders)
                        if(o.price<20){
                            terminal.deal(o.id,min(o.remainingAmount,5000))
                        }
                    }
                }
                break
            case "U":
            case "K":
                if(Game.time%4000==0){
                    Game.market.createOrder({
                        type: ORDER_BUY,
                        resourceType: type,
                        price: 5,
                        totalAmount: 3000,
                        roomName: terminal.room.name
                    })
                }
        }
    }
}
function assignLab(){
    StructureLab.prototype.clear=function () {
        if (this.mineralType&&this.store.getUsedCapacity(this.mineralType)) {
            this.takeS(this.mineralType,this.store.getUsedCapacity(this.mineralType))
            return true
        }
        return false
    }
}
function assignPowerCreep(){
    for (const p in Game.powerCreeps){
        if (!Game.powerCreeps[p].memory.tasks){
            Game.powerCreeps[p].memory.tasks={}
        }
    }
    PowerCreep.prototype.work=function (){
        if(!this.hits){
            this.spawn(Game.rooms.W53S7.powerSpawn)
            return
        }
        if (this.hits<this.hitsMax){
            this.room.heal(this)
        }
        if (this.store.getUsedCapacity(RESOURCE_OPS)<150){
            if (this.withdraw(this.room.storage,RESOURCE_OPS,200)===ERR_NOT_IN_RANGE){
                this.moveTo(this.room.storage)
            }
            return;
        } else if (this.store.getFreeCapacity()<=300){
            if (this.transfer(this.room.storage,RESOURCE_OPS,1000)===ERR_NOT_IN_RANGE){
                this.moveTo(this.room.storage)
            }
            return
        }else if (this.ticksToLive<=500){
            this.moveTo(this.room.powerSpawn)
            this.renew(this.room.powerSpawn)
            return
        }
        for (const pwr in this.memory.tasks){
            const o=Game.getObjectById(this.memory.tasks[pwr])
            const result=this.usePower(pwr,o)
            if (result===ERR_NOT_IN_RANGE){
                this.moveTo(o)
            //}else if (result===ERR_TIRED){
              //  if(pwr==PWR_OPERATE_STORAGE)
               // break
            }else {
                delete this.memory.tasks[pwr]
                return
            }
        }
        this.usePower(PWR_GENERATE_OPS)
    }
    PowerCreep.prototype.addTask=function (pwr,id){
        if (!this.memory.tasks[pwr]){
            this.memory.tasks[pwr]=id
        }
    }
}

function min(a,b){
    return a<b?a:b;
}
const prices={
    U: 0.75,
    Z: 9.5
}
/**
 * @param orders {Order[]}
 * @returns {Order}
 */
function highestOf(orders){
    let h
    for (const o of orders){
        if (h){
            if (o.price>h.price&&o.remainingAmount){
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
 *
 * @param orders {Order[]}
 * @returns {Order}
 */
function lowestOf(orders){
    let h
    for (const o of orders){
        if (h){
            if (o.price<h.price&&o.remainingAmount){
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