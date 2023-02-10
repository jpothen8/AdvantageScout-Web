<script>
    import {gameStage, autoGameData, teleGameData, postGameData, defaultAutoGameData, defaultGeneralGameData, defaultPostGameData, generalGameData, defaultTeleGameData} from "./stores";

    function pressed() {
        $autoGameData = $defaultAutoGameData
        $generalGameData = $defaultGeneralGameData
        $teleGameData = $defaultTeleGameData
        $postGameData = $defaultPostGameData
        $gameStage = 0;
    }
</script>

<label for="confirmReset" class="btn btn-outline btn-primary w-48 h-28 bg-base-100 xl:h-64 xl:w-80">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-16 h-16 xl:h-56 xl:w-56">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
</label>

<input type="checkbox" id="confirmReset" class="modal-toggle" />
<div class="modal modal-bottom sm:modal-middle cursor-pointer">
    <div class="modal-box">
        <h3 class="font-bold text-lg">Reset Submission</h3>
        <p class="py-4">Are you sure you want to reset the submission?</p>
        <div class="modal-action">
            <label for="confirmReset" class="btn btn-primary absolute left-4 bottom-4" on:click={pressed}>Yes, Reset</label>
        </div>
        <div class="modal-action">
            <label for="confirmReset" class="btn btn-error absolute right-4 bottom-4">No</label>
        </div>
    </div>
</div>




