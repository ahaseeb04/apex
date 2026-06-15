import ExcelJS from 'exceljs'
import type { Program } from './api'

const MAX_SHEET_NAME_LENGTH = 31

interface FatigueIndex {
    sleep_quality: number
    cognitive_capacity: number
    general_motivation: number
    motivation_to_train: number
    sense_of_wellbeing: number
    perceived_stress: number
    energy_levels: number
    libido: number
    soreness: number
}

interface WeeklyCheckIn {
    bodyweight: number
    calories: number
    sleep_hours: number
}

function sanitizeSheetName(name: string): string {
    return name.replace(/[:\\\/\*\?\[\]]/g, '-').substring(0, MAX_SHEET_NAME_LENGTH)
}

const exerciseCols = 7

const borderColor = 'FFCBD5E1'
const darkBorderColor = 'FF334155'

const weekHeaderBg = 'FF1E3A5F'
const weekHeaderFont = 'FFFFFFFF'

const dayHeaderBg = 'FF475569'
const dayHeaderFont = 'FFFFFFFF'

const colHeaderBg = 'FF1E293B'
const colHeaderFont = 'FFFFFFFF'

const altRowColor = 'FFF1F5F9'

const weeklySectionBg = 'FF2563EB'

function thinBorder(): Partial<ExcelJS.Borders> {
    return {
        top: { style: 'thin', color: { argb: borderColor } },
        left: { style: 'thin', color: { argb: borderColor } },
        bottom: { style: 'thin', color: { argb: borderColor } },
        right: { style: 'thin', color: { argb: borderColor } },
    }
}

function darkFullBorder(): Partial<ExcelJS.Borders> {
    const b = { style: 'thin' as const, color: { argb: darkBorderColor } }
    return { top: b, left: b, bottom: b, right: b }
}

function styleWeekHeaderRow(row: ExcelJS.Row): void {
    row.height = 26
    row.font = { bold: true, color: { argb: weekHeaderFont }, size: 12, name: 'Calibri' }
    row.alignment = { vertical: 'middle', horizontal: 'left' }
    for (let c = 1; c <= exerciseCols; c++) {
        const cell = row.getCell(c)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: weekHeaderBg } }
        cell.border = {
            top: { style: 'medium', color: { argb: 'FF0F2950' } },
            left: c === 1 ? { style: 'medium', color: { argb: 'FF0F2950' } } : { style: 'hair', color: { argb: weekHeaderBg } },
            bottom: { style: 'medium', color: { argb: 'FF0F2950' } },
            right: c === exerciseCols ? { style: 'medium', color: { argb: 'FF0F2950' } } : { style: 'hair', color: { argb: weekHeaderBg } },
        }
    }
}

function styleDayHeaderRow(row: ExcelJS.Row): void {
    row.height = 22
    row.font = { bold: true, color: { argb: dayHeaderFont }, size: 10, name: 'Calibri' }
    row.alignment = { vertical: 'middle', horizontal: 'left' }
    for (let c = 1; c <= exerciseCols; c++) {
        const cell = row.getCell(c)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dayHeaderBg } }
        cell.border = {
            top: { style: 'thin', color: { argb: 'FF374151' } },
            left: c === 1 ? { style: 'thin', color: { argb: 'FF374151' } } : { style: 'hair', color: { argb: dayHeaderBg } },
            bottom: { style: 'thin', color: { argb: 'FF374151' } },
            right: c === exerciseCols ? { style: 'thin', color: { argb: 'FF374151' } } : { style: 'hair', color: { argb: dayHeaderBg } },
        }
    }
}

function styleColHeaderRow(row: ExcelJS.Row): void {
    row.height = 22
    row.font = { bold: true, color: { argb: colHeaderFont }, size: 10, name: 'Calibri' }
    row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    for (let c = 1; c <= exerciseCols; c++) {
        const cell = row.getCell(c)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colHeaderBg } }
        cell.border = darkFullBorder()
    }
}

function styleDataRow(row: ExcelJS.Row, isAlt: boolean): void {
    row.height = 20
    row.font = { size: 10, name: 'Calibri' }
    row.alignment = { vertical: 'middle' }
    for (let c = 1; c <= exerciseCols; c++) {
        const cell = row.getCell(c)
        cell.border = thinBorder()
        if (isAlt) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: altRowColor } }
        }
    }
}

function styleSectionHeaderRow(row: ExcelJS.Row, colCount: number): void {
    row.height = 24
    row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' }
    row.alignment = { vertical: 'middle', horizontal: 'left' }
    for (let c = 1; c <= colCount; c++) {
        const cell = row.getCell(c)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: weeklySectionBg } }
    }
    for (let c = 1; c <= colCount; c++) {
        const cell = row.getCell(c)
        cell.border = {
            top: { style: 'medium', color: { argb: 'FF1E40AF' } },
            bottom: { style: 'thin', color: { argb: borderColor } },
            right: { style: 'thin', color: { argb: borderColor } },
            left: c === 1 ? { style: 'thin', color: { argb: borderColor } } : undefined,
        }
    }
}

function centerAlign(row: ExcelJS.Row, ...cols: number[]): void {
    for (const c of cols) {
        row.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' }
    }
}

function addExerciseHeader(ws: ExcelJS.Worksheet): void {
    const row = ws.addRow([
        'Exercise',
        'Sets',
        'Reps',
        'Target RPE',
        'Load Range',
        'Actual Load',
        'Actual RPE',
    ])
    styleColHeaderRow(row)
}

const exerciseWidths = [28, 6, 6, 10, 14, 12, 10]
const weeklyWidths = [8, 12, 10, 12, 18, 20, 14, 12, 12, 10, 10, 10, 10, 12]

export async function exportProgramToXlsx(program: Program): Promise<void> {
    const wb = new ExcelJS.Workbook()

    for (const block of program.blocks) {
        const ws = wb.addWorksheet(sanitizeSheetName(block.name))

        const maxCols = Math.max(exerciseCols, weeklyWidths.length)
        ws.columns = Array.from({ length: maxCols }, (_, i) => ({
            width: i < exerciseWidths.length
                ? exerciseWidths[i]
                : i < weeklyWidths.length
                    ? weeklyWidths[i]
                    : 10,
        }))

        for (const week of block.weeks) {
            // Spacer before each week (except the first)
            if (week !== block.weeks[0]) {
                ws.addRow([])
            }

            // Week header
            const weekRow = ws.addRow([`Week ${week.weekNumber}`])
            ws.mergeCells(weekRow.number, 1, weekRow.number, exerciseCols)
            styleWeekHeaderRow(weekRow)

            for (const day of week.days) {
                // Day sub-header
                const dayRow = ws.addRow([`Day ${day.dayNumber}`])
                ws.mergeCells(dayRow.number, 1, dayRow.number, exerciseCols)
                styleDayHeaderRow(dayRow)

                // Exercise column headers
                addExerciseHeader(ws)

                // Exercise rows
                let exIdx = 0
                for (const exercise of day.exercises) {
                    const row = ws.addRow([
                        exercise.name,
                        exercise.sets,
                        exercise.reps,
                        exercise.expectedRpe ?? '',
                        exercise.loadRange ?? '',
                        exercise.loadActual ?? '',
                        exercise.rpeActual ?? '',
                    ])
                    styleDataRow(row, exIdx % 2 === 1)
                    centerAlign(row, 2, 3, 4, 6, 7)
                    exIdx++
                }
            }
        }

        // Spacer before weekly data section
        ws.addRow([])
        ws.addRow([])

        const weeklyHeaderCols = weeklyWidths.length
        const sectionRow = ws.addRow(['Weekly Data'])
        ws.mergeCells(sectionRow.number, 1, sectionRow.number, weeklyHeaderCols)
        styleSectionHeaderRow(sectionRow, weeklyHeaderCols)

        const weeklyColRow = ws.addRow([
            'Week',
            'Bodyweight',
            'Calories',
            'Sleep (hrs)',
            'Sleep Quality',
            'Cognitive Capacity',
            'General Motivation',
            'Motivation to Train',
            'Wellbeing',
            'Stress',
            'Energy',
            'Libido',
            'Soreness',
            'Fatigue %',
        ])
        for (let c = 1; c <= weeklyHeaderCols; c++) {
            const cell = weeklyColRow.getCell(c)
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colHeaderBg } }
            cell.font = { bold: true, color: { argb: colHeaderFont }, size: 10, name: 'Calibri' }
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
            cell.border = darkFullBorder()
        }
        weeklyColRow.height = 22

        let weeklyRowIndex = 0
        for (const week of block.weeks) {
            const fi = week.fatigueIndex as FatigueIndex | null
            const wc = week.weeklyCheckIn as WeeklyCheckIn | null

            const row = ws.addRow([
                week.weekNumber,
                wc?.bodyweight ?? '',
                wc?.calories ?? '',
                wc?.sleep_hours ?? '',
                fi?.sleep_quality ?? '',
                fi?.cognitive_capacity ?? '',
                fi?.general_motivation ?? '',
                fi?.motivation_to_train ?? '',
                fi?.sense_of_wellbeing ?? '',
                fi?.perceived_stress ?? '',
                fi?.energy_levels ?? '',
                fi?.libido ?? '',
                fi?.soreness ?? '',
            ])
            const r = row.number
            const formula = {
                formula: `IFERROR(ROUND((E${r}+F${r}+G${r}+H${r}+I${r}+J${r}+K${r}+L${r}+M${r})/(5*7*7)*100,3),0)`,
            }
            row.getCell(14).value = formula
            const isAlt = weeklyRowIndex % 2 === 1
            row.height = 20
            row.font = { size: 10, name: 'Calibri' }
            row.alignment = { vertical: 'middle' }
            for (let c = 1; c <= weeklyHeaderCols; c++) {
                const cell = row.getCell(c)
                cell.border = thinBorder()
                if (isAlt) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: altRowColor } }
                }
                cell.alignment = { vertical: 'middle', horizontal: 'center' }
            }
            weeklyRowIndex++
        }

        ws.views = [{ state: 'frozen', ySplit: 0 }]
    }

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${program.name.replace(/[\/\\:*?"<>|]/g, '-')}.xlsx`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
}
