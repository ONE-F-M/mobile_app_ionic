export const STATE_CLASSES = {
  'Approved': 'approved',
  'Pending Supervisor': 'pending-supervisor',
  'Pending Line Manager': 'pending-supervisor',
  'Pending Operations Manager': 'pending-operations-manager',
  'Requires Adjustment': 'requires-adjustment',
  'Pending Employee Update': 'pending-employee-update',
  'Rejected': 'rejected',
  'Cancelled': 'cancelled',
  'Withdrawn': 'withdrawn'
};

export const getDisplayState = (resignation) => {
  if (!resignation) return '';
  const state = resignation.workflow_state;
  if (state === 'Pending Supervisor' && resignation.is_corporate) {
    return 'Pending Line Manager';
  }
  return state;
};

export const getStateClass = (state) => STATE_CLASSES[state] || 'default-state';
