<script>
    import ScoringLocation from "./ScoringLocation.svelte";
    import TrashCan from "./TrashCan.svelte";
    import NextStageButton from "./NextStageButton.svelte";
</script>

<div class="flex flex-col">
    <div class="flex items-center mb-2 xl:mb-4">
        <div class="p-2 mr-2">
            <ScoringLocation/>
        </div>
        <div class=" p-5 mr-2 xl:p-10">
            <ScoringLocation type="Fail"/>
        </div>
        <div class="text-center -ml-3 text-xl font-bold xl:text-3xl">High</div>
    </div>
    <div class="flex items-center mb-2">
        <div class=" p-2 mr-2">
            <ScoringLocation/>
        </div>
        <div class=" p-5 mr-2 xl:p-10">
            <ScoringLocation type="Fail"/>
        </div>
        <div class="text-center -ml-3 text-xl font-bold xl:text-3xl">Mid</div>
    </div>
    <div class="flex items-center">
        <div class=" p-2 mr-2">
            <ScoringLocation/>
        </div>
        <div class=" p-5 mr-2 xl:p-10">
            <ScoringLocation type="Fail"/>
        </div>
        <div class="text-center -ml-3 text-xl font-bold xl:text-3xl">Hybrid</div>
    </div>
    <div class="flex items-center">
        <div class=" p-2 mr-2">
            <TrashCan/>
        </div>

        <div class="text-center text-xl font-bold xl:text-3xl xl:ml-4">Dropped</div>
    </div>
</div>
