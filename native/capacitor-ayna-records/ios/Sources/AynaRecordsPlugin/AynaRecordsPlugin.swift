import Foundation
import Capacitor
import HealthKit

/// Reads Apple Health Records (HKClinicalRecord) for three types only:
/// allergies, conditions and medications. Returns each record's FHIR JSON so
/// the app can show it to her for review. Read-only (clinical records can't
/// be written by any app). Nothing here sends data off the phone.
///
/// Needs the Clinical Health Records capability
/// (com.apple.developer.healthkit.access = ["health-records"]) and
/// NSHealthClinicalHealthRecordsShareUsageDescription in Info.plist.
/// Apple shows clinical types on their own permission sheet and, as with all
/// HealthKit reads, never tells the app whether access was granted.
@objc(AynaRecordsPlugin)
public class AynaRecordsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AynaRecordsPlugin"
    public let jsName = "AynaRecords"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "readRecords", returnType: CAPPluginReturnPromise)
    ]

    private let store = HKHealthStore()

    private static let identifiers: [String: HKClinicalTypeIdentifier] = [
        "allergy": .allergyRecord,
        "condition": .conditionRecord,
        "medication": .medicationRecord
    ]

    private func types(_ call: CAPPluginCall) -> [(String, HKClinicalType)] {
        let wanted = (call.getArray("types", String.self) ?? []).filter { AynaRecordsPlugin.identifiers[$0] != nil }
        return Array(Set(wanted)).sorted().compactMap { name in
            guard let id = AynaRecordsPlugin.identifiers[name], let t = HKObjectType.clinicalType(forIdentifier: id) else { return nil }
            return (name, t)
        }
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["available": false, "reason": "not_supported"]); return
        }
        if store.supportsHealthRecords() {
            call.resolve(["available": true])
        } else {
            call.resolve(["available": false, "reason": "records_not_supported"])
        }
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        let wanted = types(call)
        guard HKHealthStore.isHealthDataAvailable(), store.supportsHealthRecords() else { call.reject("not_supported"); return }
        guard !wanted.isEmpty else { call.reject("no_types"); return }
        store.requestAuthorization(toShare: nil, read: Set(wanted.map { $0.1 })) { _, error in
            DispatchQueue.main.async {
                if let error = error { call.reject(error.localizedDescription, nil, error) }
                else { call.resolve(["asked": true, "granted": NSNull()]) }
            }
        }
    }

    @objc func readRecords(_ call: CAPPluginCall) {
        let wanted = types(call)
        guard HKHealthStore.isHealthDataAvailable(), store.supportsHealthRecords() else { call.reject("not_supported"); return }
        guard !wanted.isEmpty else { call.resolve(["records": []]); return }

        let group = DispatchGroup()
        let lock = NSLock()
        var out: [[String: Any]] = []
        for (name, type) in wanted {
            group.enter()
            let query = HKSampleQuery(sampleType: type, predicate: nil, limit: 500, sortDescriptors: nil) { _, samples, _ in
                // An error here usually means access was denied; treat as no records.
                var rows: [[String: Any]] = []
                for case let record as HKClinicalRecord in samples ?? [] {
                    guard let fhir = record.fhirResource, let json = String(data: fhir.data, encoding: .utf8) else { continue }
                    var version = ""
                    if #available(iOS 14.0, *) { version = fhir.fhirVersion.stringRepresentation }
                    rows.append([
                        "type": name,
                        "resourceType": fhir.resourceType.rawValue,
                        "fhirVersion": version,
                        "json": json,
                        "sourceName": record.sourceRevision.source.name
                    ])
                }
                lock.lock(); out.append(contentsOf: rows); lock.unlock()
                group.leave()
            }
            store.execute(query)
        }
        group.notify(queue: .main) { call.resolve(["records": out]) }
    }
}
