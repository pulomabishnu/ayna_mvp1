import Foundation
import Capacitor
import StoreKit
import UIKit

/// StoreKit 2 for ayna Pro (Apple in-app purchase, App Review 3.1.1, Nov 25 2026).
///
/// - products: price and intro offer for each Pro product, in her own App Store currency.
/// - purchase: Apple's purchase sheet. Her ayna account id goes in as appAccountToken so the
///   server can tie the subscription to her account. Returns Apple's signed transaction (JWS);
///   the app sends it to /api/pro, which verifies it with Apple's certificate chain.
/// - finish: called after the server has saved it (a purchase is only finished once ayna has it).
/// - currentEntitlements / restore: her active Pro subscription(s), for "Restore purchases".
/// - Transaction.updates (renewals, Ask to Buy approvals, purchases made on another device) are
///   sent to the app as "transaction" events.
/// - storefront: App Store country (alpha-3), moved here from the Health Records plugin.
@objc(AynaStorePlugin)
public class AynaStorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AynaStorePlugin"
    public let jsName = "AynaStore"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "storefront", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "currentEntitlements", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finish", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "manageSubscriptions", returnType: CAPPluginReturnPromise)
    ]

    private var updates: Task<Void, Never>?

    override public func load() {
        updates = Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard let self = self, case .verified(let t) = result else { continue }
                self.notifyListeners("transaction", data: Self.signed(result.jwsRepresentation, t), retainUntilConsumed: true)
            }
        }
    }

    deinit { updates?.cancel() }

    private static func signed(_ jws: String, _ t: Transaction) -> [String: Any] {
        return ["jws": jws, "productId": t.productID, "transactionId": String(t.id), "originalTransactionId": String(t.originalID)]
    }

    private static func unit(_ u: Product.SubscriptionPeriod.Unit) -> String {
        switch u {
        case .day: return "day"
        case .week: return "week"
        case .month: return "month"
        case .year: return "year"
        @unknown default: return "other"
        }
    }

    private static func mode(_ m: Product.SubscriptionOffer.PaymentMode) -> String {
        switch m {
        case .freeTrial: return "freeTrial"
        case .payAsYouGo: return "payAsYouGo"
        case .payUpFront: return "payUpFront"
        default: return "other"
        }
    }

    @objc func storefront(_ call: CAPPluginCall) {
        Task {
            let code: String? = await Storefront.current?.countryCode
            if let code = code { call.resolve(["countryCode": code]) } else { call.resolve(["countryCode": NSNull()]) }
        }
    }

    @objc func products(_ call: CAPPluginCall) {
        let ids = (call.getArray("ids", String.self) ?? [])
        Task {
            do {
                let found = try await Product.products(for: ids)
                var out: [[String: Any]] = []
                for p in found {
                    var row: [String: Any] = [
                        "id": p.id, "displayName": p.displayName, "description": p.description,
                        "displayPrice": p.displayPrice, "price": NSDecimalNumber(decimal: p.price).doubleValue,
                        "periodUnit": NSNull(), "periodValue": NSNull(), "introOffer": NSNull(), "introEligible": false
                    ]
                    if let sub = p.subscription {
                        row["periodUnit"] = Self.unit(sub.subscriptionPeriod.unit)
                        row["periodValue"] = sub.subscriptionPeriod.value
                        row["introEligible"] = await sub.isEligibleForIntroOffer
                        if let intro = sub.introductoryOffer {
                            row["introOffer"] = [
                                "displayPrice": intro.displayPrice, "paymentMode": Self.mode(intro.paymentMode),
                                "periodUnit": Self.unit(intro.period.unit), "periodValue": intro.period.value, "periodCount": intro.periodCount
                            ]
                        }
                    }
                    out.append(row)
                }
                call.resolve(["products": out])
            } catch {
                call.reject("products_unavailable", nil, error)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else { call.reject("missing_id"); return }
        let token = call.getString("appAccountToken").flatMap { UUID(uuidString: $0) }
        Task {
            do {
                guard let product = try await Product.products(for: [id]).first else { call.reject("product_not_found"); return }
                var options: Set<Product.PurchaseOption> = []
                if let token = token { options.insert(.appAccountToken(token)) }
                let result = try await product.purchase(options: options)
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let t):
                        var data = Self.signed(verification.jwsRepresentation, t)
                        data["status"] = "success"
                        call.resolve(data)
                    case .unverified(_, let err):
                        call.reject("unverified", nil, err)
                    }
                case .pending:
                    call.resolve(["status": "pending"])
                case .userCancelled:
                    call.resolve(["status": "cancelled"])
                @unknown default:
                    call.resolve(["status": "cancelled"])
                }
            } catch {
                call.reject("purchase_failed", nil, error)
            }
        }
    }

    private func entitlements() async -> [[String: Any]] {
        var out: [[String: Any]] = []
        for await result in Transaction.currentEntitlements {
            if case .verified(let t) = result { out.append(Self.signed(result.jwsRepresentation, t)) }
        }
        return out
    }

    @objc func currentEntitlements(_ call: CAPPluginCall) {
        Task { call.resolve(["transactions": await entitlements()]) }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            do { try await AppStore.sync() } catch {
                // Cancelling the Apple ID prompt still lets us read what's already on the device.
            }
            call.resolve(["transactions": await entitlements()])
        }
    }

    @objc func finish(_ call: CAPPluginCall) {
        guard let id = call.getString("transactionId") else { call.reject("missing_id"); return }
        Task {
            var done = false
            for await result in Transaction.unfinished {
                if case .verified(let t) = result, String(t.id) == id { await t.finish(); done = true }
            }
            call.resolve(["finished": done])
        }
    }

    @objc func manageSubscriptions(_ call: CAPPluginCall) {
        Task { @MainActor in
            guard let scene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene
                ?? UIApplication.shared.connectedScenes.first as? UIWindowScene else {
                call.reject("no_window"); return
            }
            do { try await AppStore.showManageSubscriptions(in: scene); call.resolve() }
            catch { call.reject("manage_failed", nil, error) }
        }
    }
}
