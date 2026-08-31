/**
 * api.js — Centralized API service for Oil Spill Intelligence System
 *
 * All backend communication goes through this module.
 * The base URL is configured via the VITE_API_URL environment variable.
 * Defaults to http://localhost:8000 in development.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ============================================================
// HELPERS
// ============================================================

async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errData = await response.json();
      errorMessage = errData.detail || errData.message || errorMessage;
    } catch (_) {
      // ignore json parse errors on error responses
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

// ============================================================
// HEALTH CHECK
// ============================================================

/**
 * Check if the Python backend is reachable and the model is loaded.
 * @returns {Promise<{status: string, model_loaded: boolean, timestamp: string}>}
 */
export async function checkStatus() {
  const response = await fetch(`${API_BASE_URL}/api/status`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(response);
}

// ============================================================
// SAR IMAGE ANALYSIS
// ============================================================

/**
 * Upload a SAR image to the Python backend for ML oil spill detection.
 * Uses the existing predict_oil_spill() TensorFlow function.
 *
 * @param {File} imageFile - The SAR image file to analyze
 * @returns {Promise<{
 *   status: string,
 *   result: string,
 *   is_spill: boolean,
 *   probability: number,
 *   confidence: number,
 *   confidence_pct: number,
 *   oil_spill_pct: number,
 *   no_oil_spill_pct: number
 * }>}
 */
export async function analyzeSarImage(imageFile) {
  const formData = new FormData();
  formData.append('file', imageFile);

  const response = await fetch(`${API_BASE_URL}/api/analyze-sar`, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type header manually — browser sets it with boundary
  });
  return handleResponse(response);
}

// ============================================================
// FULL AIS + DRIFT ANALYSIS
// ============================================================

/**
 * Trigger the full AIS + Lagrangian drift analysis pipeline on the backend.
 *
 * This runs:
 *  1. get_combined_vessels_list() — fetches 585 AIS vessels
 *  2. run_hindcast() — 12-hour backward RK4 Lagrangian drift
 *  3. correlate_with_vessel_tracks() — ranks suspect vessels
 *
 * @returns {Promise<{
 *   status: string,
 *   spill: object,
 *   vessels: Array,
 *   suspects: Array,
 *   total_vessels: number,
 *   total_suspects: number,
 *   detection_time: string,
 *   origin_lat: number,
 *   origin_lon: number
 * }>}
 */
export async function runDriftAnalysis() {
  const response = await fetch(`${API_BASE_URL}/api/run-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(response);
}

// ============================================================
// VESSEL LIST ONLY
// ============================================================

/**
 * Fetch AIS vessels without running drift analysis.
 *
 * @param {number} count - Number of vessels to fetch (max 585)
 * @returns {Promise<{status: string, vessels: Array, total: number}>}
 */
export async function getVessels(count = 100) {
  const response = await fetch(`${API_BASE_URL}/api/vessels?count=${count}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(response);
}
