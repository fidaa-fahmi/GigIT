// services/api.ts - Updated with supabase export
import { supabase } from '../supabaseClient';
import { Gig, Applicant } from '../types';
import { GoogleGenAI } from '@google/genai';

// Re-export supabase for use in other components
export { supabase };

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export async function verifyStudentIdWithAI(imageBase64: string) {
  const prompt = `
    You are an academic verification system for GigIT Sabah. 
    Analyze this ID card image. Extract the student's name, university name, and matric/student ID.
    Determine if this looks like a valid University ID card from Malaysia (like UMS, UiTM, etc).
    Return ONLY a JSON object: { "isValid": boolean, "name": string, "university": string, "matricId": string, "reason": string }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
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
  const prompt = `
    Analyze this gig worker review: "${comment}".
    The base rating is ${rawRating}/5. 
    Did they mention the worker being late? Did they mention a no-show? Was the attitude exceptional?
    Calculate a 'reliability_modifier' between -1.0 (terrible/no-show) and +0.5 (exceptional/early).
    Return ONLY JSON: { "modifier": number, "tags": string[], "isNoShow": boolean }
  `;

  const aiResponse = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(aiResponse.text);
}

export async function triggerEmergencyBackup(gigDescription: string, nearbyWorkers: any[]) {
  const prompt = `
    A worker just canceled a gig. We need an emergency replacement.
    Gig Description: "${gigDescription}"
    
    Here is the JSON list of available standby workers:
    ${JSON.stringify(nearbyWorkers)}
    
    Based on their reliability score, completed gigs, and the gig needs, pick the single best worker to dispatch.
    Return ONLY JSON: { "selectedWorkerId": "string", "reason": "Why they were chosen based on their stats" }
  `;

  const aiResponse = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(aiResponse.text);
}

export const api = {
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
      coords: {
        x: gig.coords?.x ?? 50,
        y: gig.coords?.y ?? 50,
        lat: gig.coords?.lat ?? 6.0367,
        lng: gig.coords?.lng ?? 116.1186,
      },
    }));
  },

  async createGig(gig: any): Promise<Gig> {
    try {
      // Only include fields that exist in the database
      const gigData: any = {
        title: gig.title,
        employer: gig.employer,
        rate: gig.rate,
        category: gig.category,
      };
      
      // Add optional fields only if they exist in the database
      if (gig.employer_id) gigData.employer_id = gig.employer_id;
      if (gig.employer_name) gigData.employer_name = gig.employer_name;
      if (gig.locationName) gigData.location_name = gig.locationName;
      if (gig.distance) gigData.distance = gig.distance;
      if (gig.period) gigData.period = gig.period;
      if (gig.duration) gigData.duration = gig.duration;
      if (gig.description) gigData.description = gig.description;
      if (gig.tags && gig.tags.length > 0) gigData.tags = gig.tags;
      if (gig.coords) gigData.coords = gig.coords;
      if (gig.status) gigData.status = gig.status;
      
      console.log('Inserting gig with data:', gigData);
      
      const { data, error } = await supabase
        .from('gigs')
        .insert([gigData])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error details:', error);
        throw new Error(error.message);
      }

      return {
        id: data.id,
        title: data.title,
        employer: data.employer,
        locationName: data.location_name || '',
        distance: data.distance ?? '',
        rate: data.rate,
        period: data.period || 'Hour',
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
    } catch (err) {
      console.error('createGig error:', err);
      throw err;
    }
  },
  async getApplicantsForGig(gigId: string): Promise<Applicant[]> {
    const { data, error } = await supabase
      .from('applicants')
      .select('*')
      .eq('gig_id', gigId);

    if (error) throw error;
    return data ?? [];
  },

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