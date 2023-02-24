<script>
    import ScoringLocation from "./ScoringLocation.svelte";
    import TrashCan from "./TrashCan.svelte";
    import NextStageButton from "./NextStageButton.svelte";
    import {autoGameData} from "./stores";


</script>

<div class="flex flex-col pb-24 xl:pb-44">
    <div class="flex items-center mb-2 xl:mb-4">
        <div class="p-2 mr-2">
            <ScoringLocation height=2/>
        </div>
        <div class=" p-5 mr-2 xl:p-10">
            <ScoringLocation type="Fail" height="2"/>
        </div>
        <div class="text-center -ml-3 text-xl font-bold xl:text-3xl">High</div>
    </div>
    <div class="flex items-center mb-2">
        <div class=" p-2 mr-2">
            <ScoringLocation height="1"/>
        </div>
        <div class=" p-5 mr-2 xl:p-10">
            <ScoringLocation type="Fail" height="1"/>
        </div>
        <div class="text-center -ml-3 text-xl font-bold xl:text-3xl">Medium</div>
    </div>
    <div class="flex items-center">
        <div class=" p-2 mr-2">
            <ScoringLocation height="0"/>
        </div>
        <div class=" p-5 mr-2 xl:p-10">
            <ScoringLocation type="Fail" height="0"/>
        </div>
        <div class="text-center -ml-3 text-xl font-bold xl:text-3xl">Hybrid (Ground)</div>
    </div>
    <div class="flex items-center">
        <div class=" p-2 mr-2">
            <TrashCan/>
        </div>

        <div class="text-center text-xl font-bold xl:text-3xl xl:ml-4">Dropped before scoring</div>
    </div>
</div>
