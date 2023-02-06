import {writable} from "svelte/store";
export const gameStage=writable(0);
export const liveGamepiece = writable("");
export const autoStack = writable([])
export const teleStack = writable([])



export const generalGameData=writable({
    scoutName: "Name",
    teamNum: 0,
    allianceColor: "blue"
})

export const defaultGeneralGameData=writable({
    scoutName: "Name",
    teamNum: 0,
    allianceColor: "blue"
})

export const autoGameData = writable({
    startingLocation: "Select Starting Location",
    highConeSuccess: 0,
    highConeFail: 0,
    midConeSuccess: 0,
    midConeFail: 0,
    hybridConeSuccess: 0,
    hybridConeFail: 0,
    droppedCone: 0,
    highCubeSuccess: 0,
    highCubeFail: 0,
    midCubeSuccess: 0,
    midCubeFail: 0,
    hybridCubeSuccess: 0,
    hybridCubeFail: 0,
    droppedCube: 0,
    docked: false,
    balanced: false,
    mobility: false
})

export const defaultAutoGameData = writable({
    startingLocation: "Select Starting Location",
    highConeSuccess: 0,
    highConeFail: 0,
    midConeSuccess: 0,
    midConeFail: 0,
    hybridConeSuccess: 0,
    hybridConeFail: 0,
    droppedCone: 0,
    highCubeSuccess: 0,
    highCubeFail: 0,
    midCubeSuccess: 0,
    midCubeFail: 0,
    hybridCubeSuccess: 0,
    hybridCubeFail: 0,
    droppedCube: 0,
    docked: false,
    balanced: false,
    mobility: false
})

export const teleGameData = writable({
    highConeSuccess: 0,
    highConeFail: 0,
    midConeSuccess: 0,
    midConeFail: 0,
    hybridConeSuccess: 0,
    hybridConeFail: 0,
    droppedCone: 0,
    highCubeSuccess: 0,
    highCubeFail: 0,
    midCubeSuccess: 0,
    midCubeFail: 0,
    hybridCubeSuccess: 0,
    hybridCubeFail: 0,
    droppedCube: 0,
    docked: false,
    balanced: false,
})

export const defaultTeleGameData = writable({
    highConeSuccess: 0,
    highConeFail: 0,
    midConeSuccess: 0,
    midConeFail: 0,
    hybridConeSuccess: 0,
    hybridConeFail: 0,
    droppedCone: 0,
    highCubeSuccess: 0,
    highCubeFail: 0,
    midCubeSuccess: 0,
    midCubeFail: 0,
    hybridCubeSuccess: 0,
    hybridCubeFail: 0,
    droppedCube: 0,
    docked: false,
    balanced: false,
})

export const postGameData = writable({
    defenseDuration: 0,
    defenseRating: 0,
    recDefenseDuration: 0,
    driverRating: 0,
    intakeRating: 0,
    notes: ""
})

export const defaultPostGameData = writable({
    defenseDuration: 0,
    defenseRating: 0,
    recDefenseDuration: 0,
    driverRating: 0,
    intakeRating: 0,
    notes: ""
})




