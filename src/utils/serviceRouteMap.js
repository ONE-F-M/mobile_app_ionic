export const serviceRouteMap = {
  "Checkin Checkout": "/checkin",
  "Leaves": "/leaves",
  "New Leave Application": "/leaves/add",
  "Pay Slips": "/payslip",
  "Employee Resignation": "/resignation",
  "Resignation Withdrawal": "/resignation/withdraw",
  "Resignation Extension": "/resignation/extend",
  "Advances": "/advance",
  "Letters": "/letter"
};

export const getServiceRoute = (service) => {
  return serviceRouteMap[service] || "/service";
};

// Withdrawal and Extension are actions reached from inside Employee
// Resignation, not standalone features -- they should never appear as their
// own entry anywhere a user picks/manages services (home screen, Manage
// Services), only "Employee Resignation" should.
export const RESIGNATION_SUB_SERVICES = ["Resignation Withdrawal", "Resignation Extension"];
