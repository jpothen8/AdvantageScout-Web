<script>
    import {autoGameData, gameStage, teleGameData} from "./stores";

    $: $autoGameData["docked"], checkBal()
    $: $teleGameData["docked"], checkBal2()

    function checkBal() {
        if ($autoGameData["docked"] === false) {
            $autoGameData["balanced"] = false
        }
    }

    function checkBal2() {
        if ($teleGameData["docked"] === false) {
            $teleGameData["balanced"] = false
        }
    }
</script>

<div class="form-control">
    <label class="cursor-pointer label w-12 flex flex-col content-center">
        <span class="label-text text-base xl:text-lg">Balanced</span>
        {#if $gameStage === 1}
            {#if $autoGameData["docked"]}
            <input type="checkbox" class="checkbox checkbox-lg checkbox-primary" bind:checked={$autoGameData["balanced"]}/>
                {:else}
            <input type="checkbox" class="checkbox checkbox-lg checkbox-primary" bind:checked={$autoGameData["balanced"]} disabled/>
                {/if}
        {:else}
            {#if $teleGameData["docked"]}
            <input type="checkbox" class="checkbox checkbox-lg checkbox-primary" bind:checked={$teleGameData["balanced"]}/>
                {:else}
            <input type="checkbox" class="checkbox checkbox-lg checkbox-primary" bind:checked={$teleGameData["balanced"]} disabled/>
                {/if}
        {/if}
    </label>
</div>