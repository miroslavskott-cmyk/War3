# BLACK SAND: WORLD ON THE BRINK

A lightweight, playable mobile FPS prototype built with Three.js. The setting, mission, intelligence crisis, and characters are fictional alternate history.

## What is implemented

- Real-time Three.js/WebGL 3D scene with a desert outpost, perimeter walls, communications facility, watchtower, road, vehicle, props, and distant hills.
- First-person camera, touch movement joystick, right-side drag-look, keyboard movement, sprint, crouch, aim, firing, reload, ammunition and health.
- Hitscan rifle damage, enemy guard states, detection range, approach/fire behavior, simple wall-occlusion checks, defeat states.
- Objective flow: equipment station → facility → data device → hostile contact → extraction; mission complete/fail and restart.
- Procedural 3D cinematic shots with changing compositions, English subtitle cue timings, skip button, title/menu, settings and credits.
- Optional Web Audio generated ambient drone and simple procedural sound effects. These are not a professional voice-over or licensed soundtrack.
- Low/high render pixel ratio options, resize handling, portrait rotate notice, local save marker.

## Important limitations (honest status)

- **The professional male narration is not included.** Subtitle cue timing is implemented. Browser text-to-speech is intentionally not auto-started. Add a licensed voice file as described below to enable spoken narration.
- The opening cinematic uses procedural 3D set pieces and changes camera shots; it is not a fully authored 90-second cinematic film.
- Enemy cover animations, sophisticated pathfinding, ragdoll, and tactical squad behavior are not implemented. Enemy movement and firing are deliberately simple.
- Collisions are approximate and limited to major structures. This is a prototype, not a production shooter.
- Audio is generated procedurally for the prototype; there is no bundled copyrighted music or external sound library.
- Browser/WebGL runtime has not been verified on every Android model. Actual frame rate depends on device, browser, thermals, and GPU.

## Network requirement

`js/main.js` imports **Three.js 0.160.0** from the pinned jsDelivr CDN URL. The browser must download this engine on first load. If the CDN is unavailable, the page will show an initialization error and a retry button; it cannot render 3D without the engine. After it loads, the game environment is generated locally. There are no large mandatory models or textures.

The initial source is small and has no npm, bundler, backend, or account requirement. A 3G connection affects the initial library download time, not the frame rate once downloaded.

## Run on Android

1. Extract `black-sand.zip` on your phone.
2. Upload the contents of the `black-sand` folder to a GitHub repository (the `index.html` must be at the repository root).
3. In GitHub, open **Settings → Pages**. Select **Deploy from a branch**, choose `main` and `/ (root)`, then save.
4. Open the generated GitHub Pages URL in current Chrome. Wait for the boot status to finish.
5. Tap **START EXPERIENCE** to begin audio and the opening cinematic. Tap **SKIP INTRO** to reach the menu.
6. Tap **NEW GAME**. Rotate to landscape if the browser is portrait.

You can also test locally by opening `index.html`, but some Android file viewers block JavaScript modules. GitHub Pages is the recommended test route.

## Controls

- Left virtual stick: move and strafe.
- Drag the right side: look around.
- FIRE: shoot; AIM: zoom; RELOAD: reload; RUN: sprint; CROUCH: toggle crouch.
- INTERACT: use nearby objective object.
- Pause button: pause/resume, restart, settings.
- Keyboard fallback: WASD, Shift to sprint, R reload, E interact, Space fire.

## Audio assets (optional future addition)

Create these files with properly licensed/original audio if you want real audio assets:

- `assets/audio/narration-en.mp3` — adult male English baritone narration, exact script below, with pauses matching the cue sheet in `js/main.js`.
- `assets/audio/music-ambient.ogg` — original/licensed instrumental cinematic drone, no dialogue.
- `assets/audio/rifle-shot.ogg`, `assets/audio/footstep.ogg`, `assets/audio/radio-static.ogg`, `assets/audio/ui-confirm.ogg` — short mono effects.

No audio files above are included or falsely linked. To wire an asset into playback, implement `fetch`/`Audio` loading in `js/main.js`, catch load errors, and keep the procedural effects as fallback. Separate volume sliders are present in Settings; narration and subtitles can be toggled, but the narration toggle has no effect until a voice file is wired.

## Narration script

THE WORLD HAS NEVER BEEN CLOSER TO THE EDGE.

Across the Middle East, alliances are breaking. Old enemies are preparing for a conflict no government is willing to admit has already begun.

September twenty-second, twenty twenty-six.

An Iranian presidential aircraft lands in Algeria for what appears to be a routine technical stop.

Weeks later, classified intelligence suggests that something far more important may have crossed the region: technology capable of changing the balance of power.

Washington sees a strategic threat. Tehran denies the allegations. Algiers finds itself at the center of a storm it never asked for.

Diplomatic pressure becomes economic warfare. Economic warfare becomes military mobilization.

Across the region, governments fracture, streets fill with protesters, and rival powers prepare for consequences they may no longer be able to control.

But the most dangerous secret is not the technology.

It is the identity of the people determined to start a war.

Someone is manipulating intelligence. Someone is moving forces into position. And someone believes a global conflict is the only way to reshape the world.

The first shot has not yet been fired.

But the countdown has already begun.

## Future missions

Add new environment groups and objective objects in `buildWorld()`, extend `updateObjective()` and `interact()` with new mission states, then add a new mission entry point in the menu. Keep each new mission compact and reuse materials/geometry to limit GPU memory. For larger levels, split scene setup into modules and load optional assets only when entering that mission.
