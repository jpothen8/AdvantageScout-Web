<script>
    import {gameStage, generalGameData} from "./stores";

    let allianceColor = "blue"
    let timer;


    function changeColor() {
        if($generalGameData["allianceColor"] === "red") {
            $generalGameData["allianceColor"] = "blue"
        } else {
            $generalGameData["allianceColor"] = "red"
        }

    }

    const changeColorDebounce = e => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            if($generalGameData["allianceColor"] === "red") {
                $generalGameData["allianceColor"] = "blue"
            } else {
                $generalGameData["allianceColor"] = "red"
            }
        }, 20);
    }

    function goToAuto() {
        $gameStage = 1
        console.log($gameStage)
    }
</script>

<div class="hero min-h-screen bg-base-200">
    <div class="hero-content flex-col lg:flex-row-reverse">
        <div class="text-center lg:text-left">
            <h1 class="text-5xl font-bold">Advantage Scout</h1>
            <p class="py-6">A mobile-first, easy to use, QR based, scouting application made by FRC 6328</p>
        </div>
        <div class="card flex-shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
            <div class="card-body">
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Your Name</span>
                    </label>
                    <input type="text" placeholder="name" class="input input-bordered" bind:value={$generalGameData['scoutName']}/>
                </div>
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Team #</span>
                    </label>
                    <input type="text" placeholder="team #" class="input input-bordered" bind:value={$generalGameData['teamNum']}/>

                </div>
                <label class="label">
                    <span class="label-text">Alliance Color</span>
                </label>

                {#if $generalGameData["allianceColor"] === "red"}
                <button class="btn btn-error" on:click={changeColorDebounce}>Red</button>
                {:else}
                <button class="btn btn-accent" on:click={changeColorDebounce}>Blue</button>
                {/if}

                <div class="form-control mt-6">
                    <button class="btn btn-primary" on:click = {goToAuto}>Start Scouting</button>
                </div>

            </div>
        </div>
    </div>
</div>