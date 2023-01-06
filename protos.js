initMem()
assignMem()
assignStorage()
assignFactory()
assignTerminal()
assignPowerCreep()
const min=util.min
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

function initMem(){
    const keys=["sources","factorys","terminals"]
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
        if (Game.time%203==0){
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
            if (room.controller.level==8&&room.storage.store.getUsedCapacity(RESOURCE_POWER) <= 3000000) {
                const orders = Game.market.getAllOrders({resourceType: RESOURCE_POWER, type: ORDER_SELL})
                let low = lowestOf(orders)
                if (low && low.price <= 141 || room.storage.store.getUsedCapacity(RESOURCE_POWER) <= 5000) {
                    this.deal(low.id, min(low.amount, 50000))
                }
            }
        }
        if (Game.time % 9837 == 0 && this.store[RESOURCE_OPS]) {
            Channel.sell(this,RESOURCE_OPS,25)
        }
        if (Game.time % 5290 == 0 && this.room.storage.store["energy"] > 2000000) {
            Channel.sell(this,RESOURCE_ENERGY,12)
        }
        if (Game.time % 10000 == 0 && this.store[RESOURCE_OXIDANT]) {
            const orders = Game.market.getAllOrders({resourceType: RESOURCE_OXIDANT, type: ORDER_BUY})
            let highOrder = highestOf(orders)
            if (highOrder && highOrder.price >= 50) {
                this.deal(highOrder.id, min(this.store.getUsedCapacity(RESOURCE_OXIDANT), highOrder.amount))
            }
        }
        if (Game.time%103==0) {
            buy(this, "K", 10000)
        buy(this, "U", 10000)
        buy(this, "L", 10000)
        buy(this, "H", 10000)
        buy(this, "Z", 10000)
        buy(this, "O", 10000)
        buy(this, "X", 10000)
        if(this.room.storage.store["energy"]<300000){
            Channel.get(this.room.name,RESOURCE_ENERGY,50000)
        }
        }
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
    StructureTerminal.prototype.addResWatch=function (watch){

    }
    StructureTerminal.prototype.hasResWatch=function (watch){

    }
    StructureTerminal.prototype.removeResWatch=function (watch){

    }
}

function buy(terminal,type,num) {
    if (num-terminal.store[type]>2000) {
        if (terminal.room.storage.store[type]) {
            terminal.room.centerTask(terminal.room.storage, terminal, type)
            return
        }
        if (Channel.get(terminal.room.name, type, num)) {
            return;
        }
            const orders = Game.market.getAllOrders({resourceType: type, type: ORDER_SELL})
            if (orders.length) {
                const o = lowestOf(orders)
                if (o&&o.price < 20) {
                    terminal.deal(o.id, min(o.remainingAmount, num-terminal.store[type]))
                }
            }
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
            this.spawn(Game.rooms[this.memory.parent].powerSpawn)
            return
        }
        if (this.hits<this.hitsMax){
            this.room.heal(this)
        }
        if (!this.room.controller.isPowerEnabled){
            if (this.enableRoom(this.room.controller)==ERR_NOT_IN_RANGE){
                this.moveTo(this.room.controller)
            }
        }
        if (this.store.getUsedCapacity(RESOURCE_OPS)<150){
            if (this.withdraw(this.room.storage,RESOURCE_OPS,200)===ERR_NOT_IN_RANGE){
                this.moveTo(this.room.storage)
            }
            return;
        } else if (this.ticksToLive<=500){
            this.moveTo(this.room.powerSpawn)
            if (this.room.memory.prop.regen||util.isEqual(this.pos,this.room.powerSpawn.pos)){
                this.renew(this.room.powerSpawn)
            }
            return
        }
        if (this.room.memory.prop.opExt){
            if (this.room.energyAvailable<this.room.energyCapacityAvailable*0.6){
                this.addTask(PWR_OPERATE_EXTENSION,this.room.storage.id)
            }
        }
        for (const pwr in this.memory.tasks){
            const o=Game.getObjectById(this.memory.tasks[pwr])
            const result=this.usePower(pwr,o)
            if (result===ERR_NOT_IN_RANGE){
                this.moveTo(o)
            }else {
                delete this.memory.tasks[pwr]
            }
            return
        }
        if (this.store.getFreeCapacity()<=200){
            if (this.transfer(this.room.storage,RESOURCE_OPS,this.store[RESOURCE_OPS]-220)===ERR_NOT_IN_RANGE){
                this.moveTo(this.room.storage)
            }
            return
        }
        this.usePower(PWR_GENERATE_OPS)
    }
    PowerCreep.prototype.addTask=function (pwr,id){
        if (!this.memory.tasks[pwr]){
            this.memory.tasks[pwr]=id
        }
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