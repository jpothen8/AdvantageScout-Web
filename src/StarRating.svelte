<script>
    import {postGameData} from "./stores";

    let nameConverter = {
        "Defense Rating": "defenseRating",
        "Driver Rating": "driverRating",
        "Intake Rating": "intakeRating"
    }
    export let name = "Empty_Name";
    let realName = nameConverter[name];
    export let value;
    let group = 0;
</script>

<div class="flex flex-col items-center justify-center">

<div class="text-3xl mt-2">
    {name}
</div>

<div class="rating rating-lg rating-half mt-2">
    <input type="radio" name={name} bind:group = {$postGameData[realName]} class="rating-hidden" checked  value = {0}/>
    <input type="radio" name={name} bind:group = {$postGameData[realName]} class="bg-primary mask mask-star-2 mask-half-1" value = {0.5}/>
    <input type="radio" name={name} bind:group = {$postGameData[realName]} class="bg-primary mask mask-star-2 mask-half-2" value = {1}/>
    <input type="radio" name={name} bind:group = {$postGameData[realName]} class="bg-primary mask mask-star-2 mask-half-1" value = {1.5}/>
    <input type="radio" name={name} bind:group = {$postGameData[realName]} class="bg-primary mask mask-star-2 mask-half-2" value = {2}/>
    <input type="radio" name={name} bind:group = {$postGameData[realName]} class="bg-primary mask mask-star-2 mask-half-1" value = {2.5}/>
    <input type="radio" name={name} bind:group = {$postGameData[realName]} class="bg-primary mask mask-star-2 mask-half-2" value = {3}/>
    <input type="radio" name={name} bind:group = {$postGameData[realName]} class="bg-primary mask mask-star-2 mask-half-1" value = {3.5}/>
    <input type="radio" name={name} bind:group = {$postGameData[realName]} class="bg-primary mask mask-star-2 mask-half-2" value = {4}/>
    <input type="radio" name={name} bind:group = {$postGameData[realName]} class="bg-primary mask mask-star-2 mask-half-1" value = {4.5}/>
    <input type="radio" name={name} bind:group = {$postGameData[realName]} class="bg-primary mask mask-star-2 mask-half-2" value = {5}/>
</div>

</div>