/**
 * roleHierarchy.js
 * Single source-of-truth for the role assignment authority matrix.
 *
 * Structure per entry:
 *   roleName          – the role being assigned
 *   assignedBy        – array of roles that are authorized to assign this role
 *   requiresEmployee  – if true, target user must have is_employee = true first
 *   branchScoped      – if true, a branch_id must be provided at assignment time
 *   subRoles          – array of sub-role names (informational / for UI grouping)
 *   isPreExisting     – roles that exist without any assignment chain (CEO, Board, Customer)
 */

const ROLE_HIERARCHY = [
  {
    roleName: 'Employee',
    assignedBy: ['HR Manager', 'Admin'],
    requiresEmployee: false,
    branchScoped: false,
    subRoles: [],
    isPreExisting: false,
    description: 'Base onboarding step — required before any job role can be assigned.'
  },
  {
    roleName: 'Finance Manager',
    assignedBy: ['HR Manager', 'Admin'],
    requiresEmployee: true,
    branchScoped: false,
    subRoles: [],
    isPreExisting: false,
    description: 'Manages financial operations and reporting.'
  },
  {
    roleName: 'Accountant',
    assignedBy: ['HR Manager', 'Admin'],
    requiresEmployee: true,
    branchScoped: false,
    subRoles: [],
    isPreExisting: false,
    description: 'Handles accounting tasks under Finance.'
  },
  {
    roleName: 'Cashier',
    assignedBy: ['HR Manager', 'Admin'],
    requiresEmployee: true,
    branchScoped: false,
    subRoles: [],
    isPreExisting: false,
    description: 'POS cashier under Finance.'
  },
  {
    roleName: 'Admin',
    assignedBy: ['HR Manager', 'Admin'],
    requiresEmployee: true,
    branchScoped: false,
    subRoles: [],
    isPreExisting: false,
    description: 'System administrator with full access.'
  },
  {
    roleName: 'Pharmacy Manager',
    assignedBy: ['HR Manager', 'Admin'],
    requiresEmployee: true,
    branchScoped: false,
    subRoles: [],
    isPreExisting: false,
    description: 'Manages pharmacy operations.'
  },
  {
    roleName: 'Pharmacy Worker',
    assignedBy: ['Pharmacy Manager', 'Admin'],
    requiresEmployee: true,
    branchScoped: true,
    subRoles: ['Worker', 'Cashier'],
    isPreExisting: false,
    description: 'Pharmacy worker tied to a specific branch.'
  },
  {
    roleName: 'Car Rental Manager',
    assignedBy: ['HR Manager', 'Admin'],
    requiresEmployee: true,
    branchScoped: false,
    subRoles: [],
    isPreExisting: false,
    description: 'Manages car rental operations.'
  },
  {
    roleName: 'CEO',
    assignedBy: [],
    requiresEmployee: false,
    branchScoped: false,
    subRoles: [],
    isPreExisting: true,
    description: 'Chief Executive Officer — top-level, pre-existing.'
  },
  {
    roleName: 'Board',
    assignedBy: [],
    requiresEmployee: false,
    branchScoped: false,
    subRoles: [],
    isPreExisting: true,
    description: 'Board member — pre-existing.'
  },
  {
    roleName: 'HR Manager',
    assignedBy: ['CEO', 'Admin'],
    requiresEmployee: true,
    branchScoped: false,
    subRoles: [],
    isPreExisting: false,
    description: 'Manages human resources and employee onboarding.'
  },
  {
    roleName: 'Printing Supervisor',
    assignedBy: ['HR Manager', 'Admin'],
    requiresEmployee: true,
    branchScoped: false,
    subRoles: [],
    isPreExisting: false,
    description: 'Supervises printing department operations.'
  },
  {
    roleName: 'Customer',
    assignedBy: [],
    requiresEmployee: false,
    branchScoped: false,
    subRoles: [],
    isPreExisting: true,
    description: 'Self-registered customer — pre-existing.'
  },
  {
    roleName: 'Sales Manager',
    assignedBy: ['HR Manager', 'Admin'],
    requiresEmployee: true,
    branchScoped: false,
    subRoles: [],
    isPreExisting: false,
    description: 'Manages sales operations.'
  },
  {
    roleName: 'Purchase Manager',
    assignedBy: ['HR Manager', 'Admin'],
    requiresEmployee: true,
    branchScoped: false,
    subRoles: [],
    isPreExisting: false,
    description: 'Manages procurement and supplier relationships.'
  },
  {
    roleName: 'Pharmacy Store Keeper',
    assignedBy: ['CEO', 'Admin'],
    requiresEmployee: true,
    branchScoped: true,
    subRoles: [],
    isPreExisting: false,
    description: 'Manages pharmacy store operations. Branch-scoped.'
  },
  {
    roleName: 'General Store Keeper',
    assignedBy: ['CEO', 'Admin'],
    requiresEmployee: true,
    branchScoped: false,
    subRoles: [],
    isPreExisting: false,
    description: 'Manages general store operations.'
  }
];

/**
 * Custom roles created by CEO — stored in DB, this is just the schema definition.
 * CEO can assign custom roles to any existing Employee.
 */
const CUSTOM_ROLE_ASSIGNERS = ['CEO', 'Admin'];

/**
 * Get the roles that a given assigner role is allowed to assign.
 * Returns array of roleName strings.
 */
function getRolesAssignableBy(assignerRole) {
  if (assignerRole === 'Admin') {
    // Admin can assign anything (full access)
    return ROLE_HIERARCHY.map(r => r.roleName);
  }
  return ROLE_HIERARCHY
    .filter(r => r.assignedBy.includes(assignerRole))
    .map(r => r.roleName);
}

/**
 * Check if a given assigner role can assign a specific target role.
 */
function canAssignRole(assignerRoles, targetRoleName) {
  if (assignerRoles.includes('Admin')) return { allowed: true };
  const roleConfig = ROLE_HIERARCHY.find(r => r.roleName === targetRoleName);
  if (!roleConfig) {
    // Could be a custom role — only CEO/Admin can assign those
    if (assignerRoles.some(r => CUSTOM_ROLE_ASSIGNERS.includes(r))) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Unknown role. Only CEO or Admin can assign custom roles.' };
  }
  if (roleConfig.isPreExisting) {
    return { allowed: false, reason: `The "${targetRoleName}" role is pre-existing and cannot be assigned via this interface.` };
  }
  const hasAuthority = assignerRoles.some(ar => roleConfig.assignedBy.includes(ar));
  if (!hasAuthority) {
    return {
      allowed: false,
      reason: `You do not have authority to assign the "${targetRoleName}" role. It can only be assigned by: ${roleConfig.assignedBy.join(', ')}.`
    };
  }
  return { allowed: true };
}

/**
 * Check if a role assignment requires Employee precondition.
 */
function requiresEmployeePrecondition(targetRoleName) {
  const roleConfig = ROLE_HIERARCHY.find(r => r.roleName === targetRoleName);
  return roleConfig ? roleConfig.requiresEmployee : true; // default to true for safety
}

/**
 * Check if a role assignment requires a branch.
 */
function isBranchScoped(targetRoleName) {
  const roleConfig = ROLE_HIERARCHY.find(r => r.roleName === targetRoleName);
  return roleConfig ? roleConfig.branchScoped : false;
}

module.exports = {
  ROLE_HIERARCHY,
  CUSTOM_ROLE_ASSIGNERS,
  getRolesAssignableBy,
  canAssignRole,
  requiresEmployeePrecondition,
  isBranchScoped
};
