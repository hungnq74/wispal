# Wispal Rive Asset Contract

Place the first production pet asset at:

```text
/rive/wispal_pet_v1.riv
```

The runtime expects:

- Artboard: `WispalPet`
- State machine: `WispalPetMachine`
- Boolean inputs: `isStudying`, `isIdleUser`, `isTired`, `isResting`, `isHovered`, `isPointerNear`
- Number inputs: `mood`, `bondTier`, `energy`, `cursorX`, `cursorY`, `roomX`, `targetX`, `targetY`
- Trigger inputs: `tap`, `pet`, `feed`, `dance`, `jump`, `wave`, `celebrate`, `questDone`, `flowHit`, `goalHit`, `restAccepted`, `giftReceived`, `equipChanged`, `roomEnter`

Suggested animation states:

```text
idle, blink, look, study, write, pageTurn, flow, sleepy, tired, rest, jump,
dance, wave, petReact, gift, celebrateSmall, celebrateBig, walk, inspectDecor
```

If the `.riv` file is missing or fails to load, Wispal keeps using the pixel
companion fallback.
