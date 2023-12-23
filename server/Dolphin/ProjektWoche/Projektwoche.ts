import { ObjectId, WithId } from "mongodb";

enum ProWoState {
    COLLECTING_PROJECTS = 0, // projects are still being entered from teachers
    VOTING = 1, // participants are voting for their favourite projects
    ASSIGNING = 2, // administrators are checking the data; participants are being assigned to projects
    ANNOUNCE_RESULTS = 3, // results are being announced; students still (if allowed) can switch
    RESULTS_FIX = 4, // results cannot be changed anymore. Switching is disabled
}

type ProWoDeadlines = {
    collectProjectsUntil: number;
    collectParticipantsVotes: number;
    announceResultsOn: number;
    makePermanentOn: number;
};

interface IProjektWoche {
    name: string;

    start: number;
    end: number;

    administrators: ObjectId[]; // administrators are allowed to see and edit any projects, force assign participants and similar stuff
    projectLeaders: ObjectId[]; // projectLeaders are allowed to create projects, edit their own projects, force assign participants to their own projects

    mandatory: boolean; // wether participants needs to participate / if true, participants will be force assigned if they miss to vote

    participants: ObjectId[]; // participants may vote for a project and will be assigned to one (hopefully the choosen one)

    deadlines: ProWoDeadlines;

    state: ProWoState;

    switchingAllowed: boolean;
}

class ProjektWoche implements WithId<IProjektWoche> {
    _id: ObjectId;

    name: string;
    start: number;
    end: number;
    administrators: ObjectId[];
    projectLeaders: ObjectId[];
    mandatory: boolean;
    participants: ObjectId[];
    deadlines: ProWoDeadlines;
    state: ProWoState;
    switchingAllowed: boolean;

    private constructor(data: WithId<IProjektWoche>) {
        this._id = data._id;
        this.name = data.name;
        this.start = data.start;
        this.end = data.end;
        this.administrators = data.administrators;
        this.projectLeaders = data.projectLeaders;
        this.mandatory = data.mandatory;
        this.participants = data.participants;
        this.deadlines = data.deadlines;
        this.state = data.state;
        this.switchingAllowed = data.switchingAllowed;
    }
}

export default ProjektWoche;
export { IProjektWoche };
