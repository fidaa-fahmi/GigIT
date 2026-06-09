import { supabase } from '../supabaseClient'; 
import { Gig, Applicant } from '../types';

export const api = {
  // 1. GET ALL GIGS
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
      distance: gig.distance,
      rate: gig.rate,
      period: gig.period,
      category: gig.category,
      isInstant: gig.is_instant,
      duration: gig.duration,
      description: gig.description,
      tags: gig.tags,
      imageUrl: gig.image_url,
      coords: gig.coords,
    }));
  },

  // 2. CREATE A NEW GIG (Insert data to Database)
  async createGig(gig: Omit<Gig, 'id'>): Promise<any> {
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
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  },

  // 3. GET APPLICANTS FOR A SPECIFIC GIG
  async getApplicantsForGig(gigId: string): Promise<Applicant[]> {
    const { data, error } = await supabase
      .from('applicants')
      .select('*')
      .eq('gig_id', gigId);

    if (error) throw error;
    return data;
  },

  // 4. UPDATE APPLICANT STATUS (e.g., Hiring someone on Dashboard)
  async updateApplicantStatus(applicantId: string, status: 'Pending' | 'Hired' | 'Messaged'): Promise<void> {
    const { error } = await supabase
      .from('applicants')
      .update({ status: status })
      .eq('id', applicantId);

    if (error) throw error;
  }
};