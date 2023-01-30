<script>
    import {autoGameData, autoStack, gameStage, liveGamepiece, teleGameData, teleStack} from "./stores";

    export let type = "Success"
    export let height = 0;
    let heightConvert = ["hybrid", "mid", "high"];
    let dicString = heightConvert[height] + $liveGamepiece + type;
    let cubeString = heightConvert[height] + "Cube" + type;
    let coneString = heightConvert[height] + "Cone" + type;


    if($autoStack.length !== 1){
        if($autoStack[$autoStack.length - 1] !== $autoGameData){
            $autoStack.push($autoGameData)
        }
        console.log($autoStack.length)
    }
    else{
        $autoStack.push($autoGameData)
    }

    function pressed(){
        dicString = heightConvert[height] + $liveGamepiece + type;
        if($gameStage === 1){
            $autoGameData[dicString] += 1;
        }
        else if($gameStage === 2){
            $teleGameData[dicString] += 1;
        }
        if($gameStage === 1){
            if($autoStack.length !== 1){
                if($autoStack[$autoStack.length - 1] !== $autoGameData){
                    $autoStack.push($autoGameData)
                }
            }
            else{
                $autoStack.push($autoGameData)
            }
        }
        if($gameStage === 2){
            if($teleStack.length !== 1){
                if($teleStack[$teleStack.length - 1] !== $teleGameData){
                    $teleStack.push($teleGameData)
                }
            }
            else{
                $teleStack.push($teleGameData)
            }
        }
    }
</script>

<div class="indicator">
    <span class="indicator-item badge badge-warning text-xl xl:w-12 xl:h-8 xl:text-2xl"
    >{($gameStage === 1) ? $autoGameData[cubeString] : $teleGameData[cubeString]}</span
    >
    <span class="indicator-item indicator-start badge badge-secondary text-xl xl:w-12 xl:h-8 xl:text-2xl"
    >{($gameStage === 1) ? $autoGameData[coneString] : $teleGameData[coneString]}</span
    >
    <button
            class="btn btn-square btn-outline rounded-md w-24 h-24 xl:w-36 xl:h-36"
            on:click={pressed}
    >
        {#if type === "Success"}
            <svg
                    fill="#1bbb43"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#1bbb43"
            ><g id="SVGRepo_bgCarrier" stroke-width="0" /><g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
            /><g id="SVGRepo_iconCarrier">
                <polygon
                        fill-rule="evenodd"
                        points="9.707 14.293 19 5 20.414 6.414 9.707 17.121 4 11.414 5.414 10"
                />
            </g></svg
            >
        {:else}
            <svg
                    fill="#e31c1c"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    id="cross"
                    class="icon glyph"
                    stroke="#e31c1c"
            ><g id="SVGRepo_bgCarrier" stroke-width="0" /><g
                    id="SVGRepo_tracerCarrier"
                    stroke-linecap="round"
                    stroke-linejoin="round"
            /><g id="SVGRepo_iconCarrier"
            ><path
                    d="M13.41,12l6.3-6.29a1,1,0,1,0-1.42-1.42L12,10.59,5.71,4.29A1,1,0,0,0,4.29,5.71L10.59,12l-6.3,6.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0L12,13.41l6.29,6.3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42Z"
            /></g
            ></svg
            >
        {/if}
    </button>
</div>