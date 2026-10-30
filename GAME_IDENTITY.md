# Slope Sled — מזחלת השיפוע — game identity

## One line

Build a wild sled run on Mount Hermon out of straight lines `y = mx + b`, then hit GO and ride it in full 3D with your dog running beside you.

## The core action (without setting or topic)

Two alternating modes, both real-time 3D:

1. **Build (side view, ~20–60 s).** A glowing coordinate grid hangs over a cut-away side slice of the snowy mountain. Gates, rocks, branches, ice bridges, a rival's trail and the finish hut sit at labeled coordinates. You pick a segment and turn two dials: slope `m` and free term `b`. Only the first 15 % of each new segment is drawn ("fog"), so you compute from the coordinates instead of dragging the line onto the gate.
2. **Ride (chase camera, 5–15 s).** GO swoops the camera from the side view down behind the sledder. The track becomes a ribbon of packed snow along your exact lines. Tuck for a little speed, lean for style, press trick in the air. Negative slope accelerates, zero coasts, positive climbs and bleeds speed. Wrong math is a visible, funny wipeout: slam into a rock, clip a branch, stall halfway up a ramp and slide back, fly off a gap at a joint and bury yourself in a snowbank. A slow-motion replay highlights the offending line with one worked sentence ("at x = 16 your track is at 3, the rock is at 4"), then you're back in build mode in one tap.

The central decision is always a number pair (m, b) or a choice between lines, and the only way to know it is right is to compute it. The fun is the contrast: careful build, then a fast physical ride with a big payoff (snow spray, jump, cheering dog) or a big slapstick crash.

## Different from Splash Arc and the other math games

- Splash Arc edits one parabola's vertex and throws a balloon along it. Slope Sled builds **piecewise straight lines** and **rides them in real time** as a character on a physical sled; joints are intersections of two lines; inequalities are obstacles.
- Not a runner, courier, trick-shot, card duel or scale puzzle. No robot, no toy workshop, no diorama camera.

## Look

- **Place:** Mount Hermon on a bright snow day. Deep blue sky, hard winter sun, long blue shadows on powder, dark pine stands, cable-car pylons with a gondola, a red-roofed wooden ski hut, snow-capped basalt rocks.
- **Build view:** a cinematic side camera (slightly elevated perspective, not flat 2D) looking at a cut-away slice of the slope. The grid is a cyan-white glowing lattice with axis labels; **x grows left → right even though the UI is RTL** (a small "x →" arrow says so). Segment lines glow in segment colors with a numbered tag; the fogged part fades into drifting mist. Constraints are drawn as shaded half-planes (rocks: red-orange region below a dashed boundary; branches/bridges: ice-blue region above).
- **Ride view:** low chase camera behind the sled, slight FOV punch with speed, speed lines, powder spray from the runners, sparkles, the dog sprinting alongside. The grid fades out during the ride and back in for the wipeout replay.
- **Characters:** a rigged kid in a puffy orange jacket and knit hat on a red wooden sled; a rigged fluffy Canaan-style dog. Both animate (idle, ride/run, cheer, fall).
- **Palette:** snow white `#f4f8ff`, shadow blue `#9db8e8`, sky `#2f6fd6`, pine `#1f4d3a`, jacket orange `#ff7a1a`, grid cyan `#7fe7ff`, danger coral `#ff5a4e`, gold stars `#ffc93c`.

## HUD (Hebrew RTL, equations LTR)

- Top bar (right to left): level name and world, stars, hint button (costs a star), pause, mute.
- Right side panel in build mode: one card per segment: segment color + number, live equation `y = −0.5x + 20` in an LTR span, an `m` dial (0.05 steps, with rise/run view) and a `b` stepper (0.5 steps), interval `x ∈ [0, 16]`.
- Bottom: a big **סע!** (GO) button; during the ride: tuck / lean / trick touch buttons, a speedometer and a mini altitude graph.
- Results card: stars, "builds" count, a one-line worked explanation after a fail, retry / next.
- Never color-only: shapes, icons and text accompany every color state.

## First 30 seconds

Level 1 "First drop": you sit on the sled at (0, 20); the lodge is at (40, 0). Three big slope buttons: `−½`, `0`, `+½`. Pick −½, hit סע!, the camera swoops behind you, you rocket down to a powder-spray stop at the lodge and the dog leaps into your lap. Pick 0 and you coast across and stop high above the lodge; pick +½ and the sled refuses to climb and slides back to you.

## Structure

Four worlds (Bunny Hill, Pine Forest, Rock Garden, Twin Trails), 18 authored levels with a transfer level per world and a no-hint final descent; then generated fresh runs per world. Stars by hints and builds; level select is a 3D trail map on the mountain.
