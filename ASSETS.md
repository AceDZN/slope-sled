# Slope Sled — 3D assets

All models come from Tripo Studio (studio.tripo3d.ai), used through the user's signed-in Chrome session on 2026-10-30. No API tokens were used and no credits were bought.

## Budget used

- **New generations: 7 of 8.** Kid, dog, sled v1, hut, rock, pylon, sled v2. Sled v1 is kept in `assets-src` only and is not shipped.
- **Rig/animation jobs: 3 of 3.**
  1. Kid humanoid rig, plus 4 preset retargets.
  2. Dog "Other" (quadruped) rig, plus 1 preset retarget.
  3. One AI-animation attempt for the dog's run (wasted, see the dog section).
- **Library reuse: 1 model.** The pine is a community gallery model; its GLB export cost 5 credits.

The credit balance is shared with two other game crews who were generating at the same time. Balance deltas are therefore only reliable where they were read just before and after a click.

- Session start: 4075.
- Session end: 3230.

Typical costs read from the UI:

| Action | Cost (credits) |
| --- | --- |
| HD text-to-3D generation (H3.1) | 30 |
| Auto Rig | 20 |
| AI animation | 20 |
| Gallery model export | 5 |
| Preset retarget (`fall`, `sit`) | 0 by direct before/after reading |
| Own-model export | No clear cost seen |

For `idle` and `cheer`, the balance dropped 60 around each click. That drop was probably other crews' generations.

Generation settings for every new model:

- Text prompt
- HD Model, AI model "H3.1 – Best Quality"
- Texture on, 2K, PBR on, Remove Lighting on
- Triangle topology, polycount 20000
- Privacy: Private

## Processing (all files)

Raw downloads are in `assets-src/tripo/<name>_raw.glb`. Optimized files are in `public/models/<name>.glb`. Every file was processed with this command:

```
npx -y @gltf-transform/cli optimize assets-src/tripo/<name>_raw.glb public/models/<name>.glb \
  --compress false --simplify false --texture-compress webp --texture-size 1024
```

The tool is @gltf-transform/cli 4.5.1. `--compress false` and `--simplify false` are deliberate:

- With the default (meshopt + quantization), the skinned kid's bounding box came out wrong (doubled to ±1 on every axis).
- Meshopt would also require `MeshoptDecoder` in three.js.

The outputs therefore need no decoder; plain `GLTFLoader` loads them. Textures are 1024² WebP (`EXT_texture_webp`). The static props also carry `KHR_materials_volume` from Tripo, which is harmless in three.js.

All models are Y-up, sit on y = 0, and are about 1 unit at their largest dimension (Tripo normalizes). Scale them in code.

| File | Raw bytes | Optimized bytes | sha256 (optimized) |
| --- | ---: | ---: | --- |
| sledder.glb | 3,507,144 | 1,542,540 | 1195e7eed1a56e4c07005aee82bbc04699f85628c672607d9392afbb913071b7 |
| dog.glb | 2,718,324 | 839,428 | e20d92c8d9d1b8590ab49fe8dc9430c763173c8035d67fbb04a31012265a90e5 |
| sled.glb | 2,778,856 | 581,820 | 941bbb48675defe222c173b3a685bd074e2836d5ad04a7170679dc53d25a96fd |
| hut.glb | 2,847,932 | 632,896 | 0c326934449ab70a4324404c8e2141ed2de5b69126b5a3b8af09adb1de844499 |
| pine.glb | 932,972 | 307,868 | 74c17ba452b05a77516188f1fefdd044a362a04bbfb238f0fb02d31d84999c7c |
| rock.glb | 1,971,548 | 537,200 | 303f6fc3a62320afb06c4006ea0cb86ef068026011ef9661f25c3e42de3a8711 |
| pylon.glb | 2,954,696 | 675,024 | cabeec868ff5bbce5f52ef10f9d87e6c95c3f4e281a42ec88d604de1e8dcfd7b |
| (sled_v1_raw.glb, not shipped) | 2,149,856 | — | — |

## Per model

### sledder.glb — kid sledder (hero, rigged)

- **Source:** generated.
- **Task:** https://studio.tripo3d.ai/workspace/generate/beab548a-0d08-40ba-9bfe-042245760a5f (the rig and animate pages use the same id under `/workspace/rigging/` and `/workspace/animate/`).
- **Prompt (T-Pose toggle on):** "Stylized cartoon game character, a cheerful 12-year-old kid in winter clothes: bright orange puffy winter jacket, navy snow pants, red knit hat with a white pompom, orange mittens, chunky brown snow boots, rosy cheeks, big friendly eyes. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colors, not realistic. Full body, standing in T-pose, symmetrical, arms straight out, legs slightly apart, front view."
- **Credits:**
  - Generation: 3920 → 3870 (30 was mine; other crews were also generating).
  - Rig: 3630 → 3590 (20 was mine).
- **Rig:** Tripo Auto Rig, Humanoid, skeleton preset **Mixamo**. One skin with 65 joints; the root node is `Armature`.
- **Animations:** Tripo presets, exported together in one GLB with "Animation stay in Place" on. Exact clip names in the GLB:
  - `idle`: 15 s loop
  - `cheer`: 12 s
  - `fall`: 3 s, ends lying on the ground
  - `sit`: 7 s, sits down and stays seated; use it for the riding pose by holding the end frames
- Tripo has no get-up preset.
- Other presets that might be useful later, from the same list: `jump`, `defeat`, `surf`, `wave_goodbye_01`, `standing_relax`, `look_around`.
- **Geometry:** 19,392 triangles. Bind pose is a T-pose.
- **Bounds:** x −0.5..0.5 (arm span), y 0..0.997, z ±0.126. Faces **+Z**, judged from the boot toes; this is Tripo's convention.
- **Look:** matches the brief (orange puffy jacket, red knit hat with a white pompom, orange mitten-hands, brown boots).

### dog.glb — Canaan-style dog (rigged)

- **Source:** generated.
- **Task:** https://studio.tripo3d.ai/workspace/generate/738808b3-5e96-4b4f-b574-a21732adc3e6
- **Prompt:** "Stylized cartoon game character, a fluffy cream-white Canaan dog: medium-sized, athletic, thick fluffy cream and white coat, bushy curled tail, upright triangular pointed ears, wedge-shaped head, black nose, happy friendly expression, red collar. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colors, not realistic. Full body, standing on all four legs in a neutral pose, side three-quarter view."
- **Credits:**
  - Generation: 3870 → 3840.
  - Rig: 3410 → 3390.
  - AI animation: 3390 → 3370.
- **Rig:** Tripo Auto Rig, type "Other" (quadruped). One skin with 36 joints; the root node is `Armature`.
- **Animations:** one clip, `preset:quadruped:walk` (about 2.6 s loop, in place).
  - "Walk" is the only preset Tripo offers for this rig type.
  - The AI-animation run attempt failed. Prompt: "The dog runs forward in a fast, happy, energetic gallop, a seamless looping run cycle.", 5 s, 20 credits. It produced a humanoid "Custom Motion" that cannot be applied to the quadruped rig and was not offered at export.
  - **There is no run, jump or idle clip.** Play `walk` with a higher `timeScale` (about 1.8–2.2) for running. Use the bind pose, or `walk` paused or slowed, for idle.
- **Geometry:** 19,844 triangles.
- **Bounds:** x −0.5..0.5 (body length), y 0..0.809, z ±0.223. **Head points to −X**; walk forward along −X.

### sled.glb — red wooden toboggan

- **Source:** generated (second attempt).
- **Task:** https://studio.tripo3d.ai/workspace/generate/01795341-5ab0-48b6-be99-06d0fd0e5db9
- **Prompt:** "Stylized cartoon game prop: a low, long red wooden toboggan sled seen from the side, a flat bright red slatted wooden deck close to the ground with NO backrest and no chair, two thin curved wooden runners underneath that curl up in a big hook at the front, a rope pull handle tied to the curled front. Long and low silhouette, about three times longer than wide. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colors, not realistic. Empty sled, isolated object."
- **Credits:** 3260 → 3230.
- **Geometry:** 17,706 triangles.
- **Bounds:** x −0.5..0.5 (length), y 0..0.243, z ±0.229. The curled runner tips and rope are at **+X**, which is the sled's front. This is inferred from the geometry, so check it visually.
- **Discarded first attempt:** `assets-src/tripo/sled_v1_raw.glb`.
  - Task: https://studio.tripo3d.ai/workspace/generate/5f540e88-cd7c-4b21-bd62-842de7e06231
  - Credits: 3840 → 3810.
  - Prompt: "Stylized cartoon game prop: a classic red wooden kids' sled for one rider, flat slatted wooden seat painted bright red, two curved wooden runners that curl up at the front, small cross braces, a short rope pull handle at the front. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colors, not realistic. Empty sled, no rider, isolated object, three-quarter view."
  - It came out with a tall chair-like backrest, so it was replaced.

### hut.glb — ski hut / lodge

- **Source:** generated.
- **Task:** https://studio.tripo3d.ai/workspace/generate/abf337b3-d639-4d27-93ed-ac3f7bcb4cd6
- **Prompt:** "Stylized cartoon game building: a cozy small wooden alpine ski hut lodge, warm brown log walls, steep bright red gable roof covered with a thick layer of white snow, snow piled along the eaves, warm glowing yellow windows, wooden front door with a small porch, stone chimney. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colors, not realistic. Isolated building on a small flat snowy base, three-quarter view."
- **Credits:** 3810 → 3780.
- **Look:** log cabin with a red roof, thick snow, glowing windows, stone chimney and a snowy base.
- **Geometry:** 18,902 triangles.
- **Bounds:** about 0.98 × 1.0 (height) × 0.97.

### pine.glb — snowy pine (library reuse)

- **Source:** featured/community gallery search for "snowy pine tree".
- **Model:** "Snowy Pine Tree" by H0wZy: https://studio.tripo3d.ai/3d-model/snowy-pine-tree-with-alternating-snow-covered-and-green-branches-and-a-c2e7542e-bf5c-4156-b802-0af92afef9e5
  - Tripo H3.1 model; the creator's description says it was made for their Roblox games.
  - Original prompt: "snowy pine tree with alternating snow-covered and green branches and a brown trunk".
- **Credits:** exported through the gallery viewer's Export button for 5 credits (4075 → 4040; that delta includes other crews' activity).
- **License/terms:** the model page shows **no license or usage-terms text**. Only creator, tags, prompt and topology are shown. Use falls under Tripo's general Terms of Service for community gallery models. Confirm before any commercial release if that matters.
- **Geometry:** 9,818 triangles.
- **Bounds:** 0.70 × 1.0 (height) × 0.65.

### rock.glb — snow-capped basalt rock

- **Source:** generated.
- **Task:** https://studio.tripo3d.ai/workspace/generate/419381b8-0be5-4775-a21a-89df880e9058
- **Prompt:** "Stylized cartoon game prop: a large chunky boulder of dark charcoal-gray volcanic basalt rock with faceted angular sides, its top covered by a thick rounded cap of bright white snow that drips over the edges. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colors, not realistic. Isolated single rock, three-quarter view."
- **Credits:** 3780 → 3750.
- **Look:** a dark, nearly black rock with two snow ledges.
- **Geometry:** 18,778 triangles.
- **Bounds:** 0.85 × 0.80 (height) × 1.0.

### pylon.glb — cable-car pylon

- **Source:** generated.
- **Task:** https://studio.tripo3d.ai/workspace/generate/48ab0288-1813-4834-a264-6b1bcd010a09
- **Prompt:** "Stylized cartoon game prop: a single tall cable car pylon tower for a mountain gondola lift, one sturdy steel column painted light gray with a red and white top section, a horizontal crossarm at the top with grooved wheel sheaves on both ends, a small maintenance ladder, a concrete footing with a little snow. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth colors, not realistic. Isolated tower only, no cables, no cabins, front three-quarter view."
- **Credits:** 3750 → 3720.
- **Look:** a gray column with a red band and a sheave crossarm. Some thin cable-stub rods stick out sideways at the top, which sets the X extent. Draw the cables procedurally between the sheaves.
- **Geometry:** 18,743 triangles.
- **Bounds:** x ±0.5 (the cable stubs), y 0..0.958, z ±0.279. The crossarm runs along X.
- **Gondola:** not generated (optional). Budget was kept for the sled retry.

## Searched and not used

**Own assets** (studio.tripo3d.ai/assets, about 60 models from earlier crews, mostly Halloween, steampunk, beach and kids). Candidates looked at:

- "cartoon winter character": a kid in a teal parka with goggles. Wrong jacket colour for the hero.
- "polar research hut" and "colorful wooden cabin": not an alpine ski hut.
- "curling stone": not needed.

No pines, snowy rocks, pylons, dogs or sleds were among the own assets.

**Gallery searches** and why each result was skipped:

| Search | Result | Why not used |
| --- | --- | --- |
| "snowy pine tree" | Pine by H0wZy | **Reused** |
| "snowy pine tree" | Snowy cabin by wizzzstk | Brown roof |
| "ski lodge" | Detailed snowy lodge by Dmit | Brown roof, not the red-roof look |
| "ski lodge" | Realistic chairlift tower by xicobahiapinho, https://studio.tripo3d.ai/3d-model/create-a-ski-lift-very-detailed-with-ropes-where-whe-ski-chairs-need-359a93ac-d40b-4a50-bdc2-01509c701356 | 1.9M faces, realistic style |
| "cable car", "gondola lift" | Only cars and industrial lifts | — |
| "wooden sled", "snow sled" | A dark-wood sled by chrissou | Not red |
| "canaan dog" | No cream spitz-type stylized dog | Results were brown cartoon dog, Shih Tzu, labrador, etc. |
| "kid winter" | No stylized kid in an orange jacket | Realistic soldiers, women, dioramas |
| "snowy rock" | Dark volcanic rock chunk, low-poly grey rocks | No snow cap |
