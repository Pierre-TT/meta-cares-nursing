const rawMockFlag = import.meta.env.VITE_ENABLE_HEALTHCARE_MOCKS;
const isDevBuild = import.meta.env.DEV;

export const featureFlags = {
  /**
   * Surfaces that still rely on demo/mock data (eHealthBox, billing, NFC, AI coordinator widgets, etc.).
   * Default: enabled in dev, disabled in production builds.
   */
  enableHealthcareMocks: rawMockFlag !== undefined ? rawMockFlag === 'true' : isDevBuild,
};
