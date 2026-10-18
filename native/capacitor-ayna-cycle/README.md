# capacitor-ayna-cycle

A tiny read-only Capacitor plugin for period days, because the maintained
`@capgo/capacitor-health` plugin (used for every other metric) has no
menstrual-flow type.

- iOS: `HKCategoryTypeIdentifier.menstrualFlow`
- Android: Health Connect `MenstruationFlowRecord` + `MenstruationPeriodRecord` (`READ_MENSTRUATION`)

Returns one row per local day with the heaviest flow logged:
`{ day: 'YYYY-MM-DD', value: 0-4, sourceId }` (0 none, 1 unspecified, 2 light, 3 medium, 4 heavy).

Installed into the app as `"capacitor-ayna-cycle": "file:native/capacitor-ayna-cycle"`, so
`npx cap sync` wires it into the iOS SPM package and the Android Gradle settings like any
other plugin. **Not yet compiled**: it needs a first build in Xcode and Android Studio.
