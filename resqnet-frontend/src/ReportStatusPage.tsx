import ReportConfirmation from "./ReportConfirmation"
import { useReportUpdates } from "./ReportUpdatesProvider"

export default function ReportStatusPage({ reportId, onBack }: { reportId: string; onBack: () => void }) {
  const { reports, loading, error } = useReportUpdates()
  const report = reports.find(item => item.id === reportId)
  if (report) return <ReportConfirmation report={report} mode="status" onDone={onBack} />
  return (
    <main className="dashboard report-page flex-1 px-5 py-10 sm:px-10">
      <section className="card mx-auto max-w-2xl rounded-3xl p-7 sm:p-10">
        <h1 className="font-brand text-3xl font-medium tracking-tight">Your report</h1>
        <p role={error ? "alert" : "status"} className="mt-4 text-sm leading-relaxed text-mute">{loading ? "Loading the latest report details…" : error ? `${error} We’ll keep trying to refresh your reports.` : "This report isn’t available in this account’s latest 50 reports. Check My reports for the records available to you."}</p>
        <button type="button" onClick={onBack} className="primary-button mt-6 rounded-full px-6 py-3 text-sm font-medium text-white">Back to my reports</button>
      </section>
    </main>
  )
}
