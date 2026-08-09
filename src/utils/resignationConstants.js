export const STATE_CLASSES = {
  'Draft': 'draft',
  'Pending Supervisor': 'pending-supervisor',
  'Pending Line Manager': 'pending-supervisor',
  'Pending T4 Admin': 'pending-supervisor',
  'Pending Janitorial Head Supervisor': 'pending-supervisor',
  'Pending Security Manager': 'pending-supervisor',
  'Pending Project Manager': 'pending-supervisor',
  'Pending Relieving Date Correction': 'requires-adjustment',
  'Approved': 'approved',
  'Rejected': 'rejected',
  'Withdrawn': 'withdrawn'
};

// The workflow itself branch-routes into "Pending Supervisor" vs. "Pending
// Line Manager" (and the T4/Janitorial/Security/Project Manager states)
// based on the employee's branch -- no client-side relabeling needed.
export const getDisplayState = (resignation) => {
  if (!resignation) return '';
  return resignation.workflow_state;
};

export const getStateClass = (state) => STATE_CLASSES[state] || 'default-state';

// Maps a raw workflow_state string to its resignation.state.* i18n key --
// used wherever the state is shown to the employee, since the backend value
// is always plain English regardless of the app's language.
const STATE_I18N_KEYS = {
  'Draft': 'draft',
  'Pending Line Manager': 'pending_line_manager',
  'Pending Supervisor': 'pending_supervisor',
  'Pending T4 Admin': 'pending_t4_admin',
  'Pending Relieving Date Correction': 'pending_relieving_date_correction',
  'Pending Janitorial Head Supervisor': 'pending_janitorial_head_supervisor',
  'Pending Security Manager': 'pending_security_manager',
  'Pending Project Manager': 'pending_project_manager',
  'Approved': 'approved',
  'Withdrawn': 'withdrawn',
  'Rejected': 'rejected',
};

export const getStateI18nKey = (state) =>
  state && STATE_I18N_KEYS[state] ? `resignation.state.${STATE_I18N_KEYS[state]}` : null;
