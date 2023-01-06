Creep.prototype.withdrawFromStore = function () {
    if (this.room.storage.store.getUsedCapacity(RESOURCE_ENERGY)) {
        const result = this.withdraw(this.room.storage, RESOURCE_ENERGY);
        if (result == ERR_NOT_IN_RANGE) {
            this.moveTo(this.room.storage);
        } else if (result == OK) {
            this.memory.working = false;
        } else if (!this.store.getFreeCapacity(RESOURCE_ENERGY)) {
            this.memory.working = false;
        }
    } else {
        const result = this.withdraw(this.room.terminal, RESOURCE_ENERGY);
        if (result == ERR_NOT_IN_RANGE) {
            this.moveTo(this.room.terminal);
        } else if (result == OK) {
            this.memory.working = false;
        } else if (!this.store.getFreeCapacity(RESOURCE_ENERGY)) {
            this.memory.working = false;
        }
    }
}
/**
 * @returns {Array}
 */
Creep.prototype.boosts=function (){
    if (!this._bs){
        this._bs=[]
        for (const b of this.body){
            if (b.boost&&!this._bs.includes(b.boost)){
                this._bs.push(b.boost)
            }
        }
    }
    return this._bs
}
const boostMap={
    XGHO2:TOUGH,
    XZHO2:MOVE,
    XKHO2:RANGED_ATTACK,
    XZH2O:WORK,
    XLHO2:HEAL
}
Creep.prototype.boostInfo=function (){
    if (!this.buff.bstInfo){
        const body={}
        for (const b of this.body){
            if (body[b.type]){
                body[b.type]++
            }else {
                body[b.type]=1
            }
        }
        const info={}
        for (const res of this.memory.needBoost){
            info[res]=body[boostMap[res]]*30
        }
        this.buff.bstInfo=info
    }
    return this.buff.bstInfo
}
const canExtend=["target","role"]
/**
 * @param pre {number}
 */
Creep.prototype.autoRe=function(pre) {
    if (this.memory.re) {
        if (this.ticksToLive > 800) {
            delete this.memory.re
        }
    } else if (this.ticksToLive < this.body.length * 3 + pre) {
        const cloneM={}
        for (const key in this.memory){
            if (canExtend.includes(key)){
                cloneM[key]=this.memory[key]
            }
        }
        this.room.addTask(cloneM)
        this.memory.re = true
    }
}
Creep.prototype.workIfEmpty = function () {
    if (!this.store.getUsedCapacity()) {
        this.memory.working = true;
    }
}
Creep.prototype.transferAny=function (target){
    for (const k in this.store){
        if (this.transfer(target,k)==ERR_NOT_IN_RANGE){
            this.moveTo(target)
        }
        return
    }
}
Creep.prototype.onlyHas=function (type){
    for (const k in this.store){
        if (k!=type&&this.store.getUsedCapacity(k)){
            return false
        }
    }
    return true
}
Creep.prototype.getFrom=function (target,type) {
    if (!type) {
        for (const k in target.store) {
            type = k
            break
        }
    }
    const result=this.withdraw(target, type)
    if (result == ERR_NOT_IN_RANGE) {
        this.moveTo(target)
    }else if (result==OK){
        return true
    }
    return false
}
function min(a,b){
    return a<b?a:b;
}
const Carry=global.Constant.carryTaskType
Creep.prototype.runCarry = function () {
    if (this.hits<this.hitsMax) {
        this.room.heal(this)
    }
    this.greet("ikun")
    const memory=this.memory
    /**@type{CarryTask}*/
    let task = this.room.memory.carryTasks[memory.task];
    if (!task) {
        if (this.ticksToLive<40){
            if (this.store.getUsedCapacity()){
                this.transferAny(this.room.storage)
            }else {
                this.suicide()
            }
            return;
        }
        let id
        const allTasks=this.room.memory.carryTasks
        //找到可用的任务
        for (const i in allTasks) {
            if (!allTasks[i].runner || allTasks[i].runner == this.name || !Game.creeps[allTasks[i].runner]) {
                id = i
                break
            }
        }
        if (id) {
            memory.task = id;
            task = allTasks[id];
            task.runner=this.name;
            if (!task.num||task.num>this.store.getCapacity()){
                memory.num=this.store.getCapacity()
            }else {
                memory.num = task.num
            }
            delete memory.working
            delete memory.target
            memory.ready=false
        } else {
            if (this.store.getUsedCapacity()){
                this.transferAny(this.room.storage)
            }
            return;
        }
    }
    //准备
    if (!memory.ready) {
        if (task.type == Carry.TAKE) {
            if (this.store.getFreeCapacity() < memory.num && this.store.getUsedCapacity()) {
                this.transferAny(this.room.storage)
                return;
            } else {
                memory.ready = true
            }
        } else {
            if (this.onlyHas(task.res)) {
                if (this.store[task.res]<memory.num) {
                    let target = Game.getObjectById(memory.target)
                    if (!target) {
                        target = this.room.findRes(task.res, memory.num)
                        if (target) {
                            memory.target = target.id
                        } else {
                            this.room.deleteTask(memory.task)
                            return;
                        }
                    }
                    if (this.getFrom(target, task.res)){
                        memory.ready = true
                    }
                    return;
                } else {
                    memory.ready = true
                }
            } else if (!this.store.getUsedCapacity()) {
                let target = Game.getObjectById(memory.target)
                if (!target) {
                    target = this.room.findRes(task.res, memory.num)
                    if (target) {
                        memory.target = target.id
                    } else {
                        this.room.deleteTask(memory.task)
                        return;
                    }
                }
                if (this.getFrom(target, task.res)){
                    memory.ready = true
                }
                return;
            } else {
                this.transferAny(this.room.storage)
                return;
            }
        }
    }
    //开始任务
    let result
    const target=Game.getObjectById(task.target)
    if (task.num){
        if (task.type==Carry.TAKE){
            result=this.withdraw(target,task.res,memory.num)
        }else {
            result=this.transfer(target,task.res,memory.num)
        }
    }else {
        if (task.type==Carry.TAKE){
            result=this.withdraw(target,task.res)
        }else {
            result=this.transfer(target,task.res)
        }
    }

    if (result==ERR_NOT_IN_RANGE){
        this.moveTo(target)
    }else if (result==OK){
        if (task.num){
            task.num-=memory.num
            if (task.num<=0){
                this.room.deleteTask(memory.task)
            }
        }else {
            this.room.deleteTask(memory.task)
        }
        delete memory.task
    }else {
        console.log("任务异常")
        this.room.deleteTask(memory.task)
        delete memory.task
    }
}
Creep.prototype.centerCarry = function () {
    const memory=this.memory
    /**@type{CenterTask}*/
    let task = this.room.memory.centerTasks[memory.taskId];
    if (!task) {
        if (this.ticksToLive<15){
            if (this.store.getUsedCapacity()){
                this.transferAny(this.room.storage)
            }else {
                this.suicide()
            }
            return;
        }
        let id
        const allTasks=this.room.memory.centerTasks
        //找到可用的任务
        for (const i in allTasks) {
            if (!allTasks[i].runner || allTasks[i].runner == this.name || !Game.creeps[allTasks[i].runner]) {
                id = i
                break
            }
        }
        if (id) {
            memory.taskId = id;
            task = allTasks[id];
            task.runner=this.id;
            if (!task.num||task.num>this.store.getCapacity()){
                memory.num=this.store.getCapacity()
            }else {
                memory.num = task.num
            }
            delete memory.target
            memory.working=true
            memory.ready=false
        } else {
            if (this.store.getUsedCapacity()){
                this.transferAny(this.room.storage)
            }
            return;
        }
    }
    //准备
    if (!memory.ready) {
        if (this.store.getUsedCapacity()){
            this.transferAny(this.room.storage)
        }else {
            memory.ready=true
        }
    }
    //开始任务
    let result
    if (memory.working) {
        const src = Game.getObjectById(memory.taskId)
        result=task.num?this.withdraw(src, task.res, memory.num):this.withdraw(src, task.res)
        if (result==ERR_NOT_IN_RANGE){
            this.moveTo(src)
        }else if (result==OK){
            delete memory.working
        }else {
            console.log("任务异常")
            this.room.deleteCenter(memory.taskId)
            delete memory.taskId
            delete memory.working
        }
    }else {
        const target = Game.getObjectById(task.target)
        result=task.num?this.transfer(target, task.res, memory.num):this.transfer(target, task.res)
        if (result==ERR_NOT_IN_RANGE){
            this.moveTo(target)
        }else if (result==OK){
            if (task.num){
                task.num-=memory.num
                if (task.num<=0){
                    this.room.deleteCenter(memory.taskId)
                }
            }else {
                this.room.deleteCenter(memory.taskId)
            }
            delete memory.taskId
        }else {
            console.log("任务异常")
            this.room.deleteCenter(memory.taskId)
            delete memory.taskId
        }
    }
}

Creep.prototype.forceMove = function (target) {
    if (this.pos.isEqualTo(target)) {
        return true
    }
    this.moveTo(target)
    return false
}
//and towers
Creep.prototype.fillExt=function (){
    if (this.room.energyAvailable==this.room.energyCapacityAvailable){
        return;
    }
    let tar
    if (this.memory.target) {
        tar = Game.getObjectById(this.memory.target)
    } else {
        const exts = this.room.find(FIND_MY_STRUCTURES).filter(e => (e.structureType == STRUCTURE_SPAWN
            || e.structureType == STRUCTURE_EXTENSION||e.structureType==STRUCTURE_TOWER) && e.store.getFreeCapacity(RESOURCE_ENERGY))
        if (exts.length) {
            tar=this.pos.findClosestByRange(exts)
            this.memory.target = tar.id
        }else {
            return
        }
    }
    if (tar) {
        if (this.transfer(tar, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            this.moveTo(tar);
        } else if (!tar.store.getFreeCapacity(RESOURCE_ENERGY)) {
            this.memory.target = null
        }
        this.workIfEmpty()
    }
}
const sayings={
    sherlock: {
        content:["相爱总能和好/好马不吃回头草", "即兴的誓/烂尾的诗", "埋在心里吧/每个夜晚都思念的人","圆有公式/但缘没有","药是苦的/你的笑是甜的",
        "手是冷的/你的怀里是暖的","你知道我的星座吗/为你的量身定做","不要抱怨/抱我","不响丸辣！","我可是深情一哥","I am/Sherlock/A dog"]
    },
    ikun:{
        content:["你干嘛~~/哎呦~~~","我喜欢唱、跳、/Rap、篮球","Ctrl!","你食不食油饼","你有没有树枝","香精煎鱼食不食","香翅捞饭食不食"]
    },
    frog:{
        content:["I have/big ass","I am frog","把你的ass扣成/小天的形状/开不开心？"]
    },
    neo:{
        content:["啊哈哈哈~~/鸡汤来喽","这孩子跟小菜似的","哼~","shut up","鸡你太美","哈哈"]
    }
}
initSay()
function initSay(){
    let ss,content
    for (const key in sayings){
        ss=[]
        content=sayings[key].content
        for (const oneSay of content){
            ss.push(count(oneSay)+1)
        }
        sayings[key].sizes=ss
    }
}
function count(str){
    let sum = 0;
    for (const c of str) {
        sum += +(c == "/");
    }
    return sum;
}

Creep.prototype.greet=function (role) {
    let mem = this.memory.say
    if (!mem) {
        mem = this.memory.say = {}
    }
    if (mem.child == sayings[role].sizes[mem.index]) {
        if (Game.time%6){
            return
        }
        mem.child = 0
        let i=util.nextRand(sayings[role].content.length)
        if (i==mem.index){
            if (i){
                i--
            }else {
                i++
            }
        }
        mem.index=i
    }
    this._say = sayings[role].content[mem.index].split("/")[mem.child++]
    this.say(this._say,true)
}