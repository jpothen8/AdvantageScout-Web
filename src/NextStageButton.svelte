<script>
    import {gameStage} from "./stores";

    function nextStage(){
        $gameStage++;
    }
</script>


<div class="flex items-center justify-center ">

    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-16 h-16 flex-no-shrink absolute z-10 fill-base-100 xl:w-28 xl:h-48">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>

<button class="btn btn-outline w-12 h-28 z-50 xl:h-48 xl:w-24" on:click={nextStage}>
</button>


</div>