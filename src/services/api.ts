import { supabase } from '../supabaseClient';
import { Gig, Applicant } from '../types';

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
