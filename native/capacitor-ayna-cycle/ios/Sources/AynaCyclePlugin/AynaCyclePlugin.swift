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
@objc(AynaCyclePlugin)
public class AynaCyclePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AynaCyclePlugin"
    public let jsName = "AynaCycle"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
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

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable(), let type = flowType else {
            call.reject("not_supported")
            return
        }
        store.requestAuthorization(toShare: nil, read: [type]) { _, error in
            DispatchQueue.main.async {
                if let error = error {
                    call.reject(error.localizedDescription, nil, error)
                } else {
                    // `success` only means the sheet was handled, not that reading is allowed.
                    call.resolve(["asked": true, "granted": NSNull()])
                }
            }
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
