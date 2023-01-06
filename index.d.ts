interface Memory{
    towers: { [id: string]: TowerMemory };
    sources: { [id: string]: SourceMemory };
    factorys: { [id: string]: FactoryMemory };
    terminals: { [id: string]: TerminalMemory };
    labs:{[id: string]: LabMemory};
    creepConfigs:object;
    avoids:Array;
}
interface CreepMemory{
    farMove:{
        index:number;
        path:Array;
        targetPos:string;
    };
    prePos:string;
    stand:boolean;
    belong: string;
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
    needBoost:MineralBoostConstant[];
    boosted:boolean;
    say:{
        index:number;
        child:number;
    };
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
    tasks:SpawnTask[];
    labs:LabMemory;
    upgInfo:{
        level:number;
        con:Id<StructureContainer>;
        link:Id<StructureLink>;
    };
    boost:{ [mineralName: MineralBoostConstant]: {
        users:string[];
        lab:Id<StructureLab>;
        amount:number;
        } };
    mission:MissionModel[];
    wantUpg:boolean;
}
interface MissionModel{
    id:string;
    type:string;
    parent:string;
    data:any;
    startTime:number;
}
interface LabMemory{
    main1: Id<StructureLab>;
    main2: Id<StructureLab>;
    others: Id<StructureLab>[];
    state: "prepare"|"react"|"collect";
    src1: ResourceConstant;
    src2: ResourceConstant;
    cooldown:number;
}
interface SpawnTask{

}
interface RoomProperty{
    pc:number;
    factory:number;
    power:number;
    upgrade:number;
    extStore:number;
    opExt:number;
    regen:number;
    lab:number;
}
interface Game{
    sell:{[type:ResourceConstant]: Order[]};
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