

<script>
    import {postGameData} from "./stores";

    export let name = "Empty_Name";
    export let value;
</script>

<div class="flex flex-col items-center justify-center">

    <div class="text-3xl mt-2">
        Notes
    </div>

    <textarea placeholder="Notes" class="textarea textarea-bordered textarea-primary textarea-lg w-72 h-48 max-w-xs" bind:value={$postGameData["notes"]} ></textarea>


</div>