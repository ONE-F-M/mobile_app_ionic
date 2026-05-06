import { setActivePinia, createPinia } from 'pinia';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { useResignationStore } from '@/store/resignation';
import { useUserStore } from '@/store/user';
import resignation from '@/api/resignation';

// Mock the API and User store dependencies
vi.mock('@/api/resignation', () => ({
  default: {
    getMyActiveResignation: vi.fn(),
  },
}));

describe('Resignation Store', () => {
  let userStore;
  let resignationStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    userStore = useUserStore();
    resignationStore = useResignationStore();
    
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    expect(resignationStore.activeResignation).toBeNull();
    expect(resignationStore.loading).toBe(false);
    expect(resignationStore.error).toBeNull();
  });

  it('fetchActiveResignation does nothing if no employee_id', async () => {
    userStore.user = null; // No user logged in
    
    await resignationStore.fetchActiveResignation();
    
    expect(resignationStore.loading).toBe(false);
    expect(resignation.getMyActiveResignation).not.toHaveBeenCalled();
  });

  it('fetchActiveResignation successfully fetches and sets active resignation', async () => {
    // Setup user
    userStore.user = { employee_id: 'EMP-001' };
    
    // Mock successful API response
    const mockResignationData = {
      name: 'RES-001',
      workflow_state: 'Pending Supervisor',
      resignation_initiation_date: '2023-10-01',
      relieving_date: '2023-12-31'
    };
    
    resignation.getMyActiveResignation.mockResolvedValueOnce({
      data: { message: mockResignationData }
    });
    
    // Execute
    const fetchPromise = resignationStore.fetchActiveResignation();
    
    // Loading state should be true while fetching
    expect(resignationStore.loading).toBe(true);
    
    await fetchPromise;
    
    // Assertions
    expect(resignation.getMyActiveResignation).toHaveBeenCalledWith('EMP-001');
    expect(resignationStore.activeResignation).toEqual(mockResignationData);
    expect(resignationStore.loading).toBe(false);
    expect(resignationStore.error).toBeNull();
  });

  it('fetchActiveResignation handles API errors correctly', async () => {
    userStore.user = { employee_id: 'EMP-001' };
    
    const mockError = new Error('Network error');
    resignation.getMyActiveResignation.mockRejectedValueOnce(mockError);
    
    await resignationStore.fetchActiveResignation();
    
    expect(resignationStore.activeResignation).toBeNull();
    expect(resignationStore.error).toEqual(mockError);
    expect(resignationStore.loading).toBe(false);
  });

  it('clearActiveResignation resets the state', () => {
    resignationStore.activeResignation = { name: 'RES-001' };
    resignationStore.error = new Error('Some error');
    
    resignationStore.clearActiveResignation();
    
    expect(resignationStore.activeResignation).toBeNull();
    expect(resignationStore.error).toBeNull();
  });
});
