import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedTableData, ChapterType } from "../types";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

// 1. SYSTEM PERSONA (The Master Persona)
const SYSTEM_INSTRUCTION = `
Kamu adalah asisten penulisan skripsi profesional standar universitas di Indonesia. Tugasmu adalah menyusun draf skripsi yang mengikuti aturan Pedoman Umum Ejaan Bahasa Indonesia (PUEBI) dan standar penulisan ilmiah.

**ATURAN WAJIB (STRICT RULES):**
1. **Gaya Bahasa**: Formal, objektif, akademis (hindari "saya", "aku", gunakan "penulis" atau kalimat pasif).
2. **Sitasi**: Gunakan APA Style 7th Edition (Contoh: (Santoso, 2023)).
3. **Istilah Asing**: Setiap istilah asing (Inggris/Latin) **WAJIB** ditulis *miring* (italic).
4. **Format Output**: Return valid **HTML** (<h3>, <h4>, <p>, <i>, <b>, <table>). Jangan gunakan Markdown (**bold**).
5. **Koherensi**: Hindari pengulangan kata; gunakan variasi kata penghubung.
6. **ANTI-ROBOTIK (CRITICAL)**: 
   - **DILARANG KERAS** menggunakan kalimat transisi klise khas AI seperti:
     - "Berdasarkan latar belakang yang telah diuraikan di atas..."
     - "Sejalan dengan rumusan masalah yang telah ditetapkan..."
     - "Adapun tujuan dari penelitian ini adalah sebagai berikut..."
     - "Berikut adalah rinciannya..."
   - **Gunakan gaya langsung**: Contoh: "Rumusan masalah penelitian ini berfokus pada..." atau langsung masuk ke daftar poin.
   - Tulisan harus mengalir natural seolah ditulis manual oleh manusia.
`;

export const cleanupText = async (text: string): Promise<string> => {
  if (!text) return "";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a professional text editor. Clean up this AI-generated text. 
      
      CRITICAL INSTRUCTION: Remove robotic transitional phrases like "Berdasarkan penjelasan di atas", "Adapun", "Berikut adalah". 
      Make it sound human, direct, and professional. 
      Remove markdown (**bold**, ##). Use PUEBI for Indonesian. 
      
      Input: ${text}`,
    });
    return response.text || "";
  } catch (error) {
    throw new Error("Failed to process text.");
  }
};

/**
 * Generates specific chapters based on user selection using the specialized prompts.
 */
export const generateChapter = async (chapter: ChapterType, inputMaterial: string): Promise<string> => {
  if (!inputMaterial) return "";

  let specificPrompt = "";

  switch (chapter) {
    case ChapterType.FULL_FRONT_MATTER:
      specificPrompt = `
      **TUGAS: BAGIAN DEPAN SKRIPSI LENGKAP (SATU FILE)**
      Berdasarkan data input: "${inputMaterial}".

      Buatlah draf **BAGIAN DEPAN SKRIPSI** secara lengkap. Gunakan data tersebut untuk mengisi:
      
      **URUTAN HALAMAN:**
      1. **Halaman Judul (Cover)**: Format Piramida Terbalik, Judul Bold ALL CAPS, Logo Universitas (placeholder), Nama, NIM, Prodi, Kampus.
      2. **Halaman Pernyataan Orisinalitas**: Teks formal lengkap dengan tempat tanda tangan dan keterangan (Materai 10.000).
      3. **Halaman Pengesahan**: (Sesuaikan dengan data input: Pembimbing, Kaprodi/Dekan jika ada).
      4. **Kata Pengantar**: Minimal 3-4 paragraf. Paragraf terakhir berisi ucapan terima kasih kepada pihak yang relevan.
      5. **Abstrak (Bahasa Indonesia)**: Maksimal 250 kata, 1 spasi, sertakan 3-5 Kata Kunci.
      6. **Abstract (Bahasa Inggris)**: Terjemahan akurat dari abstrak Indonesia, cetak miring (italic).

      **ATURAN LAYOUT WAJIB:**
      - **PENTING**: Gunakan penanda teks "[HALAMAN BARU]" secara harfiah di setiap pergantian halaman antar bagian (misal antara cover dan pernyataan). Jangan digabung.
      - Gunakan format HTML.
      - Judul setiap bagian gunakan tag <h3> dengan align center.
      `;
      break;

    case ChapterType.FRONT_COVER:
      specificPrompt = `
      **TUGAS: HALAMAN JUDUL (COVER)**
      Berdasarkan: "${inputMaterial}".
      Buat Layout HTML center aligned:
      1. **JUDUL SKRIPSI** (Huruf Kapital, Format Piramida Terbalik).
      2. Teks: "SKRIPSI".
      3. Teks: "Diajukan untuk Memenuhi Salah Satu Syarat Memperoleh Gelar Sarjana".
      4. Logo Universitas (Gunakan placeholder text: [LOGO UNIVERSITAS]).
      5. Oleh: Nama Mahasiswa & NIM.
      6. Nama Program Studi, Fakultas, Universitas, Kota, Tahun (Ambil dari input).
      `;
      break;

    case ChapterType.FRONT_APPROVAL:
      specificPrompt = `
      **TUGAS: LEMBAR PENGESAHAN (LAYOUT KHUSUS)**
      Berdasarkan data input: "${inputMaterial}".
      
      Buatlah kode HTML (div/p) dengan format **RATA TENGAH (CENTER ALIGN)** vertikal dari atas ke bawah.
      
      **INSTRUKSI PENTING**: Gunakan Nama Universitas, Fakultas, dan Nama-nama Dosen **SESUAI INPUT PENGGUNA**. Jangan mengarang nama universitas (seperti UNY) jika tidak ada di input. Jika tidak ada, tulis placeholder seperti [NAMA UNIVERSITAS].

      Struktur Layout:
      1. **Judul Halaman**: "LEMBAR PENGESAHAN" (Bold, Uppercase).
      2. Teks: "Proposal Tugas Akhir Skripsi dengan Judul".
      3. **(JUDUL SKRIPSI)** (Ambil dari input, Bold, Uppercase).
      4. <br>
      5. Teks: "Disusun oleh:".
      6. (Nama Mahasiswa - Ambil dari input).
      7. NIM (Ambil dari input).
      8. <br>
      9. Teks: "Telah diseminarkan pada hari .......... tanggal ............ secara daring".
      10. (Nama Fakultas - Ambil dari input, jika tidak ada tulis [NAMA FAKULTAS]).
      11. (Nama Universitas - Ambil dari input, jika tidak ada tulis [NAMA UNIVERSITAS]).
      12. <br><br>
      
      **TANDA TANGAN 1 (Posisi Tengah):**
      13. Teks: "Telah Disetujui".
      14. Teks: "Dosen Pembimbing Tugas Akhir Skripsi,".
      15. [Berikan Jarak <br><br><br>].
      16. (Nama Dosen Pembimbing TAS - Ambil dari input).
      17. NIP. .................
      
      **TANDA TANGAN 2 (Posisi Tengah Bawah):**
      18. Teks: "Mengetahui".
      19. Teks: "Wakil Dekan Bidang Akademik, Kemahasiswaan, dan Alumni".
      20. [Berikan Jarak <br><br><br>].
      21. (Nama WD AKA - Ambil dari input, jika tidak ada tulis [NAMA WAKIL DEKAN]).
      22. NIP .................
      `;
      break;
    
    case ChapterType.FRONT_PREFACE:
      specificPrompt = `
      **TUGAS: KATA PENGANTAR**
      Berdasarkan: "${inputMaterial}".
      Struktur:
      1. Puji Syukur kepada Tuhan YME.
      2. Tujuan penulisan skripsi.
      3. Ucapan terima kasih (list numbering) kepada: Rektor, Dekan, Dosen Pembimbing, Orang Tua, Teman.
      4. Penutup (Saran & Kritik).
      5. Kota, Tanggal, Penulis.
      `;
      break;

    case ChapterType.FRONT_ABSTRACT:
      specificPrompt = `
      **TUGAS: ABSTRAK (INDONESIA & INGGRIS)**
      Berdasarkan: "${inputMaterial}".
      
      Output 2 Bagian:
      1. **ABSTRAK** (Bahasa Indonesia):
         - Paragraf tunggal (Single spacing).
         - Isi: Tujuan, Metode, Hasil, Kesimpulan.
         - Kata Kunci (Keywords): 3-5 kata.
      
      2. **ABSTRACT** (Bahasa Inggris):
         - Terjemahan formal dari poin 1.
         - Keywords.
      `;
      break;

    case ChapterType.BAB_1:
      specificPrompt = `
      **TUGAS: BAB I PENDAHULUAN**
      Berdasarkan materi: "${inputMaterial}", buatlah:
      
      **A. Latar Belakang**
      Gunakan pola **Deduktif** (Umum ke Khusus).
      1. Fenomena global/konteks luas.
      2. Data/Fakta lapangan (Das Sein vs Das Sollen).
      3. Masalah spesifik di lokasi penelitian (Gap).
      4. Urgensi penelitian.
      *Transisi antar paragraf harus halus tanpa frasa "Adapun", "Selanjutnya".*

      **B. Rumusan Masalah**
      Langsung sajikan pertanyaan penelitian yang tajam (tanpa pengantar "Berdasarkan uraian di atas...").

      **C. Tujuan Penelitian**
      Langsung sajikan tujuan (tanpa pengantar "Sejalan dengan...").

      **D. Manfaat Penelitian**
      Bagi instansi, akademisi, dan peneliti selanjutnya.
      `;
      break;

    case ChapterType.BAB_2:
      specificPrompt = `
      **TUGAS: BAB II TINJAUAN PUSTAKA**
      Materi: "${inputMaterial}"

      1. **Landasan Teori**: Jelaskan teori variabel secara sistematis (Definisi, Indikator).
      2. **Penelitian Terdahulu**: BUAT TABEL HTML (border="1") membandingkan 3 referensi fiktif tapi logis (Nama, Judul, Hasil, Persamaan/Perbedaan).
      3. **Kerangka Berpikir**: Narasi logis hubungan antar variabel (X ke Y).
      4. **Hipotesis** (Jika Kuantitatif): H1, H2, dst.
      
      *Ingat: Istilah asing wajib Italic. Jangan gunakan kata sambung klise.*
      `;
      break;

    case ChapterType.BAB_3:
      specificPrompt = `
      **TUGAS: BAB III METODOLOGI PENELITIAN**
      Materi: "${inputMaterial}"

      Buatlah poin-poin detail:
      1. **Jenis Penelitian**: (Kualitatif/Kuantitatif) & Alasannya.
      2. **Populasi & Sampel**: Teknik sampling yang digunakan.
      3. **Teknik Pengumpulan Data**: (Kuesioner/Wawancara/Observasi).
      4. **Definisi Operasional Variabel**: Jelaskan indikator ukur.
      5. **Teknik Analisis Data**: Alat uji (misal: Regresi, Uji T) yang relevan.
      
      *Tambahan: Buat draf pertanyaan Kuesioner/Wawancara singkat berdasarkan variabel.*
      `;
      break;

    case ChapterType.BAB_4:
      specificPrompt = `
      **TUGAS: BAB IV HASIL DAN PEMBAHASAN**
      Berdasarkan data mentah/poin hasil ini: "${inputMaterial}"

      1. **Gambaran Umum Subjek**: Profil singkat.
      2. **Hasil Penelitian**: Jelaskan temuan data. Jika ada angka statistik, jelaskan artinya dengan bahasa manusia.
      3. **Pembahasan (CRUCIAL)**: Bandingkan temuan dengan Teori di Bab II. Gunakan kalimat: "Hal ini sejalan dengan teori..." atau "Penelitian ini menolak pendapat...".
      
      *Hindari kata: "Adapun hasil...", "Berikut adalah tabel...". Langsung bahas substansinya.*
      `;
      break;

    case ChapterType.BAB_5:
      specificPrompt = `
      **TUGAS: BAB V PENUTUP**
      Materi: "${inputMaterial}"

      1. **Kesimpulan**: Jawab Rumusan Masalah secara padat (Poin per poin).
      2. **Saran**: 
         - Praktis (untuk objek penelitian).
         - Akademis (untuk peneliti selanjutnya).
         
      *Gaya bahasa tegas, tanpa basa-basi pengantar.*
      `;
      break;

    case ChapterType.BIBLIOGRAPHY:
      specificPrompt = `
      **TUGAS: DAFTAR PUSTAKA**
      Buatlah daftar pustaka fiktif namun realistis yang relevan dengan topik: "${inputMaterial}".
      
      Aturan:
      1. Format **APA Style 7th Edition**.
      2. Urutkan **A-Z**.
      3. Minimal 10 referensi (Campuran Buku & Jurnal 5 tahun terakhir).
      4. Format HTML paragraph dengan hanging indent style (akan diatur CSS nanti, cukup return list p).
      `;
      break;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${SYSTEM_INSTRUCTION} \n\n ${specificPrompt}`,
      config: {
        temperature: 0.5, 
        maxOutputTokens: 8192, 
      }
    });

    let finalText = response.text || "";

    // Automatically replace the custom page break marker with HTML page breaks
    if (chapter === ChapterType.FULL_FRONT_MATTER) {
      finalText = finalText.replace(/\[HALAMAN BARU\]/g, "<br clear=all style='mso-special-character:line-break;page-break-before:always'>");
    }

    return finalText;
  } catch (error) {
    console.error(`Error generating ${chapter}:`, error);
    throw new Error(`Failed to generate ${chapter}.`);
  }
};

export const extractTextFromImage = async (base64Image: string): Promise<string> => {
  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: "Transcribe text strictly. No markdown." }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    throw new Error("Failed to extract text.");
  }
};

export const extractTableFromImage = async (base64Image: string): Promise<ExtractedTableData> => {
  try {
    const cleanBase64 = base64Image.split(',')[1] || base64Image;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: "Extract table to JSON with 'headers' and 'rows'." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headers: { type: Type.ARRAY, items: { type: Type.STRING } },
            rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } }
          }
        }
      }
    });
    const jsonText = response.text;
    if (!jsonText) throw new Error("No data");
    return JSON.parse(jsonText) as ExtractedTableData;
  } catch (error) {
    throw new Error("Failed to extract table.");
  }
};