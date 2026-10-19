package co.aynahealth.cycle

import android.util.Log
import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.MenstruationFlowRecord
import androidx.health.connect.client.records.MenstruationPeriodRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.temporal.ChronoUnit
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

/**
 * Reads period days from Health Connect (MenstruationFlowRecord and
 * MenstruationPeriodRecord) and returns one row per local day with the
 * heaviest flow logged. Read-only; ayna never writes to Health Connect.
 */
@CapacitorPlugin(name = "AynaCycle")
class AynaCyclePlugin : Plugin() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val contract = PermissionController.createRequestPermissionResultContract()
    private val permissions = setOf(
        HealthPermission.getReadPermission(MenstruationFlowRecord::class),
        HealthPermission.getReadPermission(MenstruationPeriodRecord::class),
    )

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        scope.cancel()
    }

    private fun client(): HealthConnectClient? =
        if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) HealthConnectClient.getOrCreate(context) else null

    private fun PluginCall.launchSafely(block: suspend PluginCall.() -> Unit) {
        val call = this
        scope.launch {
            try {
                call.block()
            } catch (e: CancellationException) {
                throw e
            } catch (e: Throwable) {
                Log.e(TAG, "Health Connect call failed")
                call.reject("health_connect_failed")
            }
        }
    }

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val status = HealthConnectClient.getSdkStatus(context)
        val out = JSObject()
        out.put("available", status == HealthConnectClient.SDK_AVAILABLE)
        when (status) {
            HealthConnectClient.SDK_UNAVAILABLE -> out.put("reason", "not_installed")
            HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> out.put("reason", "update_required")
        }
        call.resolve(out)
    }

    @PluginMethod
    fun requestAuthorization(call: PluginCall) {
        call.launchSafely {
            val c = client() ?: run { reject("not_installed"); return@launchSafely }
            val granted = c.permissionController.getGrantedPermissions()
            if (granted.containsAll(permissions)) {
                resolve(JSObject().put("asked", false).put("granted", true))
                return@launchSafely
            }
            startActivityForResult(this, contract.createIntent(context, permissions), "onPermissionResult")
        }
    }

    @ActivityCallback
    private fun onPermissionResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        call.launchSafely {
            val c = client() ?: run { reject("not_installed"); return@launchSafely }
            val granted = c.permissionController.getGrantedPermissions().containsAll(permissions)
            resolve(JSObject().put("asked", true).put("granted", granted))
        }
    }

    @PluginMethod
    fun readFlowDays(call: PluginCall) {
        val days = (call.getInt("days") ?: 90).coerceIn(1, 365).toLong()
        call.launchSafely {
            val c = client() ?: run { reject("not_installed"); return@launchSafely }
            if (!c.permissionController.getGrantedPermissions().containsAll(permissions)) {
                resolve(JSObject().put("days", JSArray()))
                return@launchSafely
            }
            val end = Instant.now()
            val start = end.minus(days, ChronoUnit.DAYS)
            val zone = ZoneId.systemDefault()
            val byDay = sortedMapOf<String, Pair<Int, String>>()
            fun keep(day: LocalDate, level: Int, source: String) {
                val key = day.toString()
                val existing = byDay[key]
                if (existing == null || existing.first < level) byDay[key] = Pair(level, source)
            }

            var token: String? = null
            do {
                val page = c.readRecords(ReadRecordsRequest(MenstruationFlowRecord::class, TimeRangeFilter.between(start, end), pageToken = token))
                for (r in page.records) {
                    val day = r.time.atZone(r.zoneOffset ?: zone.rules.getOffset(r.time)).toLocalDate()
                    keep(day, flowLevel(r.flow), r.metadata.dataOrigin.packageName)
                }
                token = page.pageToken
            } while (!token.isNullOrEmpty())

            // A logged period range with no flow record still counts as period days ("unspecified").
            token = null
            do {
                val page = c.readRecords(ReadRecordsRequest(MenstruationPeriodRecord::class, TimeRangeFilter.between(start, end), pageToken = token))
                for (r in page.records) {
                    var d = r.startTime.atZone(r.startZoneOffset ?: zone.rules.getOffset(r.startTime)).toLocalDate()
                    val last = r.endTime.atZone(r.endZoneOffset ?: zone.rules.getOffset(r.endTime)).toLocalDate()
                    var guard = 0
                    while (!d.isAfter(last) && guard < 15) {
                        keep(d, 1, r.metadata.dataOrigin.packageName)
                        d = d.plusDays(1)
                        guard++
                    }
                }
                token = page.pageToken
            } while (!token.isNullOrEmpty())

            val rows = JSArray()
            for ((day, v) in byDay) rows.put(JSObject().put("day", day).put("value", v.first).put("sourceId", v.second))
            resolve(JSObject().put("days", rows))
        }
    }

    private fun flowLevel(flow: Int): Int = when (flow) {
        MenstruationFlowRecord.FLOW_LIGHT -> 2
        MenstruationFlowRecord.FLOW_MEDIUM -> 3
        MenstruationFlowRecord.FLOW_HEAVY -> 4
        else -> 1
    }

    companion object {
        private const val TAG = "AynaCycle"
    }
}
