import { supabase } from '../lib/supabase';

export class PresenterTimeController {
  private campaignId: string;

  constructor(campaignId: string) {
    this.campaignId = campaignId;
  }

  async setMinute(minute: number): Promise<void> {
    const { error } = await supabase
      .from('demo_simulation_state')
      .update({ demo_current_minute: minute })
      .eq('campaign_id', this.campaignId);

    if (error) {
      throw error;
    }
  }

  async play(): Promise<void> {
    const { error } = await supabase
      .from('demo_simulation_state')
      .update({ is_running: true })
      .eq('campaign_id', this.campaignId);

    if (error) {
      throw error;
    }
  }

  async pause(): Promise<void> {
    const { error } = await supabase
      .from('demo_simulation_state')
      .update({ is_running: false })
      .eq('campaign_id', this.campaignId);

    if (error) {
      throw error;
    }
  }

  async reset(): Promise<void> {
    const { error } = await supabase
      .from('demo_simulation_state')
      .update({
        demo_current_minute: 0,
        is_running: false
      })
      .eq('campaign_id', this.campaignId);

    if (error) {
      throw error;
    }
  }
}
