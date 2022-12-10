global.END_GOAL=-1;
const g={
    attack: require("./goal_attack"),
    sign: require("./goal_sign"),
    react: require("./goal_lab"),
    claim: require("./goal_claim")
}
if (!Memory.goals) {
    Memory.goals={};
}
for (const key in g) {
    if (!Memory.goals[key]) {
        Memory.goals[key]={};
    }
}
if (!Memory._goal) {
    Memory._goal={};
}
global.Goal={
    run(){
        let result;
        for (const id in Memory._goal) {
            result=g[Memory._goal[id].name].run(Memory.goals[Memory._goal[id].name][id],Memory._goal[id].context,id);
            if (result==global.END_GOAL) {
                this.removeGoal(id);
            }
        }
    },
    addGoal(goal,context){
        let id=Game.time%1000+"g";
        while(Memory._goal[id]){
            id+="2";
        }
        Memory._goal[id]={
            name: goal,
            context: context
        }
        Memory.goals[goal][id]={};
    },
    removeGoal(id){
        delete Memory.goals[Memory._goal[id].name][id];
        delete Memory._goal[id];
    },
    callAddCreep(creep,id){
        g[Memory._goal[id].name].addCreep(Memory.goals[Memory._goal[id].name][id],creep);
    },
    getGoal(name){
        return g[name];
    }
}