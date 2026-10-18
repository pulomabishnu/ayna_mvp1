// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorAynaCycle",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "CapacitorAynaCycle", targets: ["AynaCyclePlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "AynaCyclePlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/AynaCyclePlugin",
            linkerSettings: [.linkedFramework("HealthKit")])
    ]
)
