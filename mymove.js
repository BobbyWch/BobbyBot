Memory.avoids=[]
global.routes={}
const serial=util.serial
const unserial=util.unSerial
const rawMove=Creep.prototype.move
const rawMoveTo=Creep.prototype.moveTo
/**
 * 远程寻路
 *
 * @param target {RoomPosition} 目标位置
 * @param range 搜索范围 默认为 1
 * @returns PathFinder.search 的返回值
 */
Creep.prototype.findPath=function (target, range=1) {
    if (!this.memory.farMove) this.memory.farMove = {}
    this.memory.farMove.index = 0
    // 先查询下缓存里有没有值
    const routeKey = `${serial(this.pos)} ${serial(target)}`
    let route = global.routes[routeKey]
    // 如果有值则直接返回
    if (route) {return route}

    const result = PathFinder.search(this.pos, { pos: target, range:range }, {
        plainCost: 2,
        swampCost: 10,
        maxOps: 4000,
        roomCallback: roomName => {
            if (Memory.avoids.includes(roomName)) return false
            const room = Game.rooms[roomName]
            // 房间没有视野
            if (!room) return
            let costs = new PathFinder.CostMatrix
            room.find(FIND_STRUCTURES).forEach(struct => {
                if (struct.structureType == STRUCTURE_ROAD) {
                    costs.set(struct.pos.x, struct.pos.y, 1)
                } else if (struct.structureType != STRUCTURE_CONTAINER &&
                    (struct.structureType != STRUCTURE_RAMPART || !struct.my)
                ) costs.set(struct.pos.x, struct.pos.y, 0xff)
            })
            // 避开房间中的禁止通行点
            const restrictedPos = room.getRestrictedPos()
            for (const creepName in restrictedPos) {
                // 自己注册的禁止通行点位自己可以走
                if (creepName == this.name) continue
                const pos = unserial(restrictedPos[creepName])
                costs.set(pos.x, pos.y, 0xff)
            }
            return costs
        }
    })
    // 没找到就返回 null
    if (!result.path.length) return null
    // 找到了就进行压缩
    route = serializeFarPath(result.path,this.pos)
    // 保存到全局缓存
    if (!result.incomplete) global.routes[routeKey] = route
    return route
}

/**
 * 压缩 PathFinder 返回的路径数组
 *
 * @param positions {RoomPosition[]} 房间位置对象数组，必须连续
 * @param p {RoomPosition}
 * @returns {string}
 */
function serializeFarPath(positions,p) {
    if (positions.length == 0) return ''
    // 确保路径的第一个位置是自己的当前位置
    if (!positions[0].isEqualTo(p)) positions.splice(0, 0, p)
    return positions.map((pos, index) => {
        // 最后一个位置就不用再移动
        if (index >= positions.length - 1) return null
        // 由于房间边缘地块会有重叠，所以这里筛除掉重叠的步骤
        if (pos.roomName != positions[index + 1].roomName) return null
        // 获取到下个位置的方向
        return pos.getDirectionTo(positions[index + 1])
    }).join('')
}

/**
 * 使用缓存进行移动
 * 该方法会对 creep.memory.farMove 产生影响
 *
 * @returns ERR_NO_PATH 找不到缓存
 * @returns ERR_INVALID_TARGET 撞墙上了
 */
Creep.prototype.goByCache=function () {
    if (!this.memory.farMove) return ERR_NO_PATH
    const index = this.memory.farMove.index
    // 移动索引超过数组上限代表到达目的地
    if (index == this.memory.farMove.path.length) {
        delete this.memory.farMove.path
        return OK
    }
    // 获取方向，进行移动
    const direction = Number(this.memory.farMove.path[index])
    const goResult = this.move(direction)
    // 移动成功，更新下次移动索引
    if (goResult == OK) this.memory.farMove.index++
    return goResult
}
/**
 * 向指定方向移动
 *
 * @param target 要移动到的方向
 * @returns ERR_INVALID_TARGET 发生撞停
 */
Creep.prototype.move=function (target) {
    // 进行移动，并分析其移动结果，OK 时才有可能发生撞停
    const moveResult = rawMove.call(this,target)
    if (moveResult != OK || target instanceof Creep) return moveResult
    const currentPos = `${this.pos.x}/${this.pos.y}`
    // 如果和之前位置重复了就分析撞上了啥
    if (this.memory.prePos && currentPos == this.memory.prePos) {
        // 尝试对穿，如果自己禁用了对穿的话则直接重新寻路
        const crossResult = this.mutualCross(target)
        // 没找到说明撞墙上了或者前面的 creep 拒绝对穿，重新寻路
        if (crossResult != OK) {
            delete this.memory._move
            return ERR_INVALID_TARGET
        }
    }
    // 没有之前的位置或者没重复就正常返回 OK 和更新之前位置
    this.memory.prePos = currentPos
    return OK
}

/**
 * 无视 Creep 的寻路
 *
 * @param target 要移动到的位置
 */
Creep.prototype.goTo=function (target){
    return rawMoveTo.call(this,target, {
        reusePath: 20,
        ignoreCreeps: true,
        costCallback: (roomName, costMatrix) => {
            if (roomName == this.room.name) {
                // 避开房间中的禁止通行点
                const restrictedPos = this.room.getRestrictedPos()
                for (const creepName in restrictedPos) {
                    // 自己注册的禁止通行点位自己可以走
                    if (creepName == this.name) continue
                    const pos = unserial(restrictedPos[creepName])
                    costMatrix.set(pos.x, pos.y, 0xff)
                }
            }
            return costMatrix
        }
    })
}

/**
 * 远程寻路
 * 包含对穿功能，会自动躲避 bypass 中配置的绕过房间
 *
 * @param target 要移动到的位置对象
 * @param range 允许移动到目标周围的范围
 */
Creep.prototype.farMoveTo=function (target,range = 1){
    const memory=this.memory
    if (!memory.farMove) memory.farMove = {}
    // 确认目标有没有变化, 变化了则重新规划路线
    const targetPosTag = serial(target)
    if (targetPosTag != memory.farMove.targetPos) {
        memory.farMove.targetPos = targetPosTag
        memory.farMove.path = this.findPath(target, range)
    }
    // 确认缓存有没有被清除
    if (!memory.farMove.path) {
        memory.farMove.path = this.findPath(target, range)
    }

    // 还为空的话就是没找到路径
    if (!memory.farMove.path) {
        delete memory.farMove.path
        return OK
    }
    // 使用缓存进行移动
    const goResult = this.goByCache()
    // 如果发生撞停或者参数异常的话说明缓存可能存在问题，移除缓存
    if (goResult == ERR_INVALID_TARGET || goResult == ERR_INVALID_ARGS) {
        delete memory.farMove.path
    } else if (goResult != OK && goResult != ERR_TIRED) {
        this.say(`远程寻路 ${goResult}`)
    }
    return goResult
}

/**
 * 向指定方向发起对穿
 *
 * @param direction 要进行对穿的方向
 * @returns OK 成功对穿
 * @returns ERR_BUSY 对方拒绝对穿
 * @returns ERR_NOT_FOUND 前方没有 creep
 */
Creep.prototype.mutualCross=function (direction){
    // 获取前方位置上的 creep（fontCreep）
    const fontPos = directionToPos(this.pos,direction)
    if (!fontPos) return ERR_NOT_FOUND
    const fontCreep = fontPos.lookFor(LOOK_CREEPS)[0] || fontPos.lookFor(LOOK_POWER_CREEPS)[0]
    if (!fontCreep) return ERR_NOT_FOUND
    this.say(`👉`)
    // 如果前面的 creep 同意对穿了，自己就朝前移动
    if (fontCreep.requireCross(getOppositeDirection(direction))) rawMove.call(this,direction)
    else return ERR_BUSY
    return OK
}
PowerCreep.prototype.mutualCross=Creep.prototype.mutualCross
/**
 * 请求对穿
 * 自己内存中 standed 为 true 时将拒绝对穿
 *
 * @param direction 请求该 creep 进行对穿
 */
Creep.prototype.requireCross=function (direction) {
    // 拒绝对穿
    if (this.memory.stand) {
        this.say('👊')
        return false
    }
    // 同意对穿
    this.say('👌')
    rawMove.call(this,direction)
    return true
}
PowerCreep.prototype.requireCross=Creep.prototype.requireCross
function directionToPos(pos,direction){
    let targetX = pos.x
    let targetY = pos.y

    // 纵轴移动，方向朝下就 y ++，否则就 y --
    if (direction != LEFT && direction != RIGHT) {
        if (direction > LEFT || direction < RIGHT) targetY --
        else targetY ++
    }
    // 横轴移动，方向朝右就 x ++，否则就 x --
    if (direction != TOP && direction != BOTTOM) {
        if (direction < BOTTOM) targetX ++
        else targetX --
    }
    // 如果要移动到另一个房间的话就返回空，否则返回目标 pos
    if (targetX < 0 || targetY > 49 || targetX > 49 || targetY < 0) return undefined
    else return new RoomPosition(targetX, targetY, pos.roomName)
}
function getOppositeDirection(direction) {
    return (direction + 3) % 8 + 1
}