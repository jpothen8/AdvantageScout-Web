<script>

    import {autoGameData, autoStack} from "./stores";

    // $: $autoGameData["mobility"], $autoStack.push((JSON.parse(JSON.stringify($autoGameData))))

</script>

<div class="form-control">
    <label class="cursor-pointer label w-12 flex flex-col content-center">
        <span class="label-text text-sm xl:text-lg">Mobility</span>
        <input type="checkbox" class="checkbox checkbox-lg checkbox-primary" bind:checked={$autoGameData["mobility"]}/>
    </label>
</div>