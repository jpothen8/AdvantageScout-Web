<script>
    import {fade} from "svelte/transition";
    import QrCode from "svelte-qrcode"
    import GamePieceCombo from "./GamePieceCombo.svelte";
    import {autoGameData, generalGameData, postGameData, teleGameData} from "./stores";
    let show = true;
    if($autoGameData["startingLocation"] === "Select Starting Location"){
        $autoGameData["startingLocation"] = "None"
    }

    let qrString = `${Object.values($generalGameData).join(',') + "," + Object.values($autoGameData).join(',') + "," + Object.values($teleGameData).join(',') + "," + Object.values($postGameData).join(',')}`
    console.log(qrString)


    setTimeout(() => { show = false; }, 1500);

    if (!navigator.clipboard){
        document.execCommand('copy');
    } else{
        navigator.clipboard.writeText(qrString)
    }
</script>

{#if show}
<div class="alert alert-info shadow-lg absolute" in:fade out:fade>
    <div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current flex-shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>Copied CSV to Clipboard</span>
    </div>
</div>
{/if}

<div class=" w-full flex items-center justify-center h-screen w-screen">
    <QrCode  color="#006daa" size="800" background="#14110F" errorCorrection="Q" value={qrString} />
</div>



<div class="fixed bottom-0 w-full flex justify-center z-10">
    <GamePieceCombo type="qr" class="mx-auto"/>
</div>

