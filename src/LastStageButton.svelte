
<script>
    import {
        autoGameData,
        defaultAutoGameData,
        defaultGeneralGameData, defaultPostGameData, defaultTeleGameData,
        gameStage,
        generalGameData, postGameData,
        teleGameData, liveGamepiece, autoStack, teleStack
    } from "./stores";

    function nextStage() {
        $gameStage--;
    }

    function reset(){
        $autoGameData = $defaultAutoGameData
        $generalGameData = $defaultGeneralGameData
        $teleGameData = $defaultTeleGameData
        $postGameData = $defaultPostGameData
        $liveGamepiece=""
        $autoStack = []
        $teleStack = []
        nextStage()
    }

</script>

<div class="flex items-center justify-center ">
    {#if $gameStage !== 1}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
             class="w-16 h-16 flex-no-shrink absolute z-10 fill-base-100 xl:w-28 xl:h-48">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
        </svg>

        <button class="btn btn-outline w-12 h-28 z-50 xl:h-48 xl:w-24" on:click={nextStage}>
        </button>
    {:else}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
             class="w-16 h-16 flex-no-shrink absolute z-10 fill-base-100 xl:w-28 xl:h-48">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
        </svg>

        <label for="Restart" class="btn btn-outline w-12 h-28 z-50 xl:h-48 xl:w-24">
        </label>
    {/if}


</div>


<input type="checkbox" id="Restart" class="modal-toggle" />
<div class="modal modal-bottom sm:modal-middle cursor-pointer">
    <div class="modal-box">
        <h3 class="font-bold text-lg">Reset Submission</h3>
        <p class="py-4">Do you want to reset the submission? (This clears all current data)</p>
        <div class="modal-action">
            <label for="Restart" class="btn btn-error absolute left-4 bottom-4" on:click={reset}>Yes, Reset</label>
        </div>
        <div class="modal-action">
            <label for="Restart" class="btn btn-primary absolute right-4 bottom-4" on:click={nextStage}>No, Keep The Data</label>
        </div>
    </div>
</div>



