<script>

    import {autoGameData, autoStack, gameStage, postGameData, teleGameData, teleStack} from "./stores";

    function clicked() {
        if($gameStage === 1){
            if($autoStack.length !== 1) {
                $autoGameData = $autoStack.pop()
                console.log($autoGameData)
            }
        }
        if($gameStage === 2){
            if($teleStack.length !== 1) {
                $teleGameData = $teleStack.pop()

            }
        }
    }
</script>

<button class="btn btn-square btn-outline btn-md" on:click={clicked}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>

</button>