<script>
    import {autoGameData, gameStage, teleGameData} from "./stores";
</script>

<div class="form-control">
    <label class="cursor-pointer label w-12 flex flex-col content-center">
        <span class="label-text text-base xl:text-lg">Docked</span>
        {#if $gameStage === 1}
        <input type="checkbox" class="checkbox checkbox-lg checkbox-primary" bind:checked={$autoGameData["docked"]}/>
            {:else}
            <input type="checkbox" class="checkbox checkbox-lg checkbox-primary" bind:checked={$teleGameData["docked"]}/>
            {/if}
    </label>
</div>