import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockFrom, mockSelect, mockEq, mockMaybeSingle } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockSelect: vi.fn(),
  mockEq: vi.fn(),
  mockMaybeSingle: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

import { getHadEpisodeDetail } from './had';

describe('getHadEpisodeDetail', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockSelect.mockReset();
    mockEq.mockReset();
    mockMaybeSingle.mockReset();

    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it('uses the explicit had visit relation in the detail query', async () => {
    await getHadEpisodeDetail('episode-1');

    expect(mockFrom).toHaveBeenCalledWith('had_episodes');
    expect(mockSelect).toHaveBeenCalledWith(expect.stringContaining('visits:visits!visits_had_episode_id_fkey'));
    expect(mockEq).toHaveBeenCalledWith('id', 'episode-1');
  });
});
