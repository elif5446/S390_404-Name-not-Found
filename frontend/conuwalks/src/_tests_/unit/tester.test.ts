import { pingBackend, sendTestData, TestData } from '../../api/tester';

global.fetch = jest.fn();

describe('tester API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pingBackend', () => {
    it('returns JSON on success', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pong: true }),
      });
      const result = await pingBackend();
      expect(result).toEqual({ pong: true });
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/tester/ping'));
    });

    it('throws on error response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      await expect(pingBackend()).rejects.toThrow('Ping failed');
    });
  });

  describe('sendTestData', () => {
    const data: TestData = { user: 'test', message: 'hello' };

    it('returns JSON on success', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      const result = await sendTestData(data);
      expect(result).toEqual({ success: true });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tester'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      );
    });

    it('throws on error response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({ ok: false });
      await expect(sendTestData(data)).rejects.toThrow('POST failed');
    });
  });
});
