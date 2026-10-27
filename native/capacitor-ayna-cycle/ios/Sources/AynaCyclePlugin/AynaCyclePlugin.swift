import Foundation
import Capacitor
import HealthKit

/// Reads period days (HKCategoryTypeIdentifier.menstrualFlow) and returns one
/// row per local calendar day with the heaviest flow logged that day.
/// Read-only: ayna never writes to Apple Health.
///
/// Apple never tells an app whether READ access was granted, so
/// requestAuthorization resolves `granted: null` and an empty read can mean
/// "denied" or "nothing logged". The JS side says exactly that to the person.
///
/// ONE permission sheet (Oct 26 focus group: "it kept asking", "it never asked
/// for my period data"). Before, @capgo/capacitor-health showed a sheet for
/// sleep / temperature / heart / activity and then this plugin showed a second
/// sheet with period data only. Now `requestAuthorization` can take every read
/// type at once (`readTypes`, the @capgo names src/health/native.js already
/// uses) plus menstrual flow (`includeFlow`), so iOS shows a single sheet that
/// lists Menstruation next to the rest. When @capgo asks for the same types
/// afterwards, iOS has already answered them and shows nothing.
/// `getRequestStatus` asks HealthKit whether a sheet WOULD appear
/// (getRequestStatusForAuthorization): "unnecessary" means she has already
/// answered for every type, so the app must not ask again. It never reveals
/// whether reading was allowed. Read-only throughout: toShare is always empty.
@objc(AynaCyclePlugin)
public class AynaCyclePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AynaCyclePlugin"
    public let jsName = "AynaCycle"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getRequestStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readFlowDays", returnType: CAPPluginReturnPromise)
    ]

    private let store = HKHealthStore()

    private var flowType: HKCategoryType? {
        HKObjectType.categoryType(forIdentifier: .menstrualFlow)
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        if HKHealthStore.isHealthDataAvailable() && flowType != nil {
            call.resolve(["available": true])
        } else {
            call.resolve(["available": false, "reason": "not_supported"])
        }
    }

    /// @capgo/capacitor-health type names -> HealthKit read types. Same
    /// identifiers @capgo uses (Health.swift, HealthDataType), so its own
    /// later request covers nothing new. Unknown names are ignored (logged).
    private func readTypes(_ names: [String], includeFlow: Bool) -> Set<HKObjectType> {
        var set = Set<HKObjectType>()
        if includeFlow, let flow = flowType { set.insert(flow) }
        for name in names {
            switch name {
            case "sleep":
                if let t = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) { set.insert(t) }
            case "basalBodyTemperature":
                if let t = HKObjectType.quantityType(forIdentifier: .basalBodyTemperature) { set.insert(t) }
            case "appleSleepingWristTemperature":
                if #available(iOS 16.0, *), let t = HKObjectType.quantityType(forIdentifier: .appleSleepingWristTemperature) { set.insert(t) }
            case "restingHeartRate":
                if let t = HKObjectType.quantityType(forIdentifier: .restingHeartRate) { set.insert(t) }
            case "heartRate":
                if let t = HKObjectType.quantityType(forIdentifier: .heartRate) { set.insert(t) }
            case "heartRateVariability":
                if let t = HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN) { set.insert(t) }
            case "steps":
                if let t = HKObjectType.quantityType(forIdentifier: .stepCount) { set.insert(t) }
            case "calories":
                if let t = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) { set.insert(t) }
            case "workouts":
                set.insert(HKObjectType.workoutType())
            default:
                // Cervical mucus, sexual activity, ovulation tests: ayna reads
                // none of them today, so they are never asked for.
                print("[AynaCycle] ignoring unknown read type \(name)")
            }
        }
        return set
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable(), flowType != nil else {
            call.reject("not_supported")
            return
        }
        // Old JS sent no options: period data only, as before.
        let names = call.getArray("readTypes", String.self) ?? []
        let includeFlow = call.getBool("includeFlow") ?? true
        let types = readTypes(names, includeFlow: includeFlow)
        if types.isEmpty {
            call.resolve(["asked": false, "granted": NSNull()])
            return
        }
        store.requestAuthorization(toShare: nil, read: types) { _, error in
            DispatchQueue.main.async {
                if let error = error {
                    call.reject(error.localizedDescription, nil, error)
                } else {
                    // `success` only means the sheet was handled, not that reading is allowed.
                    call.resolve(["asked": true, "granted": NSNull(), "types": types.count])
                }
            }
        }
    }

    /// "shouldRequest": a sheet would appear (some type never asked).
    /// "unnecessary": she has answered for every type; do not ask again.
    /// "unknown": HealthKit could not tell. Never says whether reads are allowed.
    @objc func getRequestStatus(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable(), flowType != nil else {
            call.resolve(["status": "unknown"])
            return
        }
        let names = call.getArray("readTypes", String.self) ?? []
        let types = readTypes(names, includeFlow: call.getBool("includeFlow") ?? true)
        if types.isEmpty {
            call.resolve(["status": "unnecessary"])
            return
        }
        store.getRequestStatusForAuthorization(toShare: [], read: types) { status, _ in
            let text: String
            switch status {
            case .shouldRequest: text = "shouldRequest"
            case .unnecessary: text = "unnecessary"
            default: text = "unknown"
            }
            DispatchQueue.main.async { call.resolve(["status": text]) }
        }
    }

    @objc func readFlowDays(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable(), let type = flowType else {
            call.reject("not_supported")
            return
        }
        let days = max(1, min(call.getInt("days") ?? 90, 365))
        let end = Date()
        guard let start = Calendar.current.date(byAdding: .day, value: -days, to: end) else {
            call.reject("bad_range")
            return
        }
        let predicate = HKQuery.predicateForSamples(withStart: start, end: end, options: [])
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        let query = HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sort]) { _, samples, error in
            if let error = error {
                DispatchQueue.main.async { call.reject(error.localizedDescription, nil, error) }
                return
            }
            let formatter = DateFormatter()
            formatter.calendar = Calendar(identifier: .gregorian)
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.timeZone = TimeZone.current
            formatter.dateFormat = "yyyy-MM-dd"

            var byDay: [String: (value: Int, source: String)] = [:]
            for case let sample as HKCategorySample in samples ?? [] {
                let level = AynaCyclePlugin.level(for: sample.value)
                let day = formatter.string(from: sample.startDate)
                let source = sample.sourceRevision.source.bundleIdentifier
                if let existing = byDay[day], existing.value >= level { continue }
                byDay[day] = (level, source)
            }
            let rows: [[String: Any]] = byDay.keys.sorted().map { day in
                let entry = byDay[day]!
                return ["day": day, "value": entry.value, "sourceId": entry.source]
            }
            DispatchQueue.main.async { call.resolve(["days": rows]) }
        }
        store.execute(query)
    }

    /// HKCategoryValueVaginalBleeding (formerly menstrual flow): unspecified 1, light 2, medium 3, heavy 4, none 5.
    /// ayna's scale: none 0, unspecified 1, light 2, medium 3, heavy 4.
    static func level(for raw: Int) -> Int {
        switch raw {
        case 2: return 2
        case 3: return 3
        case 4: return 4
        case 5: return 0
        default: return 1
        }
    }
}
