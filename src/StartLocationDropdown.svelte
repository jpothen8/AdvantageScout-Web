<script>
    import {autoGameData, autoStack} from "./stores";
    let input = "Select Starting Location"

    function changeInput() {
        $autoGameData["startingLocation"] = input
        console.log($autoGameData["startingLocation"])
        $autoStack.push((JSON.parse(JSON.stringify($autoGameData))))
        console.log($autoStack)
    }

    $: $autoGameData["startingLocation"], input = $autoGameData["startingLocation"]
</script>


<select class="select select-primary w-64 xl:w-80 text-base xl:text-lg" bind:value={input} on:change={changeInput}>
    <option disabled selected>Select Starting Location</option>
    <option>Long Side</option>
    <option>Center</option>
    <option>Short Side</option>
</select>