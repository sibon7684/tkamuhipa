/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  NO: string;
  "NAMA LENGKAP": string;
  "TANGGAL LAHIR": string;
  NISN: string;
  MATEMATIKA?: string;
  "BAHASA INDONESIA"?: string;
  IPA?: string;
  "BAHASA INGGRIS"?: string;
  "FILE PDF"?: string;
}

export interface StudentScores {
  verbal: number;
  kuantitatif: number;
  penalaran: number;
  spasial: number;
  matematika: number;
  bahasaIndonesia: number;
  ipa: number;
  bahasaInggris: number;
  average: number;
  totalScore: number;
  grade: string;
  percentile: number;
  status: "SANGAT DIREKOMENDASIKAN" | "DIREKOMENDASIKAN" | "CUKUP DIREKOMENDASIKAN";
}

export interface SearchState {
  searchQuery: string;
  selectedStudent: Student | null;
  verificationDay: string;
  verificationMonth: string;
  verificationYear: string;
  isVerified: boolean;
  errorMsg: string;
}
