<script>
    import {autoGameData} from "./stores";
    let input = "Select Starting Location"

    function changeInput() {
        $autoGameData["startingLocation"] = input
    }
</script>


<select class="select select-primary w-64 xl:w-80 text-base xl:text-lg" bind:value={input} on:change={changeInput}>
    <option disabled selected>Select Starting Location</option>
    <option>Long Side</option>
    <option>Center</option>
    <option>Short Side</option>
</select>