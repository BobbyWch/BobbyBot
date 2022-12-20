interface Memory{
    towers: { [id: string]: TowerMemory };
    sources: { [id: string]: SourceMemory };
    factorys: { [id: string]: FactoryMemory };
    terminals: { [id: string]: TerminalMemory };
    labs:{[id: string]: LabMemory}
}
interface CreepMemory{
    role: string;
    task: StructureConstant;
    working: boolean;
    ready: boolean;
    target: Id<Structure>;
    dontPullMe:boolean;
    _repair:Id<Structure>;
    endTime:number;
    state:string;
    taskId: Id<Structure>;
}
interface RoomMemory{
    carryTasks: { [owner: StructureConstant]: CarryTask };
    centerTasks:{[id:Id<AnyStoreStructure>]:CenterTask};
    _build:{
        id:Id<Structure>;
        x:number;
        y:number;
        type:BuildableStructureConstant;
    };
    _heal:Id<AnyCreep>;
    enemy:Id<AnyCreep>;
    prop:RoomProperty;
    spawns:Id<StructureSpawn>[];
    tasks:SpawnTask[];
}
interface SpawnTask{

}
interface RoomProperty{
    pc:number;
    factory:number;
    power:number;
    upgrade:number;
    extStore:number;
}
interface Game{
    sell:{[type:ResourceConstant]: Order[]};
}
interface LabMemory{

}
interface TowerMemory{}
interface SourceMemory{}
interface FactoryMemory{
    aim: ResourceConstant;
}
interface TerminalMemory{
    deals: DealTask[];
    sends: SendTask[];
}
interface DealTask{
    id: string;
    amount: number;
}
interface SendTask{
    target: string;
    type: ResourceConstant;
    num: number;
}

interface StructureFactory{

}
interface CarryTask{
    type: number;
    target: Id<Structure>;
    res: ResourceConstant;
    num: number;
    runner: string;
}
interface CenterTask{
    target: Id<Structure>;
    res: ResourceConstant;
    num: number;
    runner: string;
}
interface ResourceInfo{
    rich:number;
    poor:number;
}