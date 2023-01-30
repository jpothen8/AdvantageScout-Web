<script>
    import {postGameData} from "./stores";

    export let name = "Empty_Name";

    let nameConverter = {
        "Defense Duration": "defenseDuration",
        "Rec. Defense Duration": "recDefenseDuration"
    }

    let realName = nameConverter[name];

</script>

<div class="flex flex-col items-center justify-center">

<div class="text-3xl mt-2">
    {name}
</div>
<div class="w-64 mt-2">
<input type="range" min="0" max="100" class="range range-primary" step="25" bind:value={$postGameData[realName]}/>
<div class="w-[270px] flex justify-between text-s px-2">
    <span>0%</span>
    <span>25%</span>
    <span>50%</span>
    <span>75%</span>
    <span>100%</span>
</div>
</div>

</div>