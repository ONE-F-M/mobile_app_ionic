export const serviceRouteMap = {
  "Checkin Checkout": "/checkin",
  "Leaves": "/leaves",
  "New Leave Application": "/leaves/add",
  "Pay Slips": "/payslip",
  "Employee Resignation": "/resignation",
  "Resignation Withdrawal": "/resignation/withdraw",
  "Resignation Extension": "/resignation/extend",
  "Advances": "/advance",
  "Letters": "/letter",
  // WI-002301: keyed on the App Service name the backend creates - rename either and
  // the tile silently falls back to /service.
  "Uniform Request": "/uniform-request"
};

// Paths registered in src/router/index.js; most routes are unnamed, so router.hasRoute cannot be used.
export const REGISTERED_SERVICE_ROUTES = [
  "/checkin",
  "/leaves",
  "/leaves/add",
  "/resignation",
  "/resignation/withdraw",
  "/resignation/extend",
  "/uniform-request",
];

export const getServiceRoute = (service) => {
  const route = serviceRouteMap[service];
  return route && REGISTERED_SERVICE_ROUTES.includes(route) ? route : null;
};

// Withdrawal and Extension are actions reached from inside Employee
// Resignation, not standalone features -- they should never appear as their
// own entry anywhere a user picks/manages services (home screen, Manage
// Services), only "Employee Resignation" should.
export const RESIGNATION_SUB_SERVICES = ["Resignation Withdrawal", "Resignation Extension"];
