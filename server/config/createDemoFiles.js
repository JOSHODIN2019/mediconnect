/**
 * Creates demo medical-record files (minimal valid PDFs) in server/uploads/demo/.
 * Returns an object keyed by record ID with { filePath, fileName, mimeType, fileSize }.
 *
 * PDFs are generated from scratch — no external libraries needed.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname }                     from 'path'
import { fileURLToPath }                     from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const DEMO_DIR = join(__dirname, '../uploads/demo')

/* ── Minimal valid PDF generator ─────────────────────────────────────────── */

function esc(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function buildPDF(titleLine, sections) {
  // Build the page content stream
  const ops = ['BT', '/F1 13 Tf', '50 770 Td', '18 TL']

  const addLine = (text, size) => {
    if (size && size !== 13) ops.push(`/F1 ${size} Tf`)
    ops.push(`(${esc(text)}) Tj`, 'T*')
    if (size && size !== 13) ops.push('/F1 13 Tf')
  }

  addLine(titleLine, 16)
  ops.push('T*')

  for (const [heading, lines] of sections) {
    addLine(heading, 12)
    for (const line of lines) addLine(line, 11)
    ops.push('T*')
  }

  ops.push('ET')
  const content = ops.join('\n') + '\n'
  const contentBuf = Buffer.from(content, 'latin1')

  // Build PDF objects as strings (all ASCII-safe)
  const dict1 = '<</Type/Catalog/Pages 2 0 R>>'
  const dict2 = '<</Type/Pages/Kids[3 0 R]/Count 1>>'
  const dict3 = '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 5 0 R>>>>/Contents 4 0 R>>'
  const stream = `<</Length ${contentBuf.length}>>\nstream\n${content}endstream`
  const dict5 = '<</Type/Font/Subtype/Type1/BaseFont/Courier>>'

  const header = '%PDF-1.4\n'
  const parts  = []
  const offsets = [0, 0, 0, 0, 0, 0]

  let pos = header.length

  const push = (i, body) => {
    const s = `${i} 0 obj\n${body}\nendobj\n`
    offsets[i] = pos
    parts.push(s)
    pos += Buffer.byteLength(s, 'latin1')
  }

  push(1, dict1)
  push(2, dict2)
  push(3, dict3)
  push(4, stream)
  push(5, dict5)

  const xrefStart = pos
  const pad = n => String(n).padStart(10, '0')

  // Each xref entry MUST be exactly 20 bytes: 10+1+5+1+1+1+\r\n = 20
  const entry = (n, g, t) => `${pad(n)} ${String(g).padStart(5,'0')} ${t} \r\n`

  const xref = [
    'xref\n0 6\n',
    entry(0, 65535, 'f'),
    entry(offsets[1], 0, 'n'),
    entry(offsets[2], 0, 'n'),
    entry(offsets[3], 0, 'n'),
    entry(offsets[4], 0, 'n'),
    entry(offsets[5], 0, 'n'),
    `trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF\n`,
  ].join('')

  return Buffer.from(header + parts.join('') + xref, 'latin1')
}

/* ── Demo file definitions ───────────────────────────────────────────────── */

const FILES = {
  cbc: {
    fileName: 'cbc_report_jan2025.pdf',
    title: 'COMPLETE BLOOD COUNT (CBC) - January 2025',
    sections: [
      ['Patient Information', [
        'Name:      Tunde Bakare',
        'DOB:       14 May 1990   |   Age: 34 yrs',
        'Patient ID: PAT-0001     |   Date: 15 Jan 2025',
        'Hospital:  LUTH, Lagos   |   Lab ID: LAB-2025-0142',
      ]],
      ['Test Results', [
        'WBC (White Blood Cells)  : 7.2 x10^9/L    [Ref: 4.0-11.0]  NORMAL',
        'RBC (Red Blood Cells)    : 5.1 x10^12/L   [Ref: 4.5-6.0]   NORMAL',
        'Haemoglobin              : 14.8 g/dL       [Ref: 13.5-17.5] NORMAL',
        'Haematocrit              : 44.2 %          [Ref: 41-53]      NORMAL',
        'MCV (Mean Cell Volume)   : 86.7 fL         [Ref: 80-100]     NORMAL',
        'MCH                      : 29.0 pg         [Ref: 27-33]      NORMAL',
        'Platelets                : 265 x10^9/L     [Ref: 150-400]    NORMAL',
        'Neutrophils              : 58.4 %          [Ref: 40-75]      NORMAL',
        'Lymphocytes              : 32.1 %          [Ref: 20-45]      NORMAL',
      ]],
      ['Clinical Summary', [
        'All haematological parameters are within normal reference ranges.',
        'No evidence of anaemia, infection, or haematological disorder.',
        'Recommend routine repeat in 12 months.',
      ]],
      ['Authorised By', [
        'Dr. Adaeze Nwosu — Cardiologist, LUTH Lagos',
        'Signed: 15 January 2025',
        '--- BLOCKCHAIN SECURED RECORD ---',
      ]],
    ],
  },

  echo: {
    fileName: 'echo_report_dec2024.pdf',
    title: 'ECHOCARDIOGRAM REPORT - December 2024',
    sections: [
      ['Patient Information', [
        'Name:      Tunde Bakare',
        'DOB:       14 May 1990   |   Age: 34 yrs',
        'Patient ID: PAT-0001     |   Date: 20 Dec 2024',
        'Hospital:  LUTH, Lagos   |   Ref: ECHO-2024-0887',
      ]],
      ['Examination: Transthoracic Echocardiogram (TTE)', [
        'Indication: Hypertension follow-up, exertional dyspnoea.',
        'Views obtained: Parasternal long-axis, short-axis, apical 4-chamber,',
        '                apical 2-chamber, subcostal.',
      ]],
      ['Measurements', [
        'Left Ventricular EDD       : 50 mm   [Normal <56 mm]',
        'Left Ventricular ESD       : 33 mm   [Normal <40 mm]',
        'Interventricular Septum    : 10 mm   [Normal 6-12 mm]',
        'Posterior Wall Thickness   : 9 mm    [Normal 6-11 mm]',
        'Left Atrium                : 38 mm   [Normal <40 mm]',
        'Ejection Fraction (Simpson): 64%     [Normal > 55%]  PRESERVED',
        'Aortic Root                : 31 mm   [Normal <37 mm]',
      ]],
      ['Findings', [
        '- Normal left ventricular size and systolic function.',
        '- No regional wall motion abnormalities.',
        '- Mild concentric left ventricular hypertrophy consistent with hypertension.',
        '- Mild mitral regurgitation (trace) — clinically insignificant.',
        '- No pericardial effusion. Valves structurally normal.',
      ]],
      ['Conclusion', [
        'Preserved LV systolic function. Mild LVH secondary to hypertension.',
        'Continue antihypertensive therapy and follow up in 12 months.',
        'Dr. Adaeze Nwosu — Cardiologist, LUTH Lagos | 20 Dec 2024',
      ]],
    ],
  },

  rx: {
    fileName: 'prescription_nov2024.pdf',
    title: 'PRESCRIPTION - November 2024',
    sections: [
      ['Prescriber', [
        'Dr. Adaeze Nwosu   MBBS, FWACP (Cardiology)',
        'Lagos University Teaching Hospital (LUTH)',
        'Idi-Araba, Surulere, Lagos State',
        'License No: MDC-2019-045  |  Tel: +234-1-774-0000',
      ]],
      ['Patient', [
        'Name:   Tunde Bakare         DOB:  14 May 1990',
        'ID:     PAT-0001             Date: 08 November 2024',
        'Weight: 78 kg                Allergies: NKDA',
      ]],
      ['Medication', [
        'Rx 1: Amlodipine 5 mg',
        '      Take ONE tablet by mouth ONCE DAILY',
        '      Qty: 90 tablets (90-day supply)   Refills: 2',
        '',
        'Rx 2: Hydrochlorothiazide 12.5 mg',
        '      Take ONE tablet by mouth ONCE DAILY (morning)',
        '      Qty: 90 tablets (90-day supply)   Refills: 2',
        '',
        'Rx 3: Aspirin 75 mg (Cardioprotective)',
        '      Take ONE tablet by mouth ONCE DAILY with food',
        '      Qty: 90 tablets (90-day supply)   Refills: 2',
      ]],
      ['Instructions', [
        'Monitor blood pressure daily. Target: < 130/80 mmHg.',
        'Reduce salt and saturated fat intake.',
        'Return in 4 weeks for BP check or sooner if symptomatic.',
        'Signature: Dr. A. Nwosu   |   08 November 2024',
      ]],
    ],
  },

  consult: {
    fileName: 'consult_oct2024.pdf',
    title: 'GENERAL CONSULTATION NOTES - October 2024',
    sections: [
      ['Patient Information', [
        'Name:      Tunde Bakare',
        'DOB:       14 May 1990  |  Age: 34 yrs',
        'Patient ID: PAT-0001    |  Date: 03 October 2024',
        'Attending:  Dr. Emeka Okafor — General Practice, UCH Ibadan',
      ]],
      ['Chief Complaint', [
        'Patient presents for routine annual check-up.',
        'Reports mild headache (3/10) on awakening, 3-4 times per week.',
        'No chest pain, shortness of breath, palpitations, or syncope.',
      ]],
      ['Vital Signs', [
        'Blood Pressure : 130 / 85 mmHg (Stage 1 Hypertension — monitored)',
        'Heart Rate     : 78 bpm   (Regular rhythm)',
        'Temperature    : 36.8 C   (Afebrile)',
        'SpO2           : 99%      (Room air)',
        'Weight         : 78 kg    |  Height: 1.72 m  |  BMI: 26.4 (Overweight)',
        'Respiratory    : 16 breaths/min  (Unlaboured)',
      ]],
      ['Physical Examination', [
        'General: Alert, well-nourished, in no acute distress.',
        'CVS: S1 S2 heard, no murmurs. No peripheral oedema.',
        'Respiratory: Clear to auscultation bilaterally.',
        'Abdomen: Soft, non-tender, no organomegaly.',
        'CNS: Oriented x3. No focal neurological deficit.',
      ]],
      ['Assessment & Plan', [
        'Diagnosis: Essential hypertension (I10) — under control.',
        'Continue current antihypertensive regimen.',
        'Lifestyle: Reduce sodium, 30 min aerobic exercise 5x/week.',
        'Labs: CBC, Lipid panel, Urea & Electrolytes, Fasting glucose.',
        'Follow-up: 4 weeks or sooner if BP remains elevated.',
      ]],
    ],
  },

  ecg_amaka: {
    fileName: 'ecg_amaka_feb2025.pdf',
    title: 'ELECTROCARDIOGRAM (ECG) REPORT - February 2025',
    sections: [
      ['Patient Information', [
        'Name:      Amaka Okonkwo',
        'DOB:       02 November 1985   |   Age: 39 yrs',
        'Patient ID: PAT-0002          |   Date: 14 Feb 2025',
        'Hospital:  LUTH, Lagos        |   Ref: ECG-2025-0214',
      ]],
      ['Recording Details', [
        'Type:       Standard 12-Lead Resting ECG',
        'Indication: Palpitations, routine cardiac screening.',
        'Speed:      25 mm/s   |   Gain: 10 mm/mV',
      ]],
      ['Measurements', [
        'Heart Rate       : 72 bpm       (Normal sinus rate)',
        'PR Interval      : 158 ms       [Normal 120-200 ms]',
        'QRS Duration     : 88 ms        [Normal <120 ms]',
        'QT / QTc         : 360 / 393 ms [Normal QTc < 450 ms in women]',
        'QRS Axis         : +42 degrees  [Normal -30 to +90]',
      ]],
      ['Interpretation', [
        'Rhythm: Normal sinus rhythm.',
        'No ST-segment elevation or depression.',
        'No T-wave inversion or pathological Q waves.',
        'No evidence of left or right ventricular hypertrophy.',
        'No bundle branch block or conduction abnormality.',
        'No delta waves (pre-excitation).',
      ]],
      ['Conclusion', [
        'NORMAL 12-LEAD ECG. No acute ischaemic changes.',
        'Clinical correlation with symptoms recommended.',
        'Dr. Adaeze Nwosu — Cardiologist, LUTH Lagos | 14 Feb 2025',
        '--- BLOCKCHAIN SECURED RECORD ---',
      ]],
    ],
  },

  lipid_amaka: {
    fileName: 'lipid_amaka_jan2025.pdf',
    title: 'LIPID PROFILE REPORT - January 2025',
    sections: [
      ['Patient Information', [
        'Name:      Amaka Okonkwo',
        'DOB:       02 November 1985   |   Age: 39 yrs',
        'Patient ID: PAT-0002          |   Date: 22 Jan 2025',
        'Hospital:  LUTH, Lagos        |   Lab ID: LAB-2025-0089',
        'Fasting status: 12-hour fast confirmed.',
      ]],
      ['Test Results', [
        'Total Cholesterol         : 210 mg/dL   [Desirable < 200]   BORDERLINE HIGH',
        'LDL Cholesterol           : 130 mg/dL   [Optimal < 100]     ABOVE OPTIMAL',
        'HDL Cholesterol           : 55 mg/dL    [Women > 50]        NORMAL',
        'Triglycerides             : 125 mg/dL   [Normal < 150]      NORMAL',
        'Non-HDL Cholesterol       : 155 mg/dL   [Target < 130]      HIGH',
        'Total Chol / HDL Ratio    : 3.8         [Low risk < 5.0]    NORMAL',
        'LDL / HDL Ratio           : 2.4         [Low risk < 3.0]    NORMAL',
        'VLDL Cholesterol (calc.)  : 25 mg/dL    [Normal 2-30]       NORMAL',
      ]],
      ['Clinical Comment', [
        'Borderline elevated total and LDL cholesterol.',
        'Recommend lifestyle intervention: low-fat diet, regular aerobic exercise.',
        'Consider pharmacotherapy (statin) if LDL remains > 130 mg/dL in 3 months.',
        'Repeat fasting lipid panel in 12 weeks.',
        'Cardiovascular risk: MODERATE (FRS 10-year risk: ~8%)',
      ]],
      ['Authorised By', [
        'Dr. Adaeze Nwosu — Cardiologist, LUTH Lagos',
        'Signed: 22 January 2025',
        '--- BLOCKCHAIN SECURED RECORD ---',
      ]],
    ],
  },
}

/* ── Public function ─────────────────────────────────────────────────────── */

export function createDemoFiles() {
  if (!existsSync(DEMO_DIR)) mkdirSync(DEMO_DIR, { recursive: true })

  const result = {}
  for (const [key, def] of Object.entries(FILES)) {
    const filePath = join(DEMO_DIR, def.fileName)
    const pdfBuf  = buildPDF(def.title, def.sections)
    writeFileSync(filePath, pdfBuf)
    result[key] = {
      filePath,
      fileName: def.fileName,
      mimeType: 'application/pdf',
      fileSize: pdfBuf.length,
    }
  }

  console.log(`✅ Demo PDF files written to ${DEMO_DIR}`)
  return result
}
