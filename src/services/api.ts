import { supabase } from '../supabaseClient';
import { Gig, Applicant } from '../types';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function verifyStudentIdWithAI(imageBase64: string) {
  const prompt = `
    You are an academic verification system for GigIT Sabah. 
    Analyze this ID card image. Extract the student's name, university name, and matric/student ID.
    Determine if this looks like a valid University ID card from Malaysia (like UMS, UiTM, etc).
    Return ONLY a JSON object: { "isValid": boolean, "name": string, "university": string, "matricId": string, "reason": string }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { text: prompt },
      { inlineData: { data: imageBase64.split(',')[1], mimeType: 'image/jpeg' } }
    ],
    config: { responseMimeType: "application/json" }
  });

  const result = JSON.parse(response.text);
  
  if (result.isValid) {
    // Save to Supabase
    await supabase.from('profiles').update({
      is_verified: true,
      university: result.university,
      matric_id: result.matricId
    }).eq('id', (await supabase.auth.getUser()).data.user?.id);
  }
  
  return result;
}
export async function submitGigReviewWithAI(rawRating: number, comment: string) {
  // 1. Ask Gemini to analyze the context of the text
  const prompt = `
    Analyze this gig worker review: "${comment}".
    The base rating is ${rawRating}/5. 
    Did they mention the worker being late? Did they mention a no-show? Was the attitude exceptional?
    Calculate a 'reliability_modifier' between -1.0 (terrible/no-show) and +0.5 (exceptional/early).
    Return ONLY JSON: { "modifier": number, "tags": string[], "isNoShow": boolean }
  `;

  const aiResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  // Just return the AI's math, we won't save to Supabase for the pitch
  return JSON.parse(aiResponse.text);
}

export async function triggerEmergencyBackup(gigDescription: string, nearbyWorkers: any[]) {
  // 3. Use AI to pick the BEST candidate from the provided dummy pool
  const prompt = `
    A worker just canceled a gig. We need an emergency replacement.
    Gig Description: "${gigDescription}"
    
    Here is the JSON list of available standby workers:
    ${JSON.stringify(nearbyWorkers)}
    
    Based on their reliability score, completed gigs, and the gig needs, pick the single best worker to dispatch.
    Return ONLY JSON: { "selectedWorkerId": "string", "reason": "Why they were chosen based on their stats" }
  `;

  const aiResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(aiResponse.text);
}

export const api = {
  // 1. GET ALL GIGS
  // FIX: Added coords.lat / coords.lng mapping so Leaflet map pins work.
  // The DB stores coords as a JSON object; we map it explicitly here.
  async getGigs(): Promise<Gig[]> {
    const { data, error } = await supabase
      .from('gigs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gigs:', error);
      throw error;
    }

    return data.map((gig: any) => ({
      id: gig.id,
      title: gig.title,
      employer: gig.employer,
      locationName: gig.location_name,
      distance: gig.distance ?? '',
      rate: gig.rate,
      period: gig.period,
      category: gig.category,
      isInstant: gig.is_instant ?? false,
      duration: gig.duration,
      description: gig.description,
      tags: gig.tags ?? [],
      imageUrl: gig.image_url,
      // FIX: coords from DB may be stored as { lat, lng, x, y } or a subset.
      // We provide safe defaults so map pins never crash.
      coords: {
        x: gig.coords?.x ?? 50,
        y: gig.coords?.y ?? 50,
        lat: gig.coords?.lat ?? 6.0367,
        lng: gig.coords?.lng ?? 116.1186,
      },
    }));
  },

  // 2. CREATE A NEW GIG (Insert data to Database)
  // FIX: coords now persists lat/lng so new gigs show on the map correctly.
  async createGig(gig: Omit<Gig, 'id'>): Promise<Gig> {
    const { data, error } = await supabase
      .from('gigs')
      .insert([
        {
          title: gig.title,
          employer: gig.employer,
          location_name: gig.locationName,
          distance: gig.distance,
          rate: gig.rate,
          period: gig.period,
          category: gig.category,
          is_instant: gig.isInstant,
          duration: gig.duration,
          description: gig.description,
          tags: gig.tags,
          image_url: gig.imageUrl,
          coords: gig.coords,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      employer: data.employer,
      locationName: data.location_name,
      distance: data.distance ?? '',
      rate: data.rate,
      period: data.period,
      category: data.category,
      isInstant: data.is_instant ?? false,
      duration: data.duration,
      description: data.description,
      tags: data.tags ?? [],
      imageUrl: data.image_url,
      coords: {
        x: data.coords?.x ?? 50,
        y: data.coords?.y ?? 50,
        lat: data.coords?.lat ?? 6.0367,
        lng: data.coords?.lng ?? 116.1186,
      },
    };
  },

  // 3. GET APPLICANTS FOR A SPECIFIC GIG
  async getApplicantsForGig(gigId: string): Promise<Applicant[]> {
    const { data, error } = await supabase
      .from('applicants')
      .select('*')
      .eq('gig_id', gigId);

    if (error) throw error;
    return data ?? [];
  },

  // 4. UPDATE APPLICANT STATUS (e.g., Hiring someone on Dashboard)
  // FIX: This was defined but never called. EmployerDashboardView now calls it.
  async updateApplicantStatus(
    applicantId: string,
    status: 'Pending' | 'Hired' | 'Messaged'
  ): Promise<void> {
    const { error } = await supabase
      .from('applicants')
      .update({ status })
      .eq('id', applicantId);

    if (error) throw error;
  },
};
