global.Logger={
    log:log,
    color:colorful,
    roomLink:createRoomLink,
    button:createButton
}
/**
 * 在绘制控制台信息时使用的颜色
 */
global.Colors = {
    red: '#e04545',
    green: '#6dce30',
    yellow: '#ffff00',
    blue: '#20adfa'
}
/**
 * 给指定文本添加颜色
 * 
 * @param content 要添加颜色的文本
 * @param colorName 要添加的颜色常量字符串
 */
function colorful(content, colorName) {
    return `<text style="color: ${colorName}; ">${content}</text>`
}
/**
 * 给房间内添加跳转链接
 * 
 * @param roomName 添加调整链接的房间名
 * @returns {string} 打印在控制台上后可以点击跳转的房间名
 */
function createRoomLink(roomName) {
    return `<a href="https://screeps.com/a/#!/room/${Game.shard.name}/${roomName}" target="_self">${roomName}</a>`
}
/**
 * 全局日志
 * 
 * @param content 日志内容
 * @param prefixes 前缀中包含的内容
 * @param color 日志前缀颜色
 * @param notify 是否发送邮件
 */
function log(content, prefixes, color, notify) {
    let prefix = prefixes.length > 0 ? `【${prefixes.join(' ')}】 ` : ''
    prefix = colorful(prefix, color, true)
    const logContent = `${prefix}${content}`
    console.log(logContent)
    if (notify) Game.notify(logContent)
}

function createButton(command,content){
    return `<button onclick="angular.element(document.body).injector().get('Console').sendCommand('(${command})()', 1)">${content}</button>`
}