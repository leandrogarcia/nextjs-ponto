import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatDateKey, formatMinutes, weekdayLabel } from "../time";
import { entriesLabel, type AttendanceReport } from "./reports";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica" },
  title: { fontSize: 16, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  meta: { marginBottom: 2, color: "#444" },
  table: { marginTop: 12, borderTopWidth: 1, borderColor: "#ccc" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#eee", paddingVertical: 3 },
  head: { fontFamily: "Helvetica-Bold", backgroundColor: "#f4f4f4" },
  total: { fontFamily: "Helvetica-Bold", borderTopWidth: 1, borderColor: "#999" },
  date: { width: "13%" },
  day: { width: "7%" },
  entries: { width: "44%" },
  num: { width: "12%", textAlign: "right" },
  footer: { marginTop: 12, color: "#888", fontSize: 8 },
});

function ReportDocument({ report }: { report: AttendanceReport }) {
  return (
    <Document title={`Frequência - ${report.user.nome}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório de frequência</Text>
        <Text style={styles.meta}>Funcionário: {report.user.nome} ({report.user.email})</Text>
        <Text style={styles.meta}>
          Período: {formatDateKey(report.inicio)} a {formatDateKey(report.fim)}
        </Text>
        <Text style={styles.meta}>Jornada semanal: {report.horasSemanais} h</Text>
        <View style={styles.table}>
          <View style={[styles.row, styles.head]} fixed>
            <Text style={styles.date}>Data</Text>
            <Text style={styles.day}>Dia</Text>
            <Text style={styles.entries}>Marcações</Text>
            <Text style={styles.num}>Trabalhadas</Text>
            <Text style={styles.num}>Esperadas</Text>
            <Text style={styles.num}>Saldo</Text>
          </View>
          {report.rows.map((r) => (
            <View key={r.dateKey} style={styles.row} wrap={false}>
              <Text style={styles.date}>{formatDateKey(r.dateKey)}</Text>
              <Text style={styles.day}>{weekdayLabel(r.dateKey)}</Text>
              <Text style={styles.entries}>{entriesLabel(r)}</Text>
              <Text style={styles.num}>{formatMinutes(r.workedMinutes)}</Text>
              <Text style={styles.num}>{formatMinutes(r.expectedMinutes)}</Text>
              <Text style={styles.num}>{formatMinutes(r.balanceMinutes, true)}</Text>
            </View>
          ))}
          <View style={[styles.row, styles.total]}>
            <Text style={styles.date}>Total</Text>
            <Text style={styles.day} />
            <Text style={styles.entries} />
            <Text style={styles.num}>{formatMinutes(report.totals.workedMinutes)}</Text>
            <Text style={styles.num}>{formatMinutes(report.totals.expectedMinutes)}</Text>
            <Text style={styles.num}>{formatMinutes(report.totals.balanceMinutes, true)}</Text>
          </View>
        </View>
        <Text style={styles.footer}>
          Gerado em {report.geradoEm.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
        </Text>
      </Page>
    </Document>
  );
}

export function renderReportPdf(report: AttendanceReport) {
  return renderToBuffer(<ReportDocument report={report} />);
}
